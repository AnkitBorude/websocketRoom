import WebSocket from "ws";
import { RequstType } from "./request.enum";
import {
  ChatMessage,
  CreateMessage,
  JoinMessage,
  RenameMessage,
  RoomNotificationMessage,
} from "./types";
type Client = {
  id: number;
  name: string;
  ws: WebSocket;
};

type Room = {
  id: number;
  name: string;
  clients: Client[];
};

export class RoomManager {
  clientStart: number = 0;
  roomIdStart: number = 80;

  private chatRooms: Map<number, Room> = new Map();
  private clients: Map<number, Client> = new Map();
  private wsToClientId = new Map<WebSocket, number>();
  createClient(ws: WebSocket): Client {
    this.clientStart++;
    const client = {
      id: this.clientStart,
      name: "User " + this.clientStart,
      ws,
    };
    this.clients.set(client.id, client);
    this.wsToClientId.set(ws, client.id);

    client.ws.on("close", () => {
      this.removeClient(client);
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

    this.roomIdStart++;
    const room: Room = {
      id: this.roomIdStart,
      clients: [client],
      name: name,
    };

    this.chatRooms.set(this.roomIdStart, room);
    const response = this.messageFactory(
      RequstType.CREATE,
      "Room Created Successfully your are part of your room",
    )(name, this.roomIdStart);
    ws.send(JSON.stringify(response));
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

    client.name = newUsername;
    const response = this.messageFactory(
      RequstType.RENAME,
      "Username Changed",
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
        )(roomId, client.name);
        ws.send(JSON.stringify(response));
        return;
      }

      const roomToJoin = this.chatRooms.get(roomId);
      const JoinNotificationToOthers: RoomNotificationMessage = {
        type: "notify",
        message: `${client.name} has Joined the Room`,
        notificationOf: RequstType.JOIN,
      };
      const JoinNotificationToUser: RoomNotificationMessage = {
        type: "notify",
        message: `Joined to room ${roomToJoin?.name} current Online ${roomToJoin?.clients.length}`,
        notificationOf: RequstType.JOIN,
      };
      roomToJoin?.clients.push(client);
      client.ws.send(JSON.stringify(JoinNotificationToUser));

      roomToJoin?.clients.forEach((client) => {
        client.ws.send(JSON.stringify(JoinNotificationToOthers));
      });
    }
  }

  // Overload signatures
  private messageFactory(
    request: RequstType.CREATE,
    message: string,
  ): (roomName: string, roomId: number) => CreateMessage;
  private messageFactory(
    request: RequstType.JOIN,
    message: string,
  ): (roomId: number, username: string) => JoinMessage;
  private messageFactory(
    request: RequstType.MESSAGE,
    message: string,
  ): (roomId: number, message: string) => ChatMessage;
  private messageFactory(
    request: RequstType.RENAME,
    message: string,
  ): (username: string) => RenameMessage;

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
        return (roomId: number, username: string): JoinMessage => ({
          type: request,
          roomId,
          username,
          message,
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
      default:
        throw new Error("Invalid request type");
    }
  }

  private removeClient(client: Client) {
    //delete client from the all clients map
    //remove the client from the chatrooms
    //if the chatroom has zero clients then delete that room too
    //as we do not allow empty rooms by the way
    const emptyRooms: number[] = [];
    for (const room of this.chatRooms.values()) {
      room.clients = room.clients.filter((c) => c.id !== client.id);
      if (room.clients.length == 0) {
        emptyRooms.push(room.id);
      }
    }

    //delete empty rooms

    emptyRooms.forEach((roomId) => {
      this.chatRooms.delete(roomId);
    });

    this.clients.delete(client.id);
    this.wsToClientId.delete(client.ws);

    console.log("Client Disconnected");
    console.log("Emptied rooms" + emptyRooms.join(","));
  }

  private getClientBySocket(ws: WebSocket): Client | undefined {
    const clientId = this.wsToClientId.get(ws);
    return clientId !== undefined ? this.clients.get(clientId) : undefined;
  }
}
