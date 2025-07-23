import { server } from "./static.server";
import WebSocket from "ws";

const webSocketServer = new WebSocket.Server({ server });

webSocketServer.on("connection", (websocket) => {
  websocket.on("message", (data) => {
    const object = JSON.parse(data.toString("utf-8"));
    console.log(object);
  });
});
