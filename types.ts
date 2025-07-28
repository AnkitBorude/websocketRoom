import { RequstType } from "./request.enum";


export interface BaseMessage{
    type:RequstType,
    message:string
}

export interface CreateMessage extends BaseMessage{
  type: RequstType.CREATE;
  message: string;
  roomName: string;
  roomId: number;
};

export interface JoinMessage extends BaseMessage {
  type: RequstType.JOIN;
  message: string;
  roomId: number;
  roomName:string;
  username: string;
  activeUsers:number
};


export interface ChatMessage extends BaseMessage {
  type: RequstType.MESSAGE;
  roomId: number;
  message: string;
  sender:string
};

export interface RenameMessage extends BaseMessage {
  type: RequstType.RENAME;
  username: string;
  message: string;
};

export interface ConnectionMessage extends BaseMessage {
  type: RequstType.CONNECT;
  id: number;
  username: string;
  message: string;
};

export interface LeaveMessage extends BaseMessage{
  type: RequstType.LEAVE;
  roomId: number;
  message: string;
};

export interface RoomNotificationMessage extends BaseMessage {
  type: RequstType.NOTIFY;
  message: string;
  notificationOf:RequstType;
};
