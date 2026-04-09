
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nova-ticket-secret-key-2026';

// Mock Database for Events and Prices (Single Source of Truth)
const EVENT_DATA: Record<string, { 
  id: string, 
  title: string, 
  basePrice: number, 
  openingTime: number, // Timestamp
  notified5Min: boolean,
  notifiedNow: boolean,
  zones: Record<string, number> // Zone name -> Price
}> = {
  '1': { 
    id: '1', 
    title: 'Taylor Swift | The Eras Tour', 
    basePrice: 2500, 
    openingTime: Date.now() - 100000, // Already open
    notified5Min: true,
    notifiedNow: true,
    zones: { 'VVIP (Row A-B)': 15000, 'VIP (Row C-E)': 9500, 'Standing A': 6500, 'Standard (Row H-J)': 3500 }
  },
  '7': { 
    id: '7', 
    title: 'CHA EUN-WOO 2026 [Mystery Elevator]', 
    basePrice: 2500, 
    openingTime: Date.now() + 10 * 60 * 1000, // Opens in 10 minutes for demo
    notified5Min: false,
    notifiedNow: false,
    zones: { 'VVIP (Row A-B)': 15000, 'VIP (Row C-E)': 9500, 'Standing A': 6500, 'Standard (Row H-J)': 3500 }
  }
};

// Persistent store for bookings (Server-side)
const USER_BOOKINGS: Record<string, any[]> = {}; // email -> Booking[]

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // --- Booking Persistence ---
  app.get('/api/bookings/:email', (req, res) => {
    const { email } = req.params;
    res.json(USER_BOOKINGS[email] || []);
  });

  app.post('/api/bookings', (req, res) => {
    const { email, booking } = req.body;
    if (!USER_BOOKINGS[email]) {
      USER_BOOKINGS[email] = [];
    }
    USER_BOOKINGS[email].unshift(booking);
    res.json({ success: true });
  });

  // --- Secure Price Validation ---
  app.post('/api/checkout/validate', (req, res) => {
    const { eventId, seats } = req.body;
    const event = EVENT_DATA[eventId];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Calculate total based on server-side prices (Single Source of Truth)
    let total = 0;
    const validatedSeats = seats.map((seatId: string) => {
      const row = seatId.charAt(0);
      // Determine zone from row (matching SeatingPlan.tsx logic but on server)
      let zonePrice = event.basePrice;
      if (['A', 'B'].includes(row)) zonePrice = event.zones['VVIP (Row A-B)'];
      else if (['C', 'D', 'E'].includes(row)) zonePrice = event.zones['VIP (Row C-E)'];
      else if (['F', 'G'].includes(row)) zonePrice = event.zones['Standing A'];
      else if (['H', 'I', 'J'].includes(row)) zonePrice = event.zones['Standard (Row H-J)'];
      
      total += zonePrice;
      return { id: seatId, price: zonePrice };
    });

    const fee = 200;
    const finalTotal = total + fee;

    // Create a signed token to prevent tampering in the next step
    const validationToken = jwt.sign({
      eventId,
      seats,
      total: finalTotal,
      timestamp: Date.now()
    }, JWT_SECRET, { expiresIn: '15m' });

    res.json({
      success: true,
      total: finalTotal,
      token: validationToken
    });
  });

  // --- Real-time Notification System & Task Scheduling ---
  // In a real production environment with 100k+ users:
  // 1. Use Redis Pub/Sub to sync Socket.io across multiple server instances.
  // 2. Use BullMQ (Redis-backed) for reliable task scheduling and retries.
  // 3. Batch broadcasts to avoid CPU spikes.
  
  cron.schedule('* * * * *', () => {
    const now = Date.now();
    console.log('Checking for notifications at:', new Date().toISOString());

    Object.values(EVENT_DATA).forEach(event => {
      const timeDiff = event.openingTime - now;

      // 1. Pre-sale Notification (5 minutes before)
      if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000 && !event.notified5Min) {
        console.log(`Broadcasting 5-min notification for: ${event.title}`);
        io.emit('notification', {
          type: 'UPCOMING_SALE',
          title: 'Get Ready!',
          message: `Tickets for ${event.title} will be available in 5 minutes!`,
          eventId: event.id
        });
        event.notified5Min = true;
      }

      // 2. Exact Opening Notification
      if (timeDiff <= 0 && !event.notifiedNow) {
        console.log(`Broadcasting opening notification for: ${event.title}`);
        io.emit('notification', {
          type: 'SALE_OPEN',
          title: 'Tickets are LIVE!',
          message: `Go go go! Tickets for ${event.title} are now available for booking.`,
          eventId: event.id
        });
        event.notifiedNow = true;
      }
    });
  });

  // In-memory store for locked seats
  const lockedSeats: Record<string, Record<string, { userId: string, timestamp: number }>> = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      if (lockedSeats[roomId]) {
        socket.emit('initial-locks', lockedSeats[roomId]);
      }
    });

    socket.on('lock-seat', ({ roomId, seatId, userId }: { roomId: string, seatId: string, userId: string }) => {
      if (!lockedSeats[roomId]) lockedSeats[roomId] = {};
      if (lockedSeats[roomId][seatId] && lockedSeats[roomId][seatId].userId !== userId) {
        socket.emit('lock-failed', { seatId, message: 'Seat already locked' });
        return;
      }
      lockedSeats[roomId][seatId] = { userId, timestamp: Date.now() };
      io.to(roomId).emit('seat-locked', { seatId, userId });
    });

    socket.on('unlock-seat', ({ roomId, seatId, userId }: { roomId: string, seatId: string, userId: string }) => {
      if (lockedSeats[roomId]?.[seatId]?.userId === userId) {
        delete lockedSeats[roomId][seatId];
        io.to(roomId).emit('seat-unlocked', { seatId });
      }
    });

    socket.on('disconnecting', () => {
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
  });

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
