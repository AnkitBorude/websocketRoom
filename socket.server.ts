import { RequstType } from "./request.enum";
import { RoomManager } from "./RoomManager.service";
import { server } from "./static.server";
import WebSocket from "ws";
import { ConnectionMessage } from "./types";

const webSocketServer = new WebSocket.Server({ server });
const roomService = new RoomManager();
const PORT = 3000;

webSocketServer.on("connection", (websocket) => {
  const client = roomService.createClient(websocket);
  const response: ConnectionMessage = {
    id: client.id,
    type: RequstType.CONNECT,
    username: client.name,
    message: "Welcome to server",
  };
  console.log("New Client connected on server");

  websocket.send(JSON.stringify(response));

  websocket.on("message", (data) => {
    let parsedObj: Record<string, string> = {};
    try {
      parsedObj = JSON.parse(data.toString("utf-8"));
    } catch (error) {
      const errora = error as Error;
      console.error(error);
      websocket.send("Server Error " + errora.name);
    }
    switch (parsedObj.type) {
      case RequstType.CREATE:
        roomService.createRoom(websocket, parsedObj.roomName);
        break;
      case RequstType.JOIN:
        roomService.joinRoom(websocket, parseInt(parsedObj.roomId));
        break;
      case RequstType.MESSAGE:
        //message on room
        break;
      case RequstType.RENAME:
        roomService.renameUser(websocket, parsedObj.username);
        break;
      default:
        websocket.send(
          JSON.stringify({ type: "error", message: "Invalid message type" }),
        );
    }
  });
});

server.listen(PORT, () => {
  console.log("Server Listening on port " + PORT);
});

//user will create rooms and others can join them
