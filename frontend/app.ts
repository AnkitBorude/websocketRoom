import { connectWebSocket } from "./socket.client.js";
import {appendInfoAlert,appendOwnMessageBubble,appendRecievedMessageBubble} from './dom.client.js';
const hostname=window.location.host;
connectWebSocket(hostname);
appendInfoAlert("Hello");