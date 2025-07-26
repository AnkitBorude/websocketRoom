import WebSocket from "ws";
import { RequstType } from "./request.enum";
import {
  ChatMessage,
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

  createClient(ws: WebSocket): Client {
    this.clientIdCounter++;
    const client = {
      id: this.clientIdCounter,
      name: "User " + this.clientIdCounter,
      ws,
    };
    this.clients.set(client.id, client);
    this.wsToClientId.set(ws, client.id);

    client.ws.on("close", () => {
      this.removeClient(ws);
    });

    return client;
  }

  createRoom(ws: WebSocket, name: string) {
    //create Room and ad creator client in that room
    const client = this.getClientBySocket(ws);
    if (!client) {
      const response = this.messageFactory(
        RequstType.CREATE,
        "Client not found 404",
      )(name, -404);
      ws.send(JSON.stringify(response));
      return;
    }

    this.roomIdCounter++;
    const room: Room = {
      id: this.roomIdCounter,
      clients: [],
      name: name,
    };
    // //setting the clients roomId
    // client.roomId = this.roomIdCounter;

    this.chatRooms.set(this.roomIdCounter, room);
    const response = this.messageFactory(
      RequstType.CREATE,
      "Room Created Successfully your are part of your room",
    )(name, this.roomIdCounter);
    ws.send(JSON.stringify(response));
    this.joinRoom(ws,this.roomIdCounter);
  }

  renameUser(ws: WebSocket, newUsername: string) {
    const client = this.getClientBySocket(ws);
    if (!client) {
      const response = this.messageFactory(
        RequstType.RENAME,
        "Client not found 404",
      )(newUsername);
      ws.send(JSON.stringify(response));
      return;
    }
    const previousname = client.name;
    client.name = newUsername;
    const response = this.messageFactory(
      RequstType.RENAME,
      `Username  from ${previousname} to ${newUsername} Changed `,
    )(newUsername);
    ws.send(JSON.stringify(response));
    return;
  }

  joinRoom(ws: WebSocket, roomId: number) {
    const client = this.getClientBySocket(ws);

    if (client) {
      if (!this.chatRooms.has(roomId)) {
        const response = this.messageFactory(
          RequstType.JOIN,
          "Room NOT Found 404",
        )(roomId, client.name,0,'Not 404 Found');
        ws.send(JSON.stringify(response));
        return;
      }

      if (client.roomId && client.roomId > this.roomIdStart) {
        //if the client is part of any room then
        //leave previous room
        this.leaveRoom(ws);
      }
      const roomToJoin = this.chatRooms.get(roomId);
      if(roomToJoin)
      {
        client.roomId = roomToJoin.id;
        roomToJoin.clients.push(client);
        const JoinMessageToUser=this.messageFactory(RequstType.JOIN,`Joined to room ${roomToJoin?.name} current Online ${roomToJoin?.clients.length}`)
        (roomToJoin.id,roomToJoin.name,roomToJoin?.clients.length,roomToJoin?.name);

        const JoinNotificationToOthers: RoomNotificationMessage = {
        type:RequstType.NOTIFY,
        message: `${client.name} has Joined the Room`,
        notificationOf: RequstType.JOIN,
        };
      
      client.ws.send(JSON.stringify(JoinMessageToUser));
      roomToJoin?.clients.forEach((eclient) => {
        if(eclient!=client){
        eclient.ws.send(JSON.stringify(JoinNotificationToOthers));
        }
      });
      }     
    }
  }

  leaveRoom(ws: WebSocket) {
    const client = this.getClientBySocket(ws);

    if (!client) {
      const response = this.messageFactory(
        RequstType.LEAVE,
        "Client not found 404",
      )(-404);
      ws.send(JSON.stringify(response));
      return;
    }

    if (!client.roomId) {
      const response = this.messageFactory(
        RequstType.LEAVE,
        "Client Not a part of any room yet",
      )(-400);
      ws.send(JSON.stringify(response));
      return;
    }

    const currentRoom = this.chatRooms.get(client.roomId);

    if (currentRoom) {
      currentRoom.clients = currentRoom.clients.filter(
        (c) => c.id !== client.id,
      );

      if (currentRoom.clients.length == 0) {
        //if room is empty
        const idTodelete = currentRoom.id;
        this.chatRooms.delete(currentRoom?.id);
        console.log("Deleted Empty if any rooms" + idTodelete);
      } else {
        const LeaveNotificationToOthers: RoomNotificationMessage = {
          type: RequstType.NOTIFY,
          message: `${client.name} has left the Room`,
          notificationOf: RequstType.LEAVE,
        };
        //broadcast message to all room parterner about client
        currentRoom.clients.forEach((client) => {
          client.ws.send(JSON.stringify(LeaveNotificationToOthers));
        });
      }
    } else {
      client.roomId = undefined;
    }

    const leftNotificationToUser: LeaveMessage = this.messageFactory(
      RequstType.LEAVE,
      `Left the room ${currentRoom?.name}`,
    )(currentRoom?.id ?? 404);
    client.roomId = undefined;
    client.ws.send(JSON.stringify(leftNotificationToUser));
  }

  // sendMessage(ws:WebSocket,message:string)
  // {
  //   //STEP1:get client and check if it exists or not
  //   //STEP2:check if the client is part of any room
  //   //i.e has the room id
  //   //STEP3: if the client is part of any room
  //     //Broadcast message to all roomates
  //   //STEP4: if the client is part of any name
  // }
  // Overload signatures
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
  ): (roomId: number, message: string) => ChatMessage;
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
        return (roomId: number, message: string): ChatMessage => ({
          type: request,
          roomId,
          message,
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
}
