import { Server as SocketIo } from "socket.io";

export default class SocketService {
    private io: SocketIo;

    constructor(io: SocketIo) {
        this.io = io;
    }

    public sendSuccessResponse(socketId: string, message: string, action: string, data: any): void {
        this.io.to(socketId).emit("request", { success: true, message, action, data });
    }

    public sendErrorResponse(socketId: string, message: string, action: string): void {
        this.io.to(socketId).emit("request", { success: false, message, action });
    }
}
