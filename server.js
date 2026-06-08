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

let startingPlayer = 'P1';
let activePlayer = 'P1';
let endedTurnPlayers = new Set();

io.on('connection', (socket) => {
  if (connectedClients.length >= 2) {
    // Zamiast blokować, wyrzucamy najstarsze połączenie (tzw. sesję-widmo po odświeżeniu)
    const oldestClient = connectedClients.shift();
    oldestClient.emit('error', { msg: 'You were disconnected because a new player joined (or you refreshed).' });
    oldestClient.disconnect();
  }

  const role = connectedClients.length === 0 ? 'P1' : 'P2';
  socket.role = role;
  connectedClients.push(socket);
  
  console.log(`[${role}] connected. Total: ${connectedClients.length}`);
  
  socket.emit('role', { role: role });

  if (connectedClients.length === 2) {
    console.log("Both players connected. Starting game!");
    startingPlayer = Math.random() < 0.5 ? 'P1' : 'P2';
    activePlayer = startingPlayer;
    endedTurnPlayers.clear();
    io.emit('gameStart', { startingPlayer: startingPlayer });
  }

  socket.on('playCard', (data) => {
    // Broadcast to the other player
    socket.broadcast.emit('playCard', data);
  });

  socket.on('endTurn', () => {
    endedTurnPlayers.add(socket.role);
    console.log(`[${socket.role}] ended turn. Total ended: ${endedTurnPlayers.size}`);
    
    if (endedTurnPlayers.size === 2) {
      console.log("Both players ended turn! Initiating combat.");
      
      // Determine who starts next round
      const nextStartingPlayer = startingPlayer === 'P1' ? 'P2' : 'P1';
      startingPlayer = nextStartingPlayer;
      activePlayer = nextStartingPlayer;
      
      io.emit('startCombat', { nextStartingPlayer: nextStartingPlayer });
      endedTurnPlayers.clear();
    } else {
      // Switch active player
      activePlayer = socket.role === 'P1' ? 'P2' : 'P1';
      io.emit('turnSwitch', { activePlayer: activePlayer });
    }
  });

  socket.on('disconnect', () => {
    connectedClients = connectedClients.filter(c => c.id !== socket.id);
    readyClients.delete(socket.id);
    console.log(`[${socket.role}] disconnected. Total: ${connectedClients.length}`);
    socket.broadcast.emit('opponentDisconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
