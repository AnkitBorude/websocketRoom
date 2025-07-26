import { currentState,oldState,incomingMessageEvent } from "./state.js";
import { ButtonHandlerMap, ConnectionMessage, CreateMessage, ElementType, InputBoxTypes, JoinMessage, LeaveMessage, RenameMessage, RequstType, RoomNotificationMessage } from "./types.client.js";

const MESSAGE_BOX= document.getElementById('messageBox');


const elementMap: Record<ElementType, HTMLElement | null> = {
  roomId: document.getElementById("roomId"),
  roomName: document.getElementById("roomName"),
  activeMember: document.getElementById("activeMember"),
  username: document.getElementById("username"),
  userId:document.getElementById("userId")
};

const InputelementMap: Record<InputBoxTypes, HTMLElement | null> = {
    JOIN_ROOM_INPUT:document.getElementById('join-roomId-input'),
    CREATE_ROOM_INPUT: document.getElementById('create-room-input'),
    MESSAGE_INPUT: document.getElementById('message-input'),
};
const buttonHandlerMap: ButtonHandlerMap = {
  joinRoomBtn: JoinRoombtnHandler,
  createRoomBtn: CreateRoombtnHandler,
  sendMessageBtn: SendMessagebtnHandler,
  updateUsernamebtn: RenamebtnHandler,
  leaveRoomBtn: LeaveRoombtnHandler,
};

export function bindInputBoxes()
{
  const isAllBinded=Object.values(InputelementMap).every((element)=>{
    return element ? true: false;});

  if(!isAllBinded ){console.error("Problem with inputBox Binding check correct ids is assigned")}
}


export function appendRecievedMessageBubble(senderName: string, messageText: string) {
  if (!MESSAGE_BOX) {
    console.error('[appendMessageBubble] messageBox not found in DOM');
    return;
  }

  const time = new Date();
  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wrapper = document.createElement('div');
  wrapper.className = "flex flex-col w-full max-w-[450px] leading-1.5 ps-2 p-1 border-2 border-white/20 bg-transparent rounded-e-xl rounded-es-xl";

  wrapper.innerHTML = `
    <div class="flex items-center space-x-2">
      <span class="text-sm font-semibold text-white">${senderName}</span>
      <span class="text-sm font-normal text-gray-200">${formattedTime}</span>
    </div>
    <p class="text-sm font-normal text-white">${messageText}</p>
  `;
  MESSAGE_BOX.appendChild(wrapper);
}

export function appendOwnMessageBubble(messageText: string) {
  if (!MESSAGE_BOX) {
    console.error('[appendOwnMessageBubble] messageBox not found in DOM');
    return;
  }

  const time = new Date();
  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wrapper = document.createElement('div');
  wrapper.className =
    "flex flex-col w-full max-w-[400px] ps-2 p-1 leading-1.5 border-2 border-white/20 bg-transparent rounded-s-xl rounded-ee-xl self-end";

  wrapper.innerHTML = `
    <p class="text-sm font-normal text-white">${messageText}</p>
    <span class="text-sm font-normal text-gray-200 self-end pe-2">${formattedTime}</span>
  `;

  MESSAGE_BOX.appendChild(wrapper);
}

export function appendInfoAlert(message: string) {
  const messageBox = document.getElementById('messageBox');
  if (!messageBox) {
    console.error('[appendInfoAlert] messageBox not found in DOM');
    return;
  }

  const time = new Date();
  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const alertDiv = document.createElement('div');
  alertDiv.className =
    "p-2 text-sm rounded-lg text-white bg-white/10 backdrop-blur-lg border border-white/20 self-center font-semibold";
  alertDiv.setAttribute("role", "alert");

  alertDiv.innerHTML = `
    <span class="font-bold">Info alert!</span> ${message}
    <span class="text-sm font-normal text-gray-300 pe-2">${formattedTime}</span>
  `;

  messageBox.appendChild(alertDiv);
}

export function updateRoomDetailsElementValue(type: ElementType, value: string | number) {
  const el = elementMap[type];
  if (!el) {
    console.warn(`[updateElementValue] Element not found for type: ${type}`);
    return;
  }
  //update state 
  currentState.set(type,value);

  el.textContent = value+"";

  // Animate using Tailwind utility classes
  el.classList.add("transition", "duration-300", "ease-in-out", "scale-110", "opacity-0");

  // Force reflow so animation restarts
  void el.offsetWidth;

  el.classList.remove("opacity-0");

  // Reset scale back after animation ends
  setTimeout(() => {
    el.classList.remove("scale-110");
  }, 300);
}

export function JoinRoombtnHandler() {
  console.log("Join room button clicked");
}

export function CreateRoombtnHandler() {
  console.log("Create room button clicked");
}

export function SendMessagebtnHandler() {
  console.log("Send message button clicked");
}

export function RenamebtnHandler() {
  console.log("Rename/Update Username button clicked");
}

export function LeaveRoombtnHandler() {
  console.log("Leave room button clicked");
}


export function attachButtonHandlers() {
  Object.entries(buttonHandlerMap).forEach(([id, handler]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", handler);
    } else {
      console.warn(`[attachButtonHandlers] Button with id '${id}' not found.`);
    }
  });
}


export function initializeState()
{
    currentState.set('activeMember',0);
    currentState.set('roomId',0);
    currentState.set('roomName','Not Joined any Room Yet');
    currentState.set('username','Ananymous');
    currentState.set('userId',0);
    runChangeDetectioninState();
}

incomingMessageEvent.on(RequstType.CREATE,(message:CreateMessage)=>{
  appendOwnMessageBubble(message.message);
});

incomingMessageEvent.on(RequstType.NOTIFY,(message:RoomNotificationMessage)=>{
  appendOwnMessageBubble(message.message);
  if(message.notificationOf==RequstType.JOIN)
  {
    currentState.set('activeMember',+(currentState.get('activeMember') ?? 0 )+1);
    runChangeDetectioninState();
  }
  else if(message.notificationOf==RequstType.LEAVE)
  {
    currentState.set('activeMember',+(currentState.get('activeMember') ?? 0 )-1);
    runChangeDetectioninState();
  }

})

incomingMessageEvent.on(RequstType.CONNECT,(message:ConnectionMessage)=>{
  appendOwnMessageBubble(message.message);
  currentState.set('username',message.username);
  currentState.set('userId',message.id);
  runChangeDetectioninState();
})

incomingMessageEvent.on(RequstType.JOIN,(message:JoinMessage)=>{
  appendOwnMessageBubble(message.message);
  currentState.set('activeMember',message.activeUsers ?? 0);
  currentState.set('roomId',message.roomId);
  currentState.set('roomName',message.roomName ?? "NA");
  runChangeDetectioninState();
});

incomingMessageEvent.on(RequstType.RENAME,(message:RenameMessage)=>{
  appendOwnMessageBubble(message.message);
  currentState.set('username',message.username);
  runChangeDetectioninState();
});

incomingMessageEvent.on(RequstType.LEAVE,(message:LeaveMessage)=>{
  appendOwnMessageBubble(message.message);
  currentState.set('roomId',0);
  currentState.set('roomName','Not Joined any Room Yet');
  currentState.set('activeMember',0);
  runChangeDetectioninState();
});
function runChangeDetectioninState()
{
  currentState.forEach((value,key)=>{
    if(oldState.get(key)!==value || !oldState.get(key))
    {
      oldState.set(key,value);
      updateRoomDetailsElementValue(key,value);
    }
  })
}