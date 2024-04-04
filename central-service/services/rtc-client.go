package services

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

var (
	RTCWebSocketURL = "ws://rtc-service:8080/ws"

	PONG_WAIT     = 10 * time.Second
	PING_INTERVAL = (PONG_WAIT * 9) / 10
)

type RTCClient struct {
	Name       string
	Connection *websocket.Conn
	Ingress    chan RTCClientResponse
}

type RTCClientResponse struct {
	RespStatus  string                   `json:"status"`
	RespMessage RTCClientResponseMessage `json:"message"`
	RespType    string                   `json:"responseType"`
}

type RTCClientResponseMessage struct {
	RoomID     string `json:"roomID"`
	Data       string `json:"data"`
	UserHandle string `json:"userHandle"`
}

func InitializeRTCClient(name string) (*RTCClient, error) {
	conn, _, err := websocket.DefaultDialer.Dial(RTCWebSocketURL, nil)
	if err != nil {
		return nil, err
	}
	// go pingHandler(conn)
	return &RTCClient{
		Name:       name,
		Connection: conn,
		Ingress:    make(chan RTCClientResponse),
	}, nil
}

func (client *RTCClient) SendMessage(requestType string, data interface{}) (*RTCClientResponse, error) {
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
	// Send message
	log.Println("send start")
	err = client.Connection.WriteMessage(websocket.TextMessage, jsonMessage)
	if err != nil {
		return nil, err
	}
	log.Println("send end")
	// Read response
	// log.Println("read start")
	// _, responseBytes, err := client.Connection.ReadMessage()
	// if err != nil {
	// 	log.Println("Error reading rtc-service response: %v", err)
	// 	return nil, err
	// }
	// log.Println("read end")
	// // Unmarshal response
	// var responseObject RTCClientResponse
	// err = json.Unmarshal(responseBytes, &responseObject)
	// if err != nil {
	// 	return nil, err
	// }
	responseObject := <-client.Ingress
	return &responseObject, nil
}

func (client *RTCClient) Close() error {
	// Close the WebSocket connection
	err := client.Connection.Close()
	if err != nil {
		return err
	}
	return nil
}

func (client *RTCClient) IngressHandler() {
	for {
		messageType, message, err := client.Connection.ReadMessage()
		if err != nil {
			log.Printf("Failed to read message: %v", err)
			break
		}
		if messageType == websocket.PingMessage {
			// Respond with a Pong message
			if err := client.Connection.WriteMessage(websocket.PongMessage, message); err != nil {
				log.Printf("Failed to respond to ping: %v", err)
				break
			}
		} else {
			// Unmarshal response
			var responseObject RTCClientResponse
			err = json.Unmarshal(message, &responseObject)
			if err != nil {
				log.Printf("Failed to unmarshal response message: %v", err)
				break
			}
			// Pass non-ping messages to the SendMessage method
			client.Ingress <- responseObject
		}
	}
}

// func pingHandler(conn *websocket.Conn) {
// 	for {
// 		if _, _, err := conn.ReadMessage(); err != nil {
// 			return
// 		}
// 		if err := conn.WriteMessage(websocket.PongMessage, []byte{}); err != nil {
// 			log.Printf("Ping Error: %v", err)
// 			return
// 		}
// 	}
// }
