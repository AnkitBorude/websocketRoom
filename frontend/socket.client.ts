
import { appendOwnMessageBubble} from "./dom.client.js";
import { BaseMessage, CreateMessage, JoinMessage, LeaveMessage, RenameMessage} from "./types.client.js";
import { incomingMessageEvent } from "./state.js";


let socket:WebSocket;


export function connectWebSocket(hostname: string): WebSocket {
 socket = new WebSocket('ws://'+hostname);

  socket.addEventListener('open', () => {
    console.log('[Socket] Connected!');
  });
  socket.addEventListener('message', (event) => {
    incomingMessageHandler(event.data);
  });

  socket.addEventListener('close',()=>{
    console.log('[Socket] Disconnected');
  });

  socket.addEventListener('error',(event)=>{
    console.log('[Socket] Message:', event);
  })

  socket.onerror = (err) => console.error('Error:', err);
  
  return socket;
}

export function createRoom(payload:CreateMessage)
{
    if(isSocketOpen())
    {
      //Send message to server
      try{
      socket.send(JSON.stringify(JSON.stringify(payload)));
      }catch(error)
      {
        appendOwnMessageBubble("Problem while creating room client side error");
        console.log(error);
      }
    }
    appendOwnMessageBubble("Problem during connection : SOCKET CLOSED");
   
}

export function renameUser(payload:RenameMessage)
{
  if(isSocketOpen())
    {
      //Send message to server
      try{
      socket.send(JSON.stringify(JSON.stringify(payload)));
      }catch(error)
      {
        appendOwnMessageBubble("Problem while modifying usernmae : client side error");
        console.log(error);
      }
    }
    appendOwnMessageBubble("Problem during connection : SOCKET CLOSED");
}

export function joinRoom(payload:JoinMessage)
{
  if(isSocketOpen())
    {
      //Send message to server
      try{
      socket.send(JSON.stringify(JSON.stringify(payload)));
      }catch(error)
      {
        appendOwnMessageBubble("Problem while joining room client side error");
        console.log(error);
      }
    }
    appendOwnMessageBubble("Problem during connection : SOCKET CLOSED");
}

export function leaveRoom(payload:LeaveMessage)
{
  if(isSocketOpen())
    {
      //Send message to server
      try{
      socket.send(JSON.stringify(JSON.stringify(payload)));
      }catch(error)
      {
        appendOwnMessageBubble("Problem while leaving the room client side error");
        console.log(error);
      }
    }
    appendOwnMessageBubble("Problem during connection : SOCKET CLOSED");
}

function isSocketOpen():boolean
{
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn(`Socket is not open or connected`);
    //Implement retrying logic here (setTimeout)
    return false;
  }
  return true;
}


function incomingMessageHandler(message:string)
{
    let messageObject:BaseMessage;
    try{
      messageObject=JSON.parse(message);
    }
    catch(error)
    {
      console.error("Invalid JSON STRING"+error);
      return;
    }
    incomingMessageEvent.emit(messageObject.type,messageObject);
}