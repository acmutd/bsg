# RTC Service

This is a WebSocket server that provides real-time communication between users and several services. To use this server, follow the steps below:

1. Clone the repository to your local machine.
2. Navigate to the `rtc-service` folder.
3. Start the server by running `go run .`

## Interacting with the Server

### Requests

Once you have connected to the server, you can send and receive messages in real-time. The server supports the following events:

- **Join Room**: Sent by a service when a user joins a room.
- **Leave Room**: Sent by a service when they leave a room.
- **Chat Message**: Sent by a user to send a message to all other users within a room.
- **New Room Created**: Sent by a service when a new room has been created.
- **Round Started**: Sent by a service when a round has started in a room.
- **Round Ended**: Sent by a service when a round has ended in a room.

To send an event to the server, send a JSON object with the following properties:

- `request-type`: The name of the event to send.
- `data`: A string containing any data to send with the event.

For example, to send a `Leave Room` request with the you would send the following JSON object:

```json
{
    "request-type": "leave-room"
    "data": "{
        "userHandle": "xyz"
        "roomId": "xyz"
    }"
}
```

### Responses

Once you sent a request to the server, the server will respond with a JSON object with the following properties:

- `status`: A string that can either be `ok` or `error`.
- `message`: A string containing a message sent from the RTC service.
- `message-type`: A string containing the type of message which can either be `general`, `system-announcement`, `chat-message`.
    - `general`: The response is general and can be chosen how the response will be handled.
    - `system-announcement`: The response is a intended for the user and the service should allow the user to view the message content of the response.
    - `chat-message`: The response is a message intended for chatting between users. This will indicate whether a chat message was successfully sent or not.


```json
{
    "status": "message",
    "message": "xyz",
    "message-type": "xyz"
}
```
