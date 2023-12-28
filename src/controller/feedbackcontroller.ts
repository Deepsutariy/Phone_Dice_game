import { mongoDB, MongoDBConnection } from "../config/Conection";
import { Server as SocketIo } from "socket.io";
import Service from "../services/TokenVerify";
import DbCollection from "../constants/db.config";
import SocketService from "../services/SocketService";

class Challenge {
    private db: MongoDBConnection;
    private io: SocketIo;
    private service: Service;
    private socketService: SocketService;

    constructor(io: SocketIo) {
        this.db = mongoDB;
        this.io = io;
        this.service = new Service('token');
        this.socketService = new SocketService(io);
    };


    public feedback = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token, message } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required!!", "feedback");
                return;
            }

            if (!message) {
                this.socketService.sendErrorResponse(socketId, "Message is required!!", "feedback");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, it's not valid !!", "feedback");
                return;
            }

            const currentDate = new Date();
            const formattedDate = this.formatDate(currentDate);

            const feedbackData = {
                email: email,
                message: message,
                datetime: formattedDate
            };

            const result = await db.collection(DbCollection.feedback).insertOne(feedbackData);

            if (result && result.insertedId) {
                this.socketService.sendSuccessResponse(socketId, "Feedback sent successfully.", "feedback", feedbackData);
            } else {
                this.socketService.sendErrorResponse(socketId, "Failed to submit Feedback!!", "feedback");
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong!!", "feedback");
        }
    };


    private formatDate(date: Date): string {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear() % 100;
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const amOrPm = hours >= 12 ? 'pm' : 'am';
        const formattedHours = hours % 12 || 12;

        const formattedDate = `${day}/${month}/${year}, ${formattedHours}:${String(minutes).padStart(2, '0')} ${amOrPm}`;
        return formattedDate;
    };
};

export default Challenge;
