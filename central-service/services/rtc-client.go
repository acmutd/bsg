package services

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

var (
	RTCWebSocketURL = "ws://rtc-service:8080/ws"
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
	rtcClient := RTCClient{
		Name:       name,
		Connection: conn,
		Ingress:    make(chan RTCClientResponse),
	}
	go rtcClient.IngressHandler() // Start listening for incomingm essages
	return &rtcClient, nil
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
	err = client.Connection.WriteMessage(websocket.TextMessage, jsonMessage)
	if err != nil {
		return nil, err
	}
	// Read response from Ingress
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
		// Read response
		_, message, err := client.Connection.ReadMessage()
		if err != nil {
			log.Printf("Failed to read message: %v", err)
			break
		}
		log.Println("Received message: ", string(message))
		// Unmarshal response
		var responseObject RTCClientResponse
		err = json.Unmarshal(message, &responseObject)
		if err != nil {
			log.Printf("Failed to unmarshal response message: %v", err)
			break
		}
		// Pass non-control messages to the SendMessage method
		client.Ingress <- responseObject
	}
}
