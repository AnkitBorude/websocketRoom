import WebSocket from "ws";
import { RequstType } from "./request.enum";
import {
  ChatMessage,
  ConnectionMessage,
  CreateMessage,
  JoinMessage,
  LeaveMessage,
  RenameMessage,
  RoomNotificationMessage,
} from "./types";
type Client = {
  id: number;
  name: string;
  ws: WebSocket;
  roomId?: number;
};

type Room = {
  id: number;
  name: string;
  clients: Client[];
};

export class RoomManager {
  private readonly clientIdStart = 0;
  private readonly roomIdStart = 80;

  clientIdCounter: number = this.clientIdStart;
  roomIdCounter: number = this.roomIdStart;

  private chatRooms: Map<number, Room> = new Map();
  private clients: Map<number, Client> = new Map();
  private wsToClientId = new Map<WebSocket, number>();

  createClient(ws: WebSocket){
    this.clientIdCounter++;
    const client = {
      id: this.clientIdCounter,
      name: "User " + this.clientIdCounter,
      ws,
    };

    this.clients.set(client.id, client);
    this.wsToClientId.set(ws, client.id);

    const response: ConnectionMessage = {
    id: client.id,
    type: RequstType.CONNECT,
    username: client.name,
    message: "Welcome to server",
    };
    client.ws.on("close", () => {
      this.removeClient(ws);
    });

    ws.send(JSON.stringify(response));
  }

  createRoom(ws: WebSocket, name: string) {
    //create Room and ad creator client in that room
    const client = this.getClientBySocket(ws);
    if(!this.isClientExists(ws,client)){return;}
    this.roomIdCounter++;
    const room: Room = {
      id: this.roomIdCounter,
      clients: [],
      name: name,
    };
    this.chatRooms.set(this.roomIdCounter, room);
    const response = this.messageFactory(
      RequstType.CREATE,
      `Room Created Successfully RoomID: ${room.id} RoomName: ${room.name}`,
    )(name, room.id);
    ws.send(JSON.stringify(response));
    this.joinRoom(ws,room.id);
  }

  renameUser(ws: WebSocket, newUsername: string) {
    const client = this.getClientBySocket(ws);
    if(!this.isClientExists(ws,client)){return;}
    if(!client){return;}

    const previousname = client.name;
    client.name = newUsername;

    const response = this.messageFactory(
      RequstType.RENAME,
      `Username changed successfully from ${previousname} to ${newUsername} `,
    )(newUsername);

    ws.send(JSON.stringify(response));

    const clientRoom=this.isPartofAroom(ws,client,false);

    if(clientRoom){
      const roomNotification=this.createClientNotificationofMessage(
        `User ${client.id} Changed his username from ${previousname} to ${newUsername}`,
        RequstType.RENAME
      );
      this.broadcastNotification(clientRoom,client,roomNotification)
    }
  }

  joinRoom(ws: WebSocket, roomId: number) {
    const client = this.getClientBySocket(ws);
    if(!this.isClientExists(ws,client)){return;}
    if(!client){return;}

    //check whether the passed roomId exists
    const roomToJoin = this.chatRooms.get(roomId);
    if (!roomToJoin) {
        const response = this.messageFactory(
          RequstType.JOIN,
          "Room NOT Found 404",
        )(roomId, client.name,0,'Not 404 Found');
        ws.send(JSON.stringify(response));
        return;
      }
    
      const clientsRoom=this.isPartofAroom(ws,client,false);
      if(clientsRoom){
        this.leaveRoom(ws);
      }
     
        client.roomId = roomToJoin.id;
        roomToJoin.clients.push(client);
        const JoinMessageToUser=this.messageFactory(RequstType.JOIN,`Joined room ${roomToJoin.name} current Online ${roomToJoin?.clients.length}`)
        (roomToJoin.id,roomToJoin.name,roomToJoin.clients.length,roomToJoin.name);

      const JoinNotificationToOthers=this.createClientNotificationofMessage(`${client.name} has Joined the Room`,
        RequstType.JOIN
      )
      client.ws.send(JSON.stringify(JoinMessageToUser));
      this.broadcastNotification(roomToJoin,client,JoinNotificationToOthers);    
  }

  leaveRoom(ws: WebSocket) {
    const client = this.getClientBySocket(ws);
    if(!this.isClientExists(ws,client)){return;}
    if(!client){return;};
    const currentRoom=this.isPartofAroom(ws,client);
    if(!currentRoom){return;}

  
      currentRoom.clients = currentRoom.clients.filter(
        (c) => c.id !== client.id,
      );

      if (currentRoom.clients.length == 0) {
        //if room is empty
        this.chatRooms.delete(currentRoom.id);
        client.roomId=undefined;
      } else {
        const leaveNotificationToOthers=this.createClientNotificationofMessage(`${client.name} has left the Room`,RequstType.LEAVE);
        this.broadcastNotification(currentRoom,client,leaveNotificationToOthers);
      }

    const leftNotificationToUser: LeaveMessage = this.messageFactory(
      RequstType.LEAVE,
      `Left the room ${currentRoom?.name}`,
    )(currentRoom.id);

    client.roomId = undefined;
    
    client.ws.send(JSON.stringify(leftNotificationToUser));
  }

  sendMessage(ws:WebSocket,message:string)
  {
    const client=this.getClientBySocket(ws);
    if(!this.isClientExists(ws,client)){return;}
    //just to off this f*cking eslint error of undefined client
    if(!client){return};
    const room=this.isPartofAroom(ws,client)
    if(!room){return;}
    if(room.clients.length==0)
    {
      //room is empty
      const notification=this.createClientNotificationofMessage('Room is empty please let other to join to send message',RequstType.MESSAGE);
      ws.send(notification);
      return;
    }

    const messageTobeSent=this.messageFactory(RequstType.MESSAGE,message.trim())(room.id,client.name);
    room.clients.forEach((otherClient)=>{
      if(client!=otherClient)
      {
       otherClient.ws.send(JSON.stringify(messageTobeSent));
      }
    })
    
    const successNotificationToClient=this.createClientNotificationofMessage("Message Sent Successfully",RequstType.MESSAGE);
    ws.send(successNotificationToClient);
  }
  // Overloade signatures
  private messageFactory(
    request: RequstType.CREATE,
    message: string,
  ): (roomName: string, roomId: number) => CreateMessage;
  private messageFactory(
    request: RequstType.JOIN,
    message: string,
  ): (roomId: number, username: string,activeUsers:number,roomName:string) => JoinMessage;
  private messageFactory(
    request: RequstType.MESSAGE,
    message: string,
  ): (roomId: number,sender:string) => ChatMessage;
  private messageFactory(
    request: RequstType.RENAME,
    message: string,
  ): (username: string) => RenameMessage;

  private messageFactory(
    request: RequstType.LEAVE,
    message: string,
  ): (roomId: number) => LeaveMessage;

  // Implementation
  private messageFactory(request: RequstType, message: string) {
    switch (request) {
      case RequstType.CREATE:
        return (roomName: string, roomId: number): CreateMessage => ({
          type: request,
          roomName,
          roomId,
          message,
        });
      case RequstType.JOIN:
        return (roomId: number, username: string,activeUsers:number,roomName:string): JoinMessage => ({
          type: request,
          roomId,
          username,
          message,
          activeUsers,
          roomName
        });
      case RequstType.MESSAGE:
        return (roomId: number,sender:string): ChatMessage => ({
          type: request,
          roomId,
          message,
          sender
        });
      case RequstType.RENAME:
        return (username: string): RenameMessage => ({
          type: request,
          username,
          message,
        });
      case RequstType.LEAVE:
        return (roomId: number): LeaveMessage => ({
          type: request,
          roomId,
          message,
        });
      default:
        throw new Error("Invalid request type");
    }
  }

  private removeClient(ws: WebSocket) {
    //delete client from the all clients map
    //remove the client from the chatrooms
    //if the chatroom has zero clients then delete that room too
    //as we do not allow empty rooms by the way
    this.leaveRoom(ws);
    const client = this.getClientBySocket(ws);
    if (client) {
      this.clients.delete(client.id);
    }
    this.wsToClientId.delete(ws);
    console.log("Client Disconnected");
  }

  private getClientBySocket(ws: WebSocket): Client | undefined {
    const clientId = this.wsToClientId.get(ws);
    return clientId !== undefined ? this.clients.get(clientId) : undefined;
  }

  private isClientExists(ws:WebSocket,client:Client | undefined)
  {
   if (!client) {
      const response = this.messageFactory(
        RequstType.LEAVE,
        "Client not found 404",
      )(404);
      ws.send(JSON.stringify(response));
      return false;
    }
    return true;
  }

  private isPartofAroom(ws:WebSocket,client:Client,notifyClient:boolean=true)
  {
    if(client.roomId)
    {
      //check if that room exists or not
      const room=this.chatRooms.get(client.roomId);
      if(room)
      {
        //roomExists
        //verify if the client is present in that room or not
        if(room?.clients.includes(client)){
          //client exists in room too
          return room;
        }
      }
      client.roomId=undefined;
    }
    if(notifyClient)
    {
    const notification=this.createClientNotificationofMessage(` ${client.id} ${client.name} Not a part of any room yet`,RequstType.NOTIFY);
    ws.send(notification);
    }
    
    return undefined;
  }

  private createClientNotificationofMessage(message:string,type:RequstType){
     const notification:RoomNotificationMessage={
        message:message.trim(),
        notificationOf:type,
        type:RequstType.NOTIFY
      }
      return JSON.stringify(notification);
  }

  private broadcastNotification(room:Room,sender:Client,notification:string)
  {
    room.clients.forEach((otherClient) => {
        if(otherClient!=sender){
        otherClient.ws.send(notification);
        }
      });
  }
}
