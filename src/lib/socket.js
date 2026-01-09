import { io } from 'socket.io-client';

// For production, use the base backend URL (without /api)
// For development, use localhost (Vite proxy handles it)
const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';


class SocketClient {
    constructor() {
        this.socket = null;
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                autoConnect: false
            });

            this.socket.on('connect', () => {
                console.log('Socket connected:', this.socket.id);
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            this.socket.connect();
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinProject(projectId) {
        if (this.socket) {
            this.socket.emit('join_project', projectId);
        }
    }

    leaveProject(projectId) {
        if (this.socket) {
            this.socket.emit('leave_project', projectId);
        }
    }

    joinUser(userId) {
        if (this.socket) {
            this.socket.emit('join_user', userId);
        }
    }
}

export const socketService = new SocketClient();
