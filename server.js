import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve all static files in the current directory
app.use(express.static(__dirname));

let connectedClients = [];
let readyClients = new Set();

io.on('connection', (socket) => {
  if (connectedClients.length >= 2) {
    socket.emit('error', { msg: 'Server full. Max 2 players.' });
    socket.disconnect();
    return;
  }

  const role = connectedClients.length === 0 ? 'P1' : 'P2';
  socket.role = role;
  connectedClients.push(socket);
  
  console.log(`[${role}] connected. Total: ${connectedClients.length}`);
  
  socket.emit('role', { role: role });

  if (connectedClients.length === 2) {
    console.log("Both players connected. Starting game!");
    io.emit('gameStart');
  }

  socket.on('playCard', (data) => {
    // Broadcast to the other player
    socket.broadcast.emit('playCard', data);
  });

  socket.on('readyForCombat', () => {
    readyClients.add(socket.id);
    console.log(`[${socket.role}] ready for combat.`);
    
    if (readyClients.size === 2) {
      console.log("Both players ready! Initiating combat.");
      io.emit('startCombat');
      readyClients.clear();
    }
  });

  socket.on('disconnect', () => {
    connectedClients = connectedClients.filter(c => c.id !== socket.id);
    readyClients.delete(socket.id);
    console.log(`[${socket.role}] disconnected. Total: ${connectedClients.length}`);
    socket.broadcast.emit('opponentDisconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
