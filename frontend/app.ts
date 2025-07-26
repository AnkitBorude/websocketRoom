import { attachButtonHandlers, bindInputBoxes,initializeState } from "./dom.client.js";
// import { connectWebSocket } from "./socket.client.js";

// const hostname=window.location.host;
//initialize state
initializeState();

//attach Handlers
document.addEventListener("DOMContentLoaded", () => {
  attachButtonHandlers();
  bindInputBoxes();
});


// //connect with websocket 
// connectWebSocket(hostname);