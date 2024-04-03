package services

import (
	"encoding/json"

	"github.com/gorilla/websocket"
)

var (
	RTCWebSocketURL = "ws://rtc-service:8080/ws"
)

type RTCClient struct {
	name string
	conn *websocket.Conn
}

func InitializeRTCClient(name string) (*RTCClient, error) {
	conn, _, err := websocket.DefaultDialer.Dial(RTCWebSocketURL, nil)
	if err != nil {
		return nil, err
	}
	return &RTCClient{name, conn}, nil
}

func (client *RTCClient) SendMessage(requestType string, data interface{}) error {
	// Construct JSON message
	message := struct {
		Name        string      `json:"name"`
		RequestType string      `json:"request-type"`
		Data        interface{} `json:"data"`
	}{
		Name:        client.name,
		RequestType: requestType,
		Data:        data,
	}

	// Marshal JSON
	jsonMessage, err := json.Marshal(message)
	if err != nil {
		return err
	}

	// Send JSON message to server
	err = client.conn.WriteMessage(websocket.TextMessage, jsonMessage)
	if err != nil {
		return err
	}
	return nil
}

func (client *RTCClient) Close() error {
	// Close the WebSocket connection
	err := client.conn.Close()
	if err != nil {
		return err
	}
	return nil
}
