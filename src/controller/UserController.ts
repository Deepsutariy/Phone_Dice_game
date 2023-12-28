import { mongoDB, MongoDBConnection } from "../config/Conection";
import { Server as SocketIo } from "socket.io";
import { ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';
import middle from "../middleware/google-passport";
import jwt from 'jsonwebtoken';
import Service from "../services/TokenVerify";
import DbCollection from "../constants/db.config";
import SocketService from "../services/SocketService";
import Daily from "../services/Daily.json";
import Weekly from "../services/weekly.json";
import dbConfig from "../constants/db.config";

class Users {
    private db: MongoDBConnection;
    private io: SocketIo;
    private service: Service;
    private middleInstance: middle;
    private socketService: SocketService;

    constructor(io: SocketIo) {
        this.db = mongoDB;
        this.io = io;
        this.middleInstance = new middle();
        this.middleInstance.setupGoogleStrategy();
        this.service = new Service('token');
        this.socketService = new SocketService(io);
    }

    public createUser = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { name, email, password } = data.spData;
            const saltRounds = 12;

            if (!name) {
                this.socketService.sendErrorResponse(socketId, "Please provide a name.", "registration");
                return;
            } else if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please provide an email.", "registration");
                return;
            } else {
                const existingUser = await db.collection(DbCollection.users).findOne({
                    $or: [
                        {
                            name:
                                { $regex: new RegExp(`^${name}$`, 'i') }
                        },
                        {
                            email: {
                                $regex: new RegExp(`^${email}$`, 'i')
                            }
                        }
                    ]
                });

                if (existingUser) {
                    this.socketService.sendErrorResponse(socketId, "User already exists in the database !!", "registration");
                    return;
                } else {
                    const hashedPassword = await bcrypt.hash(password, saltRounds);
                    const newUser = {
                        name: name,
                        email: email,
                        password: hashedPassword,
                        image: "",
                        Friends: [],
                        status: true,
                        verified: true,
                        cart: [],
                        spData: [],
                        Gold: 100,
                        Tickets: 0,
                        Cash: 1000000,
                        Dice: 0,
                        otp: 0,
                        Graphics: 0,
                        Shadows: 0,
                        Effects: 0,
                        socketId: socketId,
                        role: "User"
                    };
                    const result = await db.collection(DbCollection.users).insertOne(newUser);

                    if (!result) {
                        this.socketService.sendErrorResponse(socketId, "User not inserted.", "registration");
                    } else {
                        this.socketService.sendSuccessResponse(socketId, `Data inserted successfully.`, "registration", newUser);
                    }
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong.", "registration");
        }
    };


    public SignIn = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            let { username, password } = data.spData;
            const jwtid = process.env.jwtid;

            if (!db) {
                this.socketService.sendErrorResponse(socketId, "MongoDB is not connected.", "Signin");
            } else {
                if (username && password) {

                    const cursor = db.collection(DbCollection.users)
                        .aggregate(
                            [
                                {
                                    $match: {
                                        $or: [
                                            { name: username },
                                            { email: username },
                                        ],
                                    },
                                },
                            ]
                        );

                    const existingUser = await cursor.next();

                    if (existingUser) {
                        const passwordMatch = await bcrypt.compare(password, existingUser.password);

                        if (passwordMatch) {
                            const token = jwt.sign({ userId: existingUser._id, username: existingUser.name, email: existingUser.email }, jwtid);

                            await db.collection(DbCollection.users).updateOne(
                                { _id: existingUser._id },
                                { $set: { verified: true } }
                            );

                            this.io.to(socketId).emit("request", { message: "User Login successfully.", action: "Signin", success: true, token, existingUser });
                        } else {
                            this.socketService.sendErrorResponse(socketId, "Password is wrong !!", "Signin");
                        }
                    } else {
                        this.socketService.sendErrorResponse(socketId, "User not found.", "Signin");
                    }
                } else {
                    this.socketService.sendErrorResponse(socketId, "Name or email and password is required.", "Signin");
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong.", "Signin");
        }
    };


    public googleauth = async (data: any, socketId: string): Promise<any> => {
        this.socketService.sendSuccessResponse(socketId, "User Login successful.", "SignIn-Google", "");
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
            } else {
                this.socketService.sendErrorResponse(socketId, "Challenge Not Found !!", "view-Challenge");
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "view-Challenge");
        }
    };


    public MiniBundle = async (data: any, socketId: string): Promise<any> => {
        try {
            var randomNum = Math.floor(Math.random() * 3);
            if (randomNum === 0) {
                this.socketService.sendSuccessResponse(socketId, "Cash", "Mini-Bundle", "Cash");
            } else if (randomNum === 1) {
                this.socketService.sendSuccessResponse(socketId, "Dice", "Mini-Bundle", "Dice");
            } else {
                this.socketService.sendSuccessResponse(socketId, "Gold", "Mini-Bundle", "Gold");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Mini-Bundle");
        };
    };


    public BigBundle = async (data: any, socketId: string): Promise<any> => {
        try {
            var randomNum = Math.floor(Math.random() * 3);
            if (randomNum === 0) {
                this.socketService.sendSuccessResponse(socketId, "Cash", "Big-Bundle", "Cash");
            } else if (randomNum === 1) {
                this.socketService.sendSuccessResponse(socketId, "Dice", "Big-Bundle", "Dice");
            } else {
                this.socketService.sendSuccessResponse(socketId, "Gold", "Big-Bundle", "Gold");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Big-Bundle");
        }
    };


    public payment = async (data: any, socketId: string): Promise<any> => {
        try {
            const private_key = process.env.stripe;
            const stripe = require("stripe")(private_key);
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                mode: "payment",
                line_items: [
                    {
                        price_data: {
                            currency: "INR",
                            product_data: {
                                name: "PhoneDice",
                            },
                            unit_amount: 500 * 100,
                        },
                        quantity: 1,
                    },
                ],
                success_url: "http://localhost:5001/",
            });
            this.io
                .to(socketId)
                .emit("request", { message: "payment", datas: session.url, success: true, action: "payment" });
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "payment");
        }
    };


    public completeTask = async (data: any, socketId: string): Promise<any> => {
        try {
            const taskCompleted = true;
            if (taskCompleted) {
                this.socketService.sendSuccessResponse(socketId, "Congratulations! You completed the task and earned your free bundle.", "complete-Task", "");
            } else {
                this.socketService.sendErrorResponse(socketId, "Task completion failed !!", "complete-Task");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "complete-Task");
        }
    };


    public WatchCollect = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const cashh = 50000;
            let { token } = data.spData;
            let add = true;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "token is required !!", "Watch-Collect");
                return;
            }

            if (add === true) {
                const decodedToken = await this.service.tokenverify(token);
                const { email } = decodedToken.payload;

                if (!email) {
                    this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "Watch-Collect");
                    return;
                }

                const result = await db.collection(DbCollection.users).findOne({ email: email });

                if (result) {
                    const cursor = await db.collection(DbCollection.users).findOneAndUpdate(
                        { email: email },
                        { $inc: { Cash: cashh } }
                    );

                    this.socketService.sendSuccessResponse(socketId, `Thanks for watching, collect your cash ${cashh}.`, "Watch-Collect", "");
                } else {
                    this.socketService.sendErrorResponse(socketId, "User not found !!", "Watch-Collect");
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Watch-Collect");
        }
    };


    public SearchUser = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            let { names, token } = data.spData;

            if (!names) {
                this.socketService.sendErrorResponse(socketId, "Please insert a User Name !!", "SFriend");
                return;
            }

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "SFriend");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            let { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token; it is not valid !!", "SFriend");
                return;
            }

            const query = {
                $or: [
                    {
                        name: {
                            $regex: new RegExp(names, 'i')
                        }
                    },
                    {
                        email:
                        {
                            $regex: new RegExp(names, 'i')
                        }
                    },
                ],
            };

            const aggregationCursor = db.collection(DbCollection.users)
                .aggregate(
                    [
                        {
                            $match: query
                        }
                    ]
                );

            const existingUser = await aggregationCursor.toArray();

            if (!existingUser || existingUser.length === 0) {
                this.socketService.sendErrorResponse(socketId, "User not found !!", "SFriend");
                return;
            }

            const user = existingUser[0];

            const isFriend = user.Friends.find((friend) => {

                return friend.name.toLowerCase() === names.toLowerCase();
            });

            if (isFriend) {
                this.socketService.sendSuccessResponse(socketId, "User is already a friend !!", "SFriend", "");
                return;
            } else {
                const projectionCursor = db.collection(DbCollection.users).aggregate([
                    {
                        $match: query
                    },
                    {
                        $project: {
                            name: 1,
                            email: 1,
                            image: 1,
                            Cash: 1,
                            Gold: 1
                        }
                    }
                ]);

                const existingUsers = await projectionCursor.toArray();

                if (existingUsers.length === 0) {
                    this.socketService.sendErrorResponse(socketId, "No matching results !!", "SFriend");
                    return;
                }
                this.io.to(socketId).emit("request", { success: true, message: "Data", data: existingUsers, action: "SFriend" });
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "SFriend");
        }
    };


    public addedtofriend = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { pendingId, token, key } = data.spData;

            if (!token || !pendingId || key === undefined) {
                this.socketService.sendErrorResponse(socketId, "Token, Pending friend id, and Key are required!", "added-to-friend");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { userId, email, username } = decodedToken.payload;

            if (!userId) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, it is not valid !!", "added-to-friend");
                return;
            }

            const objectId = new ObjectId(userId);
            const objectIds = new ObjectId(pendingId);

            if (key === 'true') {
                const result = await db.collection(DbCollection.users).findOne({ _id: objectId });

                if (!result) {
                    this.socketService.sendErrorResponse(socketId, "User not found!", "added-to-friend");
                    return;
                }

                const userUpdate = await db.collection(DbCollection.users).findOneAndUpdate(
                    {
                        "_id":
                            objectIds,
                        "Friends.email":
                            { $ne: email }
                    },
                    {
                        $addToSet: {
                            "Friends": {
                                "id": new ObjectId(userId),
                                "status": "friend",
                                "email": email,
                                "name": username,
                            }
                        } as any
                    }
                );

                if (!userUpdate) {
                    this.socketService.sendErrorResponse(socketId, "This player already your Friend", "added-to-friend");
                    return;
                }

                const userUpdates = await db.collection(DbCollection.users).updateOne(
                    {
                        "_id":
                            objectId, "Friends.id": objectIds
                    },
                    {
                        $set:
                            { "Friends.$.status": "friend" }
                    }
                );

                if (userUpdates) {
                    this.socketService.sendSuccessResponse(socketId, "Friend request accepted.", "added-to-friend", "");
                    return;

                } else {
                    this.socketService.sendErrorResponse(socketId, "Friend request not found or internal server error!", "added-to-friend");
                    return;
                }
            } else if (key === 'false') {
                const result = await db.collection(DbCollection.users).updateOne(
                    { "_id": objectId },
                    { $pull: { "Friends": { "id": objectIds } } }
                );

                if (result.matchedCount === 0) {
                    this.socketService.sendErrorResponse(socketId, "Friend request not found or internal server error!", "added-to-friend");
                    return;
                } else {
                    this.socketService.sendSuccessResponse(socketId, "Friend request rejected.", "added-to-friend", "");
                    return;
                }
            } else {
                this.socketService.sendErrorResponse(socketId, "Internal server Error.", "added-to-friend");
                return;
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong!", "added-to-friend");
            return;
        };
    };


    public AddUser = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            let { token, id } = data.spData;

            if (!token || !id) {
                this.io.emit("request", { message: "Token and id required.", success: true, action: "AFriend" });
                return;
            }
            const decodedToken = await this.service.tokenverify(token);
            let { username, email, userId } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "AFriend");
                return;
            }

            const existingUser = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(userId) });
            const existingUsers = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(id) });

            const idToCheck = new ObjectId(userId);
            const isUserInFriends = existingUsers.Friends.some(friend =>
                friend.id.equals(idToCheck)
            );
            console.log(isUserInFriends);


            if (isUserInFriends) {
                this.socketService.sendErrorResponse(socketId, "User is already in Friends !!", "AFriend");
                return;
            }

            if (!existingUser) {
                this.socketService.sendErrorResponse(socketId, "User not found !!", "AFriend");
                return;
            }

            if (existingUser.name === username && existingUser._id.equals(new ObjectId(id))) {
                this.socketService.sendErrorResponse(socketId, "Add not yourself !!", "AFriend");
                return;
            }

            const friendObjects = {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                status: "pending"
            };

            const updateResult = await db.collection(DbCollection.users).updateOne(
                { _id: new ObjectId(id) },
                { $push: { Friends: friendObjects } }
            );

            if (updateResult.modifiedCount === 1) {
                this.socketService.sendSuccessResponse(socketId, "Friend added successfully", "AFriend", "");
            } else {
                this.socketService.sendErrorResponse(socketId, "Friend not added !!", "AFriend");
                return;
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "AFriend");
        }
    };


    public Viewnotification = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required!", "View-notification");
                return
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token; it is not valid!", "View-notification");
                return
            }

            const result = await db.collection(DbCollection.users)
                .findOne({ email: email });

            if (result && result.Friends) {
                var pendingFriends = result.Friends.filter(friend => friend.status === 'pending');
            }

            if (result.length === 0) {
                return this.socketService.sendSuccessResponse(socketId, "No pending friend requests found.", "View-notification", "");
            }

            this.socketService.sendSuccessResponse(socketId, "View notification.", "View-notification", pendingFriends);
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong!", "View-notification");
            return;
        };
    };


    public RemoveFriend = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { token, id } = data.spData;

            if (!token || !id) {
                this.socketService.sendErrorResponse(socketId, "Token and Friends ID are required !!", "remove-friend");
                return;
            }

            let objectId;
            try {
                objectId = new ObjectId(id);
            } catch (error) {
                this.socketService.sendErrorResponse(socketId, "Invalid Friends ID format !!", "remove-friend");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            let { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token; it is not valid !!", "remove-friend");
                return;
            }

            const result = await db.collection(DbCollection.users).findOne({ email: email });

            if (result) {
                const friendIndex = result.Friends.findIndex(friend => {
                    return friend.id.toHexString() === objectId.toHexString() && friend.status === "friend";
                });

                if (friendIndex !== -1) {
                    result.Friends.splice(friendIndex, 1);

                    await db.collection(DbCollection.users).updateOne(
                        { email: email },
                        {
                            $set: { Friends: result.Friends }
                        }
                    );

                    this.socketService.sendSuccessResponse(socketId, "Friend removed.", "remove-friend", "");
                } else {
                    this.socketService.sendErrorResponse(socketId, "Friend not found in the user's Friends list or status is not 'friend'!!", "remove-friend");
                }
            } else {
                this.socketService.sendErrorResponse(socketId, "User not found or email not in Friends array !!", "remove-friend");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "remove-friend");
        };
    };


    public ViewFriend = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required!", "View-Friend");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token; it is not valid!", "View-Friend");
                return;
            }

            const userFriends = await db.collection(DbCollection.users)
                .aggregate(
                    [
                        {
                            $match: {
                                email,
                            },
                        },
                        {
                            $unwind: "$Friends",
                        },
                        {
                            $match: {
                                "Friends.status": "friend",
                            },
                        },
                        {
                            $group: {
                                _id: "$_id",
                                friends: {
                                    $push: "$Friends",
                                },
                            },
                        },
                    ]
                ).toArray();

            if (userFriends.length > 0) {
                const friends = userFriends[0].friends;
                console.log(friends);


                // Extract the IDs of the friends
                const friendIds = friends.map(friend => friend.id);
                console.log(friendIds);


                const friendData = await db.collection(dbConfig.users)
                    .aggregate([
                        { $match: { _id: { $in: friendIds } } },
                        {
                            $project: {
                                name: 1,
                                email: 1,
                                image: 1,
                                _id: 1
                            },
                        },
                    ])
                    .toArray();

                if (friendData.length > 0) {

                    this.socketService.sendSuccessResponse(socketId, "View friend list.", "View-Friend", friendData);
                } else {
                    this.socketService.sendErrorResponse(socketId, "Friends not found!", "View-Friend");
                }
            } else {
                this.socketService.sendErrorResponse(socketId, "User's friends not found!", "View-Friend");
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong!", "View-Friend");
        }
    };


    public ProfilePicture = async (data: any, socketId: string, filePath: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const image = /*filePath;*/    `http://165.22.222.197:5001/${filePath}`
            const token = data.token;

            if (!image || !token) {
                this.socketService.sendErrorResponse(socketId, "Please insert a image and token  !!", "Profile-Picture");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            let { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "Profile-Picture");
                return;
            }

            await db.collection(DbCollection.users).updateOne(
                { email: email },
                { $set: { image: image } }
            );

            this.socketService.sendSuccessResponse(socketId, "Profile Picture set.", "Profile-Picture", "");
        } catch (err) {
            // this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Profile-Picture");
        }
    };


    public ChangeUsername = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            let { token, newname } = data.spData;

            if (!newname || !token) {
                this.socketService.sendErrorResponse(socketId, "Please enter name and token !!", "Change-Username");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            let { username } = decodedToken.payload;

            if (!username) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, it is not valid !!", "Change-Username");
                return;
            }

            const existingUsername = await db.collection(DbCollection.users).findOne(
                {
                    $and: [
                        { name: { $regex: new RegExp('^' + newname + '$', 'i') } },
                        { name: { $ne: username } }
                    ]
                }
            );

            if (existingUsername) {
                this.socketService.sendErrorResponse(socketId, "The new username is already taken. Please choose a different one.", "Change-Username");
                return;
            }

            const updatedUser = await db.collection(DbCollection.users).findOneAndUpdate(
                { name: username },
                { $set: { name: newname } },
            );

            if (updatedUser.value) {
                this.socketService.sendSuccessResponse(socketId, "Name updated successfully.", "Change-Username", updatedUser.value);
            } else {
                this.socketService.sendErrorResponse(socketId, "User not found !!", "Change-Username");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Change-Username");
        }
    };


    public ChangeEmail = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            let { newemail, token } = data.spData;

            if (!token || !newemail) {
                this.socketService.sendErrorResponse(socketId, "Please enter both token and new email !!", "Change-Email");
            } else {
                const decodedToken = await this.service.tokenverify(token);
                let { email } = decodedToken.payload;

                if (!email) {
                    this.socketService.sendErrorResponse(socketId, "Please check the token, it is not valid !!", "Change-Email");
                    return;
                }

                const existingEmailUser = await db.collection(DbCollection.users).aggregate(
                    [
                        {
                            $match: { email: newemail }
                        },
                        {
                            $limit: 1
                        }
                    ]
                ).toArray();

                if (existingEmailUser.length > 0) {
                    this.socketService.sendErrorResponse(socketId, "New email already exists. Please choose a different one.", "Change-Email");
                    return;
                }

                const existingUser = await db
                    .collection(DbCollection.users)
                    .findOneAndUpdate(
                        { email: email },
                        { $set: { email: newemail } }
                    );

                if (existingUser.value) {
                    this.socketService.sendSuccessResponse(socketId, "Email updated successfully.", "Change-Email", existingUser.value);
                } else {
                    this.socketService.sendErrorResponse(socketId, "User not found !!", "Change-Email");
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Change-Email");
        }
    };



    public DeleteAccount = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { token, otp } = data.spData;

            if (!token || !otp) {
                this.socketService.sendErrorResponse(socketId, "token and otp is requide !!", "Delete-Account");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            let { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "Delete-Account");
                return;
            }

            if (!otp) {
                this.socketService.sendErrorResponse(socketId, "Please fill in all fields !!", "Delete-Account");
            } else {
                const emailfind = await db.collection(DbCollection.users).findOne({ email: email });

                if (!emailfind) {
                    this.socketService.sendErrorResponse(socketId, "Email not found !!", "Delete-Account");
                }

                if (String(emailfind.otp) === String(otp)) {
                    const existingUser = await db.collection(DbCollection.users).findOneAndUpdate(
                        {
                            email: email,
                        },
                        {
                            $set: {
                                status: false,
                            },
                        }
                    );

                    if (existingUser) {
                        this.socketService.sendSuccessResponse(socketId, "Account deleted successfully.", "Delete-Account", existingUser);
                    } else {
                        this.socketService.sendErrorResponse(socketId, "User not found !!", "Delete-Account");
                    }
                } else {
                    this.socketService.sendErrorResponse(socketId, "Otp not match, please try again !!", "Delete-Account");
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Delete-Account");
        }
    };


    public RecoverAccount = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { token, otp } = data.spData;

            if (!token || !otp) {
                this.socketService.sendErrorResponse(socketId, "Please provide OTP and token !!", "Recover-Account");
                return;
            } else {
                const decodedToken = await this.service.tokenverify(token);
                let { email } = decodedToken.payload;

                if (!email) {
                    this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "Recover-Account");
                    return;
                }

                const existingUser = await db.collection(DbCollection.users).findOne({
                    email: email,
                });
                const otps: number = parseInt(otp);

                if (!existingUser) {
                    this.socketService.sendErrorResponse(socketId, "User not found !!", "Recover-Account");
                }

                if (existingUser.otp !== otps) {
                    this.socketService.sendErrorResponse(socketId, "otp is wrong please check your email !!", "Recover-Account");
                    return;
                } else {
                    await db.collection(DbCollection.users).updateOne(
                        { email: email },
                        {
                            $set: {
                                status: true,
                            },
                        }
                    );

                    this.socketService.sendSuccessResponse(socketId, "Account recovered successfully.", "Recover-Account", existingUser);
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Recover-Account");
        }
    };


    public UserProfile = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Please provide Token !!", "User-Profile");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            let { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, it is not valid !!", "User-Profile");
                return;
            }

            const cursor = await db.collection(DbCollection.users).aggregate(
                [
                    {
                        $match: { email: email }
                    },
                    {
                        $project: {
                            name: 1,
                            email: 1,
                            image: 1,
                            Gold: 1,
                            Tickets: 1,
                            Cash: 1,
                            Dice: 1,
                            Graphics: 1,
                            Shadows: 1,
                            Effects: 1,
                            socketId: 1,
                            appsfx: 1,
                            sfx: 1,
                            volume: 1
                        }
                    }
                ]
            );

            const existingUser = await cursor.next();

            if (!existingUser) {
                this.socketService.sendErrorResponse(socketId, "User not existed !!", "User-Profile");
                return;
            }

            this.socketService.sendSuccessResponse(socketId, "Account View successfully.", "User-Profile", existingUser);
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "User-Profile");
        }
    };


    public SignOut = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Please provide a token!!", "Sign-Out");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token; it is not valid!!", "Sign-Out");
                return;
            }

            const existingUser = await db.collection(DbCollection.users).findOne({
                email: email,
            });

            if (!existingUser) {
                this.socketService.sendErrorResponse(socketId, "User not found!!", "Sign-Out");
                return;
            }

            if (existingUser) {
                await db.collection(DbCollection.users).updateOne(
                    { email: email },
                    { $set: { verified: false } }
                );
                this.socketService.sendSuccessResponse(socketId, "Account signed out successfully.", "Sign-Out", "");
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong!!", "Sign-Out");
        }
    };


    public Graphics = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { token, Graphics, Shadows, Effects } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "Graphics");
                return;
            }

            const isNumberBetween0And100 = (value: any) => {
                const parsedValue = parseInt(value);
                return !isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 100;
            };

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "Graphics");
            } else if (!isNumberBetween0And100(Graphics)) {
                this.socketService.sendErrorResponse(socketId, "Invalid value for Graphics. It should be an integer between 0 and 100.", "Graphics");
            } else {
                const decodedToken = await this.service.tokenverify(token);
                const { email } = decodedToken.payload;

                if (!email) {
                    this.socketService.sendErrorResponse(socketId, "Please check the token, it is not valid !!", "Graphics");
                    return;
                }

                const feedbackData = {
                    user: email,
                    Graphics: parseInt(Graphics),
                    Shadows: Shadows === 'true',
                    Effects: Effects === 'true',
                };

                const aggregationResult = await db.collection(DbCollection.users).aggregate(
                    [
                        {
                            $match: { email: email, verified: true }
                        },
                        {
                            $project: {
                                Graphics: feedbackData.Graphics,
                                Shadows: feedbackData.Shadows,
                                Effects: feedbackData.Effects,
                            }
                        }
                    ]
                ).toArray();

                if (aggregationResult.length > 0) {
                    const updatedResult = await db.collection(DbCollection.users).updateOne(
                        { email: email, verified: true },
                        {
                            $set: {
                                Graphics: feedbackData.Graphics,
                                Shadows: feedbackData.Shadows,
                                Effects: feedbackData.Effects,
                            },
                        }
                    );

                    if (updatedResult.modifiedCount > 0) {
                        this.socketService.sendSuccessResponse(socketId, "Graphics set successfully.", "Graphics", feedbackData);
                    } else {
                        this.socketService.sendErrorResponse(socketId, "Failed to submit data or user sign out, please sign in !!", "Graphics");
                    }
                } else {
                    this.socketService.sendErrorResponse(socketId, "User not found !!", "Graphics");
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Graphics");
        }
    };


    public async Audio(data: any, socketId: string): Promise<void> {
        try {
            const db = this.db.getDb();
            const { token, Volume, SFX, AppSFX } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Please provide a valid token.", "Audio");
                return;
            }

            if (Volume <= 0 || Volume >= 100) {
                this.socketService.sendErrorResponse(socketId, "Invalid value for Volume. Please provide a value between 0 and 100.", "Audio");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email || !decodedToken.payload || !decodedToken.payload.email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, it is not valid !!", "Audio");
                return;
            }

            const sfx = Boolean(SFX);
            const appsfx = Boolean(AppSFX);
            const volumes = parseInt(Volume);

            const userExists = await db.collection(DbCollection.users).findOne({ email: email });

            if (!userExists) {
                this.socketService.sendErrorResponse(socketId, "User not found.", "Audio");
                return;
            }

            const updatedUser = await db.collection(DbCollection.users).findOneAndUpdate(
                { email: email },
                [
                    {
                        $set: {
                            volume: volumes,
                            sfx: sfx,
                            appsfx: appsfx
                        }
                    }
                ]
            );

            if (updatedUser) {
                this.socketService.sendSuccessResponse(socketId, "Audio settings updated successfully.", "Audio", updatedUser.value);
            } else {
                this.socketService.sendErrorResponse(socketId, "Failed to update audio settings.", "Audio");
            }

        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong.", "Audio");
        }
    };


    public DailyGoldenDice = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token, giftData } = data.spData || { token: "", giftData: null };

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "Dice-Daily");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const email = decodedToken.payload.email;

            if (!email || !decodedToken.payload || !decodedToken.payload.email) {
                this.socketService.sendErrorResponse(socketId, "Invalid token !!", "Dice-Daily");
                return;
            }

            const userCollection = db.collection(DbCollection.users);
            const user = await userCollection.findOne({ email });

            if (!user) {
                this.socketService.sendErrorResponse(socketId, "User not found !!", "Dice-Daily");
                return;
            }

            const currentTime = new Date();
            const lastClaimedTime = user.lastDailyGiftClaimed || new Date(0);
            const timeDifference = currentTime.getTime() - lastClaimedTime.getTime();

            if (timeDifference < 24 * 60 * 60 * 1000) {
                this.socketService.sendErrorResponse(socketId, "You can only claim one gift per day. Please wait !!", "Dice-Daily");
                return;
            }

            const insertData: { email: string; claimedAt: Date; giftData?: any } = {
                email,
                claimedAt: currentTime,
            };

            if (giftData !== null) {
                insertData.giftData = giftData;
            }

            const updateResult = await userCollection.findOneAndUpdate(
                { email },
                { $set: { GiftTime: insertData, lastDailyGiftClaimed: currentTime }, $inc: { Gold: 20 } }
            );

            if (updateResult) {
                this.socketService.sendSuccessResponse(socketId, "20 gold coins claimed successfully.", "Dice-Daily", Daily);
            } else {
                this.socketService.sendErrorResponse(socketId, "Failed to claim the daily gift.", "Dice-Daily");
            }

        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Dice-Daily");
        }
    };


    public DailyGoldenDiceWeekly = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token, giftData } = data.spData || { token: "", giftData: null };

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required!!", "Dice-Weekly");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token; it is not valid!!", "Dice-Weekly");
                return;
            }

            const usersCollection = db.collection(DbCollection.users);
            const user = await usersCollection.findOne({ email: email });

            if (!user) {
                this.socketService.sendErrorResponse(socketId, "User not found!!", "Dice-Weekly");
            }

            const currentTime = new Date();
            const lastClaimedTime = user?.lastWeeklyGiftClaimed || new Date(0);
            const timeDifference = currentTime.getTime() - lastClaimedTime.getTime();

            if (timeDifference < 7 * 24 * 60 * 60 * 1000) {
                this.socketService.sendErrorResponse(socketId, "You can only claim one gift per week. Please wait!!", "Dice-Weekly");
            } else {
                const insertData: { email: string; claimedAt: Date; giftData?: any } = {
                    email: email,
                    claimedAt: currentTime,
                };

                if (giftData !== null) {
                    insertData.giftData = giftData;
                }

                const result = await usersCollection.findOneAndUpdate(
                    { email: email },
                    { $set: { GiftTime: insertData, lastWeeklyGiftClaimed: currentTime } },
                    { returnDocument: "after" }
                );

                if (result) {
                    const golds = result.Gold;
                    const Gcoin = parseInt(golds);
                    const coin = Gcoin + 50;

                    await usersCollection.updateOne(
                        { email: email },
                        { $set: { Gold: coin } }
                    );

                    this.socketService.sendSuccessResponse(socketId, "50 gold coins, Weekly gift claimed successfully.", "Dice-Weekly", Weekly);
                } else {
                    this.socketService.sendErrorResponse(socketId, "Failed to save gift data!!", "Dice-Weekly");
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong!!", "Dice-Weekly");
        };
    };


    public DailyGoldenDiceChallenges = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token } = data.spData

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "token is requide.", "Dice-Challenges");
            } else {
                this.socketService.sendSuccessResponse(socketId, "Daily golden dice challenges completed.", "Dice-Challenges", "");
            }

        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong.", "Dice-Challenges");
        }
    };


    public DailyBonus = async (data: any, socketId: string): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { token } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required.", "Daily-Bonus");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token; it is not valid!", "Daily-Bonus");
                return;
            }

            const user = await db.collection(DbCollection.users).findOne({ email });

            if (!user) {
                this.socketService.sendErrorResponse(socketId, "User not found.", "Daily-Bonus");
                return;
            }

            const now = new Date();
            const lastClaimed = user.LastClaimed || new Date(0);
            const timeDifference = now.getTime() - lastClaimed.getTime();
            const hoursDifference = timeDifference / (1000 * 60 * 60);

            if (hoursDifference < 24) {
                this.socketService.sendErrorResponse(socketId, `You can claim the bonus again in ${24 - hoursDifference} hours.`, "Daily-Bonus");
                return;
            }

            const randomMultiplier = Math.floor(Math.random() * 10) + 1;
            const cashAmount = randomMultiplier * 100;
            const amount = user.Cash + cashAmount;

            await db.collection(DbCollection.users).updateOne(
                { email },
                {
                    $set: { Cash: amount, LastClaimed: now },
                }
            );

            this.socketService.sendSuccessResponse(socketId, `You collected ${cashAmount} cash as your daily bonus.`, "Daily-Bonus", { Cash: amount });
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong.", "Daily-Bonus");
        }
    };


    public Goldcash = async (data: any, socketId: string): Promise<void> => {
        try {
            const { coin, token } = data.spData;
            const db = this.db.getDb();

            if (!token || !coin) {
                this.socketService.sendErrorResponse(socketId, "Token and gold coin amount are required !!", "Gold-cash");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token; it is not valid !!", "Gold-cash");
                return;
            }

            const user = await db.collection(DbCollection.users).findOne({ email: email });

            if (user) {
                if (user.Gold >= coin) {
                    const cashAmount = coin * 3000;

                    const result = await db.collection(DbCollection.users).updateOne(
                        { email: email },
                        { $inc: { Gold: -coin, Cash: cashAmount } }
                    );

                    if (result.modifiedCount === 1) {
                        this.socketService.sendSuccessResponse(socketId, `Converted ${coin} gold coins to ${cashAmount} cash.`, "Gold-cash", cashAmount);
                    } else {
                        this.socketService.sendErrorResponse(socketId, "Failed to update user's balance !", "Gold-cash");
                    }

                } else {
                    this.socketService.sendErrorResponse(socketId, "Not enough gold coins !!", "Gold-cash");
                }

            } else {
                this.socketService.sendErrorResponse(socketId, "User not found !!", "Gold-cash");
            }

        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Gold-cash");
        }
    };


    // public chellangecomplitegift = async (data: any, socketId: string): Promise<void> => {
    //     try {
    //         let { token } = data.spData;
    //         const db = this.db.getDb();

    //         if (!token) {
    //             this.socketService.sendErrorResponse(socketId, "Token is required !!", "chellange-complite-gift");
    //             return;
    //         }

    //         const decodedToken = await this.service.tokenverify(token);
    //         const { email } = decodedToken.payload;

    //         if (!email) {
    //             this.socketService.sendErrorResponse(socketId, "please check the token, is not valid !!", "chellange-complite-gift");
    //             return;
    //         }

    //         const user = await db.collection(DbCollection.users).findOne({ email: email });

    //         if (!user) {
    //             this.socketService.sendErrorResponse(socketId, "User not found !!", "chellange-complite-gift");
    //             return;
    //         }

    //         const newGold = user.Gold + 20;
    //         const result = await db.collection(DbCollection.users).updateOne({ email: email }, { $set: { Gold: newGold } });

    //         this.socketService.sendSuccessResponse(socketId, "Challenge is complete. 20 Gold gift sent.", "chellange-complite-gift", newGold);
    //     } catch (err) {
    //         console.log(err);
    //         this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "chellange-complite-gift");
    //     }
    // };


    public GoldCoinAdd = async (data: any, socketId: string): Promise<void> => {
        try {
            const { token, Goldcoin } = data.spData;
            const db = this.db.getDb();

            if (!token || !Goldcoin) {
                this.socketService.sendErrorResponse(socketId, "Token and Coin are required !!", "Coin-add");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);

            if (!decodedToken || !decodedToken.payload || !decodedToken.payload.email) {
                this.socketService.sendErrorResponse(socketId, "Invalid token !!", "Coin-add");
                return;
            }

            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, is not valid !!", "Coin-add");
                return;
            }

            const result = await db.collection(DbCollection.users).findOne({ email });

            if (!result) {
                this.socketService.sendErrorResponse(socketId, "User not found", "Coin-add");
                return;
            }

            const oldcoin = result.Gold;
            const newcoin = parseInt(Goldcoin);
            const coin = oldcoin + newcoin;

            const updateResult = await db.collection(DbCollection.users).updateOne(
                { email },
                { $set: { Gold: coin } }
            );

            if (updateResult.modifiedCount === 1) {
                this.socketService.sendSuccessResponse(socketId, `Gold coins added`, "Coin-add", "");
            } else {
                this.socketService.sendErrorResponse(socketId, "Failed to add gold coins", "Coin-add");
            }

        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Coin-add");
        }
    };


    public Goldcoinremove = async (data: any, socketId: string): Promise<void> => {
        try {
            let { token, Goldcoin } = data.spData;
            const db = this.db.getDb();

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "Gold-coin-remove");
                return;
            }

            if (!Goldcoin) {
                this.socketService.sendErrorResponse(socketId, "Coin is required !!", "Gold-coin-remove");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, it is not valid !!", "Gold-coin-remove");
                return;
            }

            const result = await db.collection(DbCollection.users).findOneAndUpdate(
                { email: email },
                { $inc: { Gold: -parseInt(Goldcoin) } }
            );

            if (result) {
                this.socketService.sendSuccessResponse(socketId, `Gold coin removed`, "Gold-coin-remove", "");
            } else {
                this.socketService.sendErrorResponse(socketId, "User not found", "Gold-coin-remove");
            }

        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Gold-coin-remove");
        }
    };


    public cashadd = async (data: any, socketId: string): Promise<void> => {
        try {
            const { token, cash } = data.spData;
            const db = this.db.getDb();

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "cash-add");
                return;
            }

            if (!cash) {
                this.socketService.sendErrorResponse(socketId, "Cash is required !!", "cash-add");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Invalid token, Please check a token", "cash-add");
                return;
            }

            const user = await db.collection(DbCollection.users).findOne({ email: email });

            if (!user) {
                this.socketService.sendErrorResponse(socketId, "User not found", "cash-add");
                return;
            }

            const oldCoin = user.Cash;
            const newCoin = parseInt(cash);
            const updatedCash = oldCoin + newCoin;

            const updateResult = await db.collection(DbCollection.users).updateOne(
                { email: email },
                { $set: { Cash: updatedCash } }
            );

            if (updateResult) {
                this.socketService.sendSuccessResponse(socketId, `cash add successfully..`, "cash-add", "");
            } else {
                this.socketService.sendErrorResponse(socketId, "Failed to update cash !", "cash-add");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "cash-add");
        }
    };


    public cashremove = async (data: any, socketId: string): Promise<void> => {
        try {
            const { token, cash } = data.spData;
            const db = this.db.getDb();

            if (!token) {
                this.socketService.sendErrorResponse(socketId, "Token is required !!", "cash-remove");
                return;
            }

            if (!cash) {
                this.socketService.sendErrorResponse(socketId, "Cash is required !!", "cash-remove");
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email, userId } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Token is not valid, please check a token !!", "cash-remove");
                return;
            }

            const user = await db.collection(DbCollection.users).findOne({ email: email });

            if (!user) {
                this.socketService.sendErrorResponse(socketId, "User not found !", "cash-remove");
                return;
            }

            const oldCash = user.Cash;
            const newCash = parseInt(cash);

            if (newCash <= 0 || oldCash < newCash) {
                await db.collection(DbCollection.users).findOneAndUpdate(
                    { email: email },
                    { $set: { Cash: 0 } }
                );
                this.socketService.sendSuccessResponse(socketId, `Cash removed successfully...`, "cash-remove", "");
                return;
            }

            const updatedCash = oldCash - newCash;
            const updateResult = await db.collection(DbCollection.users).updateOne(
                { email: email },
                { $set: { Cash: updatedCash } }
            );

            if (updateResult.modifiedCount > 0) {
                this.socketService.sendSuccessResponse(socketId, `Cash removed successfully...`, "cash-remove", "");
            } else {
                this.socketService.sendErrorResponse(socketId, "Cash not updated !", "cash-remove");
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "cash-remove");
        }
    };

};

export default Users;