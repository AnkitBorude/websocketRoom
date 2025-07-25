

export function connectWebSocket(hostname: string): WebSocket {
  const socket = new WebSocket('ws://'+hostname);

  socket.addEventListener('open', () => {
    console.log('[Socket] Connected!');
  });
  socket.addEventListener('message', (event) => {
    console.log('[Socket] Message:', event.data);
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