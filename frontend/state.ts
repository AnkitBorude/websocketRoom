
import { ElementType} from "./types.client.js";
export const incomingMessageEvent=new EventTarget();
export const oldState:Map<ElementType,string | number>=new Map();
export const currentState:Map<ElementType,string | number>=new Map();




