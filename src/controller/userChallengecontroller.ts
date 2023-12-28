import { mongoDB, MongoDBConnection } from "../config/Conection";
import { Server as SocketIo } from "socket.io";
import Service from "../services/TokenVerify";
import DbCollection from "../constants/db.config";
import SocketService from "../services/SocketService";

class UserChallenge {
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

    public FriendRequest = async (data: any, socketId: string): Promise<any> => {
        try {
            const { token, fromemail } = data.spData;
            const db = this.db.getDb();
            const arr = [];

            if (!token || !fromemail) {
                this.socketService.sendErrorResponse(socketId, "Both username and fromemail are required.", "Friend-Request");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "Friend-Request");
                return;
            }

            const existingRequest = await db.collection(DbCollection.userChallenge).findOne({
                "user.email": email,
                "fromemail": fromemail
            });

            if (existingRequest) {
                this.socketService.sendErrorResponse(socketId, "Friend request already sent.", "Friend-Request");
                return;
            }

            const result = await db.collection(DbCollection.users).find({ email }).toArray();
            const user = result[0];
            const currentDate = new Date();

            arr[0] = { user, timestamp: currentDate, fromemail };

            const insertionResult = await db.collection(DbCollection.userChallenge)
                .insertOne({ user, fromemail, timestamp: currentDate, socketId });

            if (insertionResult) {
                this.socketService.sendSuccessResponse(socketId, "Friend request sent.", "Friend-Request", arr);
            } else {
                this.socketService.sendErrorResponse(socketId, "Failed to send a friend request.", "Friend-Request");
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong.", "Friend-Request");
        }
    };


}

export default UserChallenge;