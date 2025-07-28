import { RequstType } from "./request.enum";
import { RoomManager } from "./RoomManager.service";
import { server } from "./static.server";
import WebSocket from "ws";
import { BaseMessage,ChatMessage,CreateMessage, JoinMessage, RenameMessage } from "./types";

const webSocketServer = new WebSocket.Server({ server });
const roomService = new RoomManager();
const PORT = 3000;

webSocketServer.on("connection", (websocket) => {
  roomService.createClient(websocket);
  console.log("New Client connected on server");
  websocket.on("message", (data) => {
    let parsedObj:BaseMessage;
    try {
      parsedObj = JSON.parse(data.toString("utf-8")) as BaseMessage;
    } catch (error) {
      const errora = error as Error;
      console.error(error);
      websocket.send("Server Error " + errora.name);
      return;
    }
    switch (parsedObj.type) {
      case RequstType.CREATE:
        roomService.createRoom(websocket, (parsedObj as CreateMessage).roomName);
        break;
      case RequstType.JOIN:
        roomService.joinRoom(websocket, (parsedObj as JoinMessage).roomId);
        break;
      case RequstType.MESSAGE:
        roomService.sendMessage(websocket,(parsedObj as ChatMessage).message);
        //message on room
        break;
      case RequstType.RENAME:
        roomService.renameUser(websocket, (parsedObj as RenameMessage).username);
        break;
      case RequstType.LEAVE:
      //on request of leave
      roomService.leaveRoom(websocket);
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
