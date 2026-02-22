import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import type { ServerToClientEvents, ClientToServerEvents, SocketData } from './types.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: TypedServer | null = null;

export function setupSocket(httpServer: HttpServer): TypedServer {
  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.data.connectedAt = Date.now();
    logger.info({ socketId: socket.id }, 'Client connected');

    socket.on('spot:join', (spotId) => {
      const room = `spot:${spotId}`;
      socket.join(room);
      logger.info({ socketId: socket.id, room }, 'Joined spot room');
    });

    socket.on('spot:leave', (spotId) => {
      const room = `spot:${spotId}`;
      socket.leave(room);
      logger.info({ socketId: socket.id, room }, 'Left spot room');
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Client disconnected');
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

export function getIO(): TypedServer {
  if (!io) {
    throw new Error('Socket.io not initialized — call setupSocket() first');
  }
  return io;
}
