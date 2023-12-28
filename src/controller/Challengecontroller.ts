import { mongoDB, MongoDBConnection } from "../config/Conection";
import { Server as SocketIo } from "socket.io";
import { ObjectId } from 'mongodb';
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
    }

    public ChallengeFriends = async (data: any, socketId: string): Promise<any> => {
        try {
            const { token, id } = data.spData;
            const db = this.db.getDb();

            if (!token || !id) {
                this.socketService.sendErrorResponse(socketId, "token and id are required !!", "Challenge-Friends");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "Challenge-Friends");
                return;
            }

            const currentTime = new Date();
            const timeAsMilliseconds = currentTime.getTime();

            const challengeDocument = {
                user: email,
                ChallengeID: id,
                socketId: socketId,
                time: timeAsMilliseconds,
                status: "pending",
            };

            const result = await db.collection(DbCollection.Challenge).insertOne(challengeDocument);

            if (result) {
                this.socketService.sendSuccessResponse(socketId, "Send a friend challenge.", "Challenge-Friends", result);
                return;
            } else {
                this.socketService.sendErrorResponse(socketId, "Friend Not Found !!", "Challenge-Friends");
            }
        } catch (err) {
            console.log(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Challenge-Friends");
        }
    };


    public viewChallenge = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "view-Challenge");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const userId = decodedToken.payload.userId;

            if (!userId) {
                this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "view-Challenge");
                return;
            }

            const thirtyMinutesAgo = new Date();
            thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 1);

            const cursor = await db.collection(DbCollection.Challenge).findOne({
                ChallengeID: userId,
                time: {
                    $gte: thirtyMinutesAgo.getTime(),
                    $lte: new Date().getTime(),
                },
            });

            if (cursor) {
                this.socketService.sendSuccessResponse(socketId, "View a friend's challenge.", "view-Challenge", cursor);
                return;
            } else {
                this.socketService.sendErrorResponse(socketId, "Challenge Not Found !!", "view-Challenge");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "view-Challenge");
        }
    };


    public addDailychallenges = async (data: any, socketId: string): Promise<void> => {
        try {
            const { name } = data.spData;
            const db = this.db.getDb();

            if (!name) {
                this.socketService.sendErrorResponse(socketId, "Challenges name is required!!", "add-Daily-challenge");
                return;
            }

            const currentDate = new Date();

            await db.collection(DbCollection.Dailychallenges).insertOne({
                name: name,
                pointRequirement: 10,
                completedBy: [],
                createdAt: currentDate,
            });

            this.socketService.sendSuccessResponse(socketId, `Challenges added.`, "add-Daily-challenge", "");
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "add-Daily-challenge");
        }
    };


    public viewallChallenges = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 1);

            const result = await db.collection(DbCollection.Dailychallenges)
                .find({ createdAt: { $gte: twentyFourHoursAgo } })
                .toArray();

            this.socketService.sendSuccessResponse(socketId, `View All Challenges from the last 24 hours.`, "view-all-Challenges", result);
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "view-all-Challenges");
        };
    };


    public completeDailyChallenge = async (data: any, socketId: string): Promise<void> => {
        try {
            const { token, challengeId, points } = data.spData;
            const db = this.db.getDb();

            if (!token || !challengeId || points === undefined) {
                this.socketService.sendErrorResponse(socketId, "Token, Challenge ID, and points are required!!", "complete-Daily-challenge");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { userId } = decodedToken.payload;

            if (userId === undefined) {
                this.socketService.sendErrorResponse(socketId, "Token check is not valid!!", "complete-Daily-challenge");
                return;
            }

            const challenge = await db.collection(DbCollection.Dailychallenges).findOne({ _id: new ObjectId(challengeId) });

            if (!challenge) {
                this.socketService.sendErrorResponse(socketId, "Challenge not found!!", "complete-Daily-challenge");
                return;
            }

            const userEntryIndex = challenge.completedBy.findIndex(entry => entry.userId === userId);

            if (userEntryIndex !== -1) {
                const userEntry = challenge.completedBy[userEntryIndex];
                const userPoints = userEntry.point;

                const newUserPoints = Math.min(userPoints + points, 10);

                const pointsToAdd = Math.min(10 - userPoints, points);

                if (pointsToAdd > 0) {
                    await db.collection(DbCollection.Dailychallenges).updateOne(
                        { _id: new ObjectId(challengeId), "completedBy.userId": userId },
                        { $inc: { "completedBy.$.point": pointsToAdd } }
                    );

                    this.socketService.sendSuccessResponse(socketId, `Added ${pointsToAdd} points to the challenge.`, "complete-Daily-challenge", "");
                } else {
                    this.socketService.sendSuccessResponse(socketId, "Challenge points limit (10) reached.", "complete-Daily-challenge", "");
                }
            } else {
                const initialPoints = Math.min(points, 10);
                const newUserEntry = { userId, point: initialPoints };
                await db.collection(DbCollection.Dailychallenges).updateOne(
                    { _id: new ObjectId(challengeId) },
                    { $push: { completedBy: newUserEntry } }
                );

                this.socketService.sendSuccessResponse(socketId, "Challenge point set.", "complete-Daily-challenge", "");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "complete-Daily-challenge");
        }
    };


    public ViewDailyChallenge = async (data: any, socketId: string): Promise<void> => {
        try {
            let { token } = data.spData;
            const db = this.db.getDb();

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "View-Daily-Challenge");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { userId } = decodedToken.payload;

            if (!userId) {
                this.socketService.sendErrorResponse(socketId, "please check a Token, is not valid !!", "View-Daily-Challenge");
                return;
            }

            const dailyChallenge = await db.collection(DbCollection.Dailychallenges).find({
                pointRequirement: 10,
                "completedBy.userId": userId,
            }).toArray();

            if (dailyChallenge) {
                this.socketService.sendSuccessResponse(socketId, "View all Challenges.", "View-Daily-Challenge", dailyChallenge);
            } else {
                this.socketService.sendErrorResponse(socketId, "No matching daily challenge found !!", "View-Daily-Challenge");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "View-Daily-Challenge");
        }
    };
}

export default Challenge;
