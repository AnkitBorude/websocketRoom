import { attachButtonHandlers, bindInputBoxes } from "./dom.client.js";
import { connectWebSocket } from "./socket.client.js";

const hostname=window.location.host;
connectWebSocket(hostname);
bindInputBoxes();
document.addEventListener("DOMContentLoaded", () => {
  attachButtonHandlers();
});