import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './auth';
import type { Server } from 'http';

interface AuthenticatedWebSocket extends WebSocket {
	userId?: string;
	isAlive: boolean;
}

interface NotificationMessage {
	type: 'NEW_FOLLOWER' | 'NEW_ENERGY' | 'NEW_COMMENT' | 'NEW_POST' | 'SYSTEM';
	message: string;
	data?: Record<string, any>;
	timestamp: number;
}

// Mapa de conexiones activas: userId -> Set de WebSockets
const connections = new Map<string, Set<AuthenticatedWebSocket>>();

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server): void {
	wss = new WebSocketServer({
		server,
		path: '/ws/notifications'
	});

	wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
		ws.isAlive = true;

		// Extraer token de la query string
		const url = new URL(req.url || '', `http://${req.headers.host}`);
		const token = url.searchParams.get('token');

		if (!token) {
			ws.close(4001, 'Token requerido');
			return;
		}

		// Verificar token
		const payload = await verifyToken(token).catch(() => null);
		if (!payload) {
			ws.close(4002, 'Token inválido');
			return;
		}

		ws.userId = payload.userId;

		// Registrar conexión
		if (!connections.has(payload.userId)) {
			connections.set(payload.userId, new Set());
		}
		connections.get(payload.userId)!.add(ws);

		// Enviar confirmación
		sendToSocket(ws, {
			type: 'SYSTEM',
			message: 'Conectado a notificaciones en tiempo real',
			timestamp: Date.now()
		});

		// Ping/pong para mantener conexión
		ws.on('pong', () => {
			ws.isAlive = true;
		});

		ws.on('message', (data) => {
			try {
				const message = JSON.parse(data.toString());
				
				// Manejar ack de notificaciones
				if (message.type === 'ACK') {
					// Marcar notificación como leída en BD si es necesario
					console.log('Notification acknowledged:', message.notificationId);
				}
			} catch (e) {
				// Ignorar mensajes malformados
			}
		});

		ws.on('close', () => {
			if (ws.userId) {
				const userConnections = connections.get(ws.userId);
				if (userConnections) {
					userConnections.delete(ws);
					if (userConnections.size === 0) {
						connections.delete(ws.userId);
					}
				}
			}
		});

		ws.on('error', (error) => {
			console.error('WebSocket error:', error);
		});
	});

	// Heartbeat para limpiar conexiones muertas
	const heartbeat = setInterval(() => {
		wss?.clients.forEach((ws: AuthenticatedWebSocket) => {
			if (!ws.isAlive) {
				ws.terminate();
				return;
			}
			ws.isAlive = false;
			ws.ping();
		});
	}, 30000);

	wss.on('close', () => {
		clearInterval(heartbeat);
	});

	console.log('WebSocket server initialized on /ws/notifications');
}

// Enviar mensaje a un socket específico
function sendToSocket(ws: AuthenticatedWebSocket, message: NotificationMessage): void {
	if (ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(message));
	}
}

// Broadcast de notificación a un usuario
export function broadcastNotification(
	userId: string,
	notification: Omit<NotificationMessage, 'timestamp'>
): void {
	const userConnections = connections.get(userId);
	if (!userConnections || userConnections.size === 0) {
		return; // Usuario no conectado, se manejará por polling
	}

	const message: NotificationMessage = {
		...notification,
		timestamp: Date.now()
	};

	userConnections.forEach(ws => {
		sendToSocket(ws, message);
	});
}

// Broadcast a múltiples usuarios (ej: nuevos posts de seguidos)
export function broadcastToUsers(
	userIds: string[],
	notification: Omit<NotificationMessage, 'timestamp'>
): void {
	const message: NotificationMessage = {
		...notification,
		timestamp: Date.now()
	};

	userIds.forEach(userId => {
		const userConnections = connections.get(userId);
		if (userConnections) {
			userConnections.forEach(ws => {
				sendToSocket(ws, message);
			});
		}
	});
}

// Obtener estadísticas de conexiones
export function getWebSocketStats(): {
	totalConnections: number;
	uniqueUsers: number;
} {
	let totalConnections = 0;
	connections.forEach(userConns => {
		totalConnections += userConns.size;
	});

	return {
		totalConnections,
		uniqueUsers: connections.size
	};
}

// Cerrar todas las conexiones (para shutdown graceful)
export function closeAllConnections(): void {
	wss?.clients.forEach(ws => {
		ws.close(1001, 'Server shutting down');
	});
	wss?.close();
}
