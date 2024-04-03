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
	name string
	conn *websocket.Conn
}

func InitializeRTCClient(name string) (*RTCClient, error) {
	conn, _, err := websocket.DefaultDialer.Dial(RTCWebSocketURL, nil)
	if err != nil {
		return nil, err
	}
	go pingHandler(conn)
	return &RTCClient{name, conn}, nil
}

func (client *RTCClient) SendMessage(requestType string, data interface{}) error {
	// Marshal data
	dataJson, err := json.Marshal(data)
	if err != nil {
		return err
	}
	// Create message
	message := struct {
		Name        string `json:"name"`
		RequestType string `json:"request-type"`
		Data        string `json:"data"`
	}{
		Name:        client.name,
		RequestType: requestType,
		Data:        string(dataJson),
	}
	// Marshal message
	jsonMessage, err := json.Marshal(message)
	if err != nil {
		return err
	}
	// Send message
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

func pingHandler(conn *websocket.Conn) {
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			return
		}
		if err := conn.WriteMessage(websocket.PongMessage, []byte{}); err != nil {
			log.Printf("Ping Error: %v", err)
			return
		}
	}
}
