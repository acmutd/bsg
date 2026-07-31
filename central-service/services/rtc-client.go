package services

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/acmutd/bsg/rtc-service/response"
	"github.com/gorilla/websocket"
)

func rtcWebSocketURL() string {
	if url := os.Getenv("RTC_SERVICE_URL"); url != "" {
		return url
	}
	return "ws://rtc-service:8080/ws"
}

// Default ping/pong timeout and reconnect backoff for the RTC websocket.
const (
	rtcReconnectBaseDelay = 500 * time.Millisecond
	rtcReconnectMaxDelay  = 10 * time.Second
)

type RTCClient struct {
	Name            string
	Connection      *websocket.Conn
	Ingress         chan response.Response
	ConnectionMutex sync.Mutex
	closed          chan struct{}
	closeOnce       sync.Once
}

func expectedResponseType(requestType string) response.ResponseType {
	switch requestType {
	case "join-room":
		return response.SYSTEM_ANNOUNCEMENT
	case "leave-room":
		return response.SYSTEM_ANNOUNCEMENT
	case "chat-message":
		return response.CHAT_MESSAGE
	case "round-start":
		return response.ROUND_START
	case "round-end":
		return response.SYSTEM_ANNOUNCEMENT
	case "next-problem":
		return response.NEXT_PROBLEM
	case "room-expired":
		return response.ROOM_EXPIRED
	default:
		return ""
	}
}

func InitializeRTCClient(name string) (*RTCClient, error) {
	conn, _, err := dialRTC()
	if err != nil {
		return nil, err
	}
	rtcClient := RTCClient{
		Name:            name,
		Connection:      conn,
		Ingress:         make(chan response.Response, 10),
		ConnectionMutex: sync.Mutex{},
		closed:          make(chan struct{}),
	}
	// Start listening for incoming messages
	go rtcClient.IngressHandler()
	return &rtcClient, nil
}

func dialRTC() (*websocket.Conn, *http.Response, error) {
	return websocket.DefaultDialer.Dial(rtcWebSocketURL(), nil)
}

// connect (re)establishes the websocket connection. Callers must hold ConnectionMutex.
func (client *RTCClient) connect() error {
	if client.Connection != nil {
		client.Connection.Close()
		client.Connection = nil
	}

	conn, _, err := dialRTC()
	if err != nil {
		return err
	}
	client.Connection = conn
	log.Printf("RTC client reconnected as %s", client.Name)
	return nil
}

// Sends messages to rtc-service and waits until a response is received
// Returns an error if rtc-service responds with an error
func (client *RTCClient) SendMessage(requestType string, data interface{}) (*response.Response, error) {
	// Marshal data
	dataJson, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	// Create message
	message := struct {
		Name        string `json:"name"`
		RequestType string `json:"request-type"`
		Data        string `json:"data"`
	}{
		Name:        client.Name,
		RequestType: requestType,
		Data:        string(dataJson),
	}
	// Marshal message
	jsonMessage, err := json.Marshal(message)
	if err != nil {
		return nil, err
	}

	// Lock connection
	client.ConnectionMutex.Lock()
	defer client.ConnectionMutex.Unlock()

	// Send message, reconnecting once if the connection is broken
	if err = client.sendWithReconnect(jsonMessage); err != nil {
		return nil, err
	}

	expectedType := expectedResponseType(requestType)
	deadline := time.After(5 * time.Second)

	for {
		select {
		case responseObject := <-client.Ingress:
			if expectedType != "" && responseObject.RespType != expectedType {
				log.Printf("Ignoring RTC response with type %s while waiting for %s", responseObject.RespType, expectedType)
				continue
			}

			if responseObject.RespStatus != "ok" {
				return &responseObject, BSGError{StatusCode: 500, Message: responseObject.Message()}
			}
			return &responseObject, nil
		case <-deadline:
			return nil, BSGError{StatusCode: 504, Message: "Timeout waiting for RTC response"}
		}
	}
}

// sendWithReconnect writes a message, re-establishing the connection once if the write fails.
// ConnectionMutex must be held by the caller.
func (client *RTCClient) sendWithReconnect(jsonMessage []byte) error {
	if client.Connection != nil {
		if err := client.Connection.WriteMessage(websocket.TextMessage, jsonMessage); err == nil {
			return nil
		} else {
			log.Printf("RTC write failed: %v", err)
		}
	}

	if err := client.connect(); err != nil {
		log.Printf("RTC reconnect failed: %v", err)
		return err
	}
	return client.Connection.WriteMessage(websocket.TextMessage, jsonMessage)
}

// Close the WebSocket connection
func (client *RTCClient) Close() error {
	client.closeOnce.Do(func() {
		close(client.closed)
	})
	client.ConnectionMutex.Lock()
	defer client.ConnectionMutex.Unlock()
	if client.Connection == nil {
		return nil
	}
	err := client.Connection.Close()
	client.Connection = nil
	return err
}

// Reads messages from rtc-service and responds to ping requests (default ping handler)
// Automatically reconnects if the connection drops.
func (client *RTCClient) IngressHandler() {
	delay := rtcReconnectBaseDelay
	for {
		client.ConnectionMutex.Lock()
		conn := client.Connection
		client.ConnectionMutex.Unlock()

		if conn == nil {
			select {
			case <-client.closed:
				return
			default:
			}

			client.ConnectionMutex.Lock()
			err := client.connect()
			client.ConnectionMutex.Unlock()
			if err != nil {
				log.Printf("RTC reconnect attempt failed: %v", err)
				select {
				case <-client.closed:
					return
				case <-time.After(delay):
				}
				if delay < rtcReconnectMaxDelay {
					delay *= 2
				}
				continue
			}
			delay = rtcReconnectBaseDelay
			continue
		}

		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Failed to read RTC message: %v", err)

			client.ConnectionMutex.Lock()
			if client.Connection == conn {
				client.Connection = nil
			}
			client.ConnectionMutex.Unlock()

			select {
			case <-client.closed:
				return
			case <-time.After(delay):
			}
			if delay < rtcReconnectMaxDelay {
				delay *= 2
			}
			continue
		}
		delay = rtcReconnectBaseDelay
		log.Println("Received message: ", string(message))
		// Unmarshal response
		var responseObject response.Response
		err = json.Unmarshal(message, &responseObject)
		if err != nil {
			log.Printf("Failed to unmarshal response message: %v", err)
			continue
		}
		// Pass non-control messages to the SendMessage method
		client.Ingress <- responseObject
	}
}
