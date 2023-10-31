package main

import (
	"log"
	"net/http"

	"github.com/acmutd/bsg/rtc-service/auth"
	"github.com/acmutd/bsg/rtc-service/database"
)

var (
	port = ":8080"
)

func main() {

	// Create connection to the redis server.
	database.CreateRedisClient()

	wsServer := NewWebsocketServer()
	go wsServer.Run()

	// Create the websocket endpoint.
	http.HandleFunc("/ws", auth.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		ServeWs(wsServer, w, r)
	}))

	// Serve the websocket connections.
	log.Fatal(http.ListenAndServe(port, nil))
}
