import { RequstType } from "./request.enum";
import { RoomManager } from "./RoomManager.service";
import { server } from "./static.server";
import WebSocket from "ws";
import { ConnectionMessage } from "./types";


const webSocketServer = new WebSocket.Server({ server });
const roomService=new RoomManager();
webSocketServer.on("connection", (websocket) => {

  const client=roomService.createClient(websocket);
  const response:ConnectionMessage={id:client.id,type:RequstType.CONNECT,username:client.name,message:"Welcome to server"};

  websocket.send(JSON.stringify(response));

  websocket.on("message", (data) => {
    const parsedObj:{type:RequstType} = JSON.parse(data.toString("utf-8"));
    switch(parsedObj.type)
    {
      case RequstType.CREATE:
        //create room
        break;
      case RequstType.JOIN:
        //join room
        break;
      case RequstType.MESSAGE:
        //message on room
        break;
      case RequstType.RENAME:
      //rename username
      break;
      default:
        websocket.send(JSON.stringify({ type: 'error', message: 'Invalid message type' }));
    }

  });
});


//user will create rooms and others can join them
