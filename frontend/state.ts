import EventEmitter from "events";
import { ElementType} from "./types.client.js";
export const incomingMessageEvent=new EventEmitter();
export const oldState:Map<ElementType,string | number>=new Map();
export const currentState:Map<ElementType,string | number>=new Map();




