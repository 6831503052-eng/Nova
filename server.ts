
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // In-memory store for locked seats
  // Structure: { [roomId]: { [seatId]: { userId, timestamp } } }
  const lockedSeats: Record<string, Record<string, { userId: string, timestamp: number }>> = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      // Send initial locks for this room
      if (lockedSeats[roomId]) {
        socket.emit('initial-locks', lockedSeats[roomId]);
      }
    });

    socket.on('lock-seat', ({ roomId, seatId, userId }: { roomId: string, seatId: string, userId: string }) => {
      if (!lockedSeats[roomId]) {
        lockedSeats[roomId] = {};
      }

      // Check if already locked by someone else
      if (lockedSeats[roomId][seatId] && lockedSeats[roomId][seatId].userId !== userId) {
        socket.emit('lock-failed', { seatId, message: 'Seat already locked' });
        return;
      }

      lockedSeats[roomId][seatId] = { userId, timestamp: Date.now() };
      io.to(roomId).emit('seat-locked', { seatId, userId });
      console.log(`Seat ${seatId} locked by ${userId} in room ${roomId}`);
    });

    socket.on('unlock-seat', ({ roomId, seatId, userId }: { roomId: string, seatId: string, userId: string }) => {
      if (lockedSeats[roomId] && lockedSeats[roomId][seatId] && lockedSeats[roomId][seatId].userId === userId) {
        delete lockedSeats[roomId][seatId];
        io.to(roomId).emit('seat-unlocked', { seatId });
        console.log(`Seat ${seatId} unlocked by ${userId} in room ${roomId}`);
      }
    });

    socket.on('disconnecting', () => {
      // Unlock all seats held by this user across all rooms
      for (const roomId of socket.rooms) {
        if (lockedSeats[roomId]) {
          for (const seatId in lockedSeats[roomId]) {
            if (lockedSeats[roomId][seatId].userId === socket.id) {
              delete lockedSeats[roomId][seatId];
              io.to(roomId).emit('seat-unlocked', { seatId });
            }
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
