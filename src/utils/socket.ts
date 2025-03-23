import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

/**
 * @class Singleton class for socket.io
 */
class SocketService {
    private static instance: SocketService;
    private io: Server | null = null;

    private constructor() { }   

    /**
     * Get singleton instance
     * 
     * @returns - Singleton instance
     */
    static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    /**
     * Initialize socket.io
     * 
     * @param server - HTTP server
     */
    initialize(server: HttpServer) {
        if (!this.io) {
            this.io = new Server(server, {
                cors: {
                    origin: '*',
                    methods: ['GET', 'POST']
                }
            });

            this.io.on('connection', (socket: Socket) => {
                console.log('A user connected:', socket.id);

                socket.on('disconnect', () => {
                    console.log('User disconnected:', socket.id);
                });
            });
        }
    }

    /**
     * Emit event
     * 
     * @param event - Event name
     * @param data - Data to emit
     */
    emit(event: string, data: any) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}

// Export singleton instance
export const socketService = SocketService.getInstance();
