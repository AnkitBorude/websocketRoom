import { RequstType } from "./request.enum";

export type CreateMessage = {
  type: RequstType.CREATE;
  message: string;
  roomName: string;
  roomId: number;
};

export type JoinMessage = {
  type: RequstType.JOIN;
  message: string;
  roomId: number;
  username: string;
};

export type ChatMessage = {
  type: RequstType.MESSAGE;
  roomId: number;
  message: string;
};

export type RenameMessage = {
  type: RequstType.RENAME;
  username: string;
  message: string;
};

export type ConnectionMessage = {
  type: RequstType.CONNECT;
  id: number;
  username: string;
  message: string;
};

export type LeaveMessage = {
  type: RequstType.LEAVE;
  roomId: number;
  message: string;
};

export type RoomNotificationMessage = {
  type: "notify";
  message: string;
  notificationOf: RequstType.JOIN | RequstType.MESSAGE | RequstType.LEAVE;
};
