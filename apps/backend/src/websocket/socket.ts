import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from '../config';
import logger from '../utils/logger';

let io: SocketIOServer;

export function setupWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    socket.on('subscribe', (room: string) => {
      socket.join(room);
      logger.info(`Client ${socket.id} joined room: ${room}`);
    });

    socket.on('unsubscribe', (room: string) => {
      socket.leave(room);
      logger.info(`Client ${socket.id} left room: ${room}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Emit events from anywhere in the application
export function emitPostUpdate(postId: string, data: any) {
  if (io) {
    io.to('posts').emit('post:update', { postId, data });
  }
}

export function emitAnalyticsUpdate(data: any) {
  if (io) {
    io.to('analytics').emit('analytics:update', data);
  }
}
