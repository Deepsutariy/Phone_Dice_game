import express, { Request, Response, NextFunction } from 'express';
import { Server as SocketIo, Socket } from 'socket.io';
import { mongoDB, MongoDBConnection } from './config/Conection';
import multer from 'multer';
import http from 'http';
import { join } from 'path';
import dotenv from 'dotenv';
import Users from './controller/UserController';
import UsersemailController from './controller/usersemailcontroller';
import store from './controller/storecontroller';
import Challenge from './controller/Challengecontroller';
import feedback from './controller/feedbackcontroller';
import logger from './logger/logger';
import middle from './middleware/google-passport';
import GameRoomManager from './services/room';
import middleFacebook from './middleware/Facebook-passport';
import UserChallenge from './controller/userChallengecontroller';
import playerroom from './controller/roomcontroller';
import Service from './services/TokenVerify';
import DbCollection from './constants/db.config';
import cookieSession from 'cookie-session';
import passport from 'passport';
import { ObjectId } from 'mongodb';
import dbConfig from './constants/db.config';
import cors from 'cors';
import './config/Conection';

interface SocketData {
    action: string;
    sender?: string;
    receiver?: string;
    message?: string;
    name?: string;
    token?: string;
    from?: string;
    Subjects?: string;
    iosid?: string;
    type?: string;
    item?: string;
    price?: string;
    android?: string;
    spData?: {
        roomid?: string;
        roomplayer?: number;
    };
}

interface ConnectedUsers {
    [key: string]: {
        socketId: string;
        isPlayingGame: boolean;
    };
}

class MyServer {
    private readonly app: express.Express;
    private readonly server: http.Server;
    private io: SocketIo;
    private connectedUsers: ConnectedUsers = {};
    private usersInstance: Users;
    private usersemailInstance: UsersemailController;
    private storeInstance: store;
    private ChallengeInstance: Challenge;
    private feedbackInstance: feedback;
    private userchallengeInstance: UserChallenge;
    private connectedSockets: { [socketId: string]: Socket } = {};
    private gameRoomManager: GameRoomManager;
    private playerRoomInstance: playerroom;
    private service: Service;
    private db: MongoDBConnection;

    constructor() {
        this.setupEnv();
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new SocketIo(this.server);
        this.setupMulter();
        this.pass();
        this.sessionss();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketIO();
        this.db = mongoDB;
        this.service = new Service('token');
        this.usersInstance = new Users(this.io);
        this.usersemailInstance = new UsersemailController(this.io);
        this.storeInstance = new store(this.io);
        this.ChallengeInstance = new Challenge(this.io);
        this.feedbackInstance = new feedback(this.io);
        this.userchallengeInstance = new UserChallenge(this.io);
        this.gameRoomManager = new GameRoomManager(this.io);
        this.playerRoomInstance = new playerroom(this.io);
    }

    private setupEnv() {
        dotenv.config();
    }

    private setupMulter() {
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, 'uploads/User_image');
            },
            filename: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = file.mimetype.split('/')[1];
                cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
            },
        });

        const upload = multer({ storage: storage });
        var filePath: string;

        this.app.post('/upload', upload.single('image'), async (req: Request & { file: multer.File }, res: Response, next: NextFunction) => {
            try {
                const uploadedFile = req.file;
                if (!uploadedFile) {
                    this.io.emit('request', { action: 'Profile-Picture', message: 'image is reqide !!', success: false });
                    return res.send({ status: true, code: 400, message: 'Image is required !! ' });
                }
                const filePath = `${uploadedFile.path}`;
                const data: SocketData = {
                    action: 'Profile-Picture',
                    name: req.body.imageUser,
                    token: req.body.token,
                };

                if (!req.body.token) {
                    this.io.emit('request', { message: 'token is required', action: 'Profile-Picture', success: false });
                    return res.send({ status: true, code: 400, message: 'Token is required !! ' });
                }

                const Socket_id: string = 'some_socket_id';
                await this.usersInstance.ProfilePicture(data, Socket_id, filePath);

                this.io.emit('request', { message: 'uploading image', action: 'Profile-Picture', success: true, imageUrl: filePath });
                return res.send({ status: true, code: 200, message: 'uploading image !! ' });
            } catch (err) {
                this.io.emit('request', { message: 'something went wrong !!', action: 'Profile-Picture', success: false });
                return res.send({ status: true, code: 500, message: 'Internal server Error !! ' });
            }
        });

        this.app.post(
            '/emailupload',
            upload.single('image'),
            async (req: Request & { file: multer.File; token: string; Subjects: string }, res: Response, next: NextFunction) => {
                try {
                    console.log(req.body);

                    const db = this.db.getDb();
                    const uploadedFile = req.file;

                    // if (!uploadedFile) {
                    //     return res.status(400).json({ message: "Image file is required", success: false });
                    // }

                    const filePath = `${uploadedFile?.path}`;
                    const data: SocketData = {
                        action: 'Create-mail',
                        name: req.body.imageUser,
                        token: req.body.token,
                        from: req.body.froms,
                        message: req.body.message,
                        Subjects: req.body.Subjects,
                    };
                    let { imageUser, token, froms } = req.body;

                    if (!imageUser || !token || !froms) {
                        return res.send({ status: true, code: 400, message: 'Please fill all fialds !! ' });
                    }

                    const userExists = await db.collection(DbCollection.users).findOne({ email: data.from });

                    if (!userExists) {
                        return res.send({ status: true, code: 404, message: 'User Not found in database !! ' });
                    }

                    const decodedToken = await this.service.tokenverify(data.token);
                    const { email } = decodedToken.payload;

                    if (data.from === email) {
                        return res.send({ status: true, code: 400, message: 'Cannot send an email to yourself !! ' });
                    }

                    const Socket_id: string = 'some_socket_id';
                    await this.usersemailInstance.CreateMail(data, Socket_id, filePath);

                    this.io.emit('request', { message: 'Email sent successfully.', action: 'Create-mail', success: true, imageUrl: filePath });
                    return res.send({ status: true, code: 200, message: 'Email sent successfully.' });
                } catch (err) {
                    this.io.emit('request', { message: 'Something went wrong.', action: 'Create-mail', success: false });
                }
            },
        );

        this.app.post('/store', upload.single('image'), async (req: Request & { file: multer.File }, res: Response, next: NextFunction) => {
            try {
                const uploadedFile = req.file;

                if (!uploadedFile) {
                    this.io.emit('request', { message: 'please fill all fields !!', action: 'Add-To-Store', success: false });
                    return res.send({ status: true, code: 200, message: 'Please Fill All Fialds .' });
                }

                const filePath = `${uploadedFile.path}`;
                let { Item, Type, Price, ios, Android } = req.body;

                var data: SocketData = {
                    action: 'Add-To-Store',
                    item: Item,
                    type: Type,
                    price: Price,
                    iosid: ios,
                    android: Android,
                };

                if (!Item && !Type && !Price && !ios && !Android) {
                    this.io.emit('request', { message: 'please fill all fields !!', action: 'Add-To-Store', success: false });
                    return res.send({ status: true, code: 404, message: 'please fill all fields ..' });
                }

                const Socket_id: string = 'some_socket_id';
                await this.storeInstance.AddToStore(data, Socket_id, filePath);

                this.io.emit('request', { message: 'uploading image', action: 'Add-To-Store', success: true, imageUrl: filePath });
                return res.send({ status: true, code: 200, message: 'uploading image ...' });
            } catch (err) {
                this.io.emit('request', { message: 'something went wrong !!', action: 'Add-To-Store', success: false });
                return res.send({ status: true, code: 500, message: 'something went wrong !!' });
            }
        });
    }

    private setupMiddleware() {
        const corsOptions = {
            origin: ['http://165.22.222.197:5001/', 'http://localhost:5001/'],
            credentials: true,
        };

        this.app.use(cors(corsOptions));
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        this.app.get('/login/oauth2/code/facebook', passport.authenticate('facebook', { scope: ['user_friends', 'manage_pages'] }));
        this.app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/profile', failureRedirect: '/' }));

        this.app.get('/auth', passport.authenticate('google', { scope: ['email', 'profile'] }));
        this.app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
            res.redirect('/');
        });

        const __dirname = process.cwd();
        this.app.use(express.static(__dirname));
    }

    private sessionss() {
        this.app.use(
            cookieSession({
                name: 'session',
                keys: ['key1', 'key2'],
            }),
        );
    }

    private pass() {
        const middleware = new middle();
        middleware.setupGoogleStrategy();

        const middlewares = new middleFacebook();
        middlewares.setupFacebookStrategy();

        passport.serializeUser(function (user, cb) {
            cb(null, user);
        });

        passport.deserializeUser(function (obj, cb) {
            cb(null, obj);
        });
    }

    private setupRoutes() {
        this.app.get('/', (req: Request, res: Response) => {
            const __dirname = process.cwd();
            res.sendFile(join(__dirname + '/src/components/pages/index.html'));
        });

        this.app.get('/auth/google/callback', (req: Request, res: Response) => {
            const __dirname = process.cwd();
            res.sendFile(join(__dirname + '/src/components/pages/google.html'));
        });

        this.app.get('/login/oauth2/code/facebook', (req: Request, res: Response) => {
            const __dirname = process.cwd();
            res.sendFile(join(__dirname + '/src/components/pages/facebook.html'));
        });
    }

    private setupSocketIO() {
        this.io.on('connection', (socket: Socket) => {
            const Socket_id: string = socket.id;
            logger.logInfo(`A user connected  ------>   ${socket.id}`);

            const users = new Users(this.io);
            const usersemail = new UsersemailController(this.io);
            const storeInstance = new store(this.io);
            const ChallengeInstance = new Challenge(this.io);
            const feedbackInstance = new feedback(this.io);
            const userchallengese = new UserChallenge(this.io);
            const gameRoomManager = new GameRoomManager(this.io);
            const playerrooms = new playerroom(this.io);

            this.connectedUsers[Socket_id] = {
                socketId: Socket_id,
                isPlayingGame: false,
            };

            socket.on('request', (data: SocketData) => {
                if (typeof data === 'string') {
                    console.log('json string');
                    data = JSON.parse(data);
                }
                console.log(' On request data ', data);

                switch (data.action) {
                    case 'Create-Game-Room':
                        playerrooms.CreateGameRoom(data, socket);
                        break;
                    case 'Join-Game-Room':
                        playerrooms.JoinGameRoom(data, socket);
                        break;
                    case 'Priveate-room-create':
                        playerrooms.Priveateroomcreate(data, socket);
                        break;
                    case 'Leave-global-Room':
                        playerrooms.LeaveglobalRoom(data, socket);
                        break;
                    case 'Leave-Game-Room':
                        playerrooms.LeaveGameRoom(data, socket);
                        break;
                    case 'registration':
                        users.createUser(data, Socket_id);
                        break;
                    case 'Signin':
                        users.SignIn(data, Socket_id);
                        break;
                    case 'SignIn-Google':
                        console.log(process.env.clientID);
                        users.googleauth(data, Socket_id);
                        break;
                    case 'Friend-Request':
                        userchallengese.FriendRequest(data, Socket_id);
                        break;
                    case 'Email-Delete':
                        usersemail.EmailDelete(data, Socket_id);
                        break;
                    case 'send-Inbox':
                        usersemail.sendInbox(data, Socket_id);
                        break;
                    case 'Inbox':
                        usersemail.EmailInbox(data, Socket_id);
                        break;
                    case 'Mini-Bundle':
                        users.MiniBundle(data, Socket_id);
                        break;
                    case 'Big-Bundle':
                        users.BigBundle(data, Socket_id);
                        break;
                    case 'payment':
                        users.payment(data, Socket_id);
                        break;
                    case 'complete-Task':
                        users.completeTask(data, Socket_id);
                        break;
                    case 'Watch-Collect':
                        users.WatchCollect(data, Socket_id);
                        break;
                    case 'Search-Bar':
                        storeInstance.SearchBar(data, Socket_id);
                        break;
                    case 'Store-Item':
                        storeInstance.StoreItem(data, Socket_id);
                        break;
                    case 'Challenge-Friends':
                        ChallengeInstance.ChallengeFriends(data, Socket_id);
                        break;
                    case 'view-Challenge':
                        ChallengeInstance.viewChallenge(data, Socket_id);
                        break;
                    case 'player-join-friends':
                        playerrooms.playerjoinfriends(data, socket);
                        break;
                    case 'chat-message':
                        playerrooms.chatmessage(data, socket);
                        break;
                    case 'chat-message-history':
                        playerrooms.chatmessagehistory(data, socket);
                        break;
                    case 'chat-message-private':
                        playerrooms.chatmessageprivate(data, socket);
                        break;
                    case 'create-room-chat':
                        playerrooms.createroomchat(data, socket);
                        break;
                    case 'SFriend':
                        users.SearchUser(data, Socket_id);
                        break;
                    case 'added-to-friend':
                        users.addedtofriend(data, Socket_id);
                        break;
                    case 'AFriend':
                        users.AddUser(data, Socket_id);
                        break;
                    case 'View-notification':
                        users.Viewnotification(data, Socket_id);
                        break;
                    case 'remove-friend':
                        users.RemoveFriend(data, Socket_id);
                        break;
                    case 'View-Friend':
                        users.ViewFriend(data, Socket_id);
                        break;
                    // case "Profile-Picture":
                    //     break;
                    case 'Change-Username':
                        users.ChangeUsername(data, Socket_id);
                        break;
                    case 'Change-Email':
                        users.ChangeEmail(data, Socket_id);
                        break;
                    case 'Delete-Account':
                        users.DeleteAccount(data, Socket_id);
                        break;
                    case 'Email-Code':
                        usersemail.EmailCode(data, Socket_id);
                        break;
                    case 'Recover-Account':
                        users.RecoverAccount(data, Socket_id);
                        break;
                    case 'User-Profile':
                        users.UserProfile(data, Socket_id);
                        break;
                    case 'Sign-Out':
                        users.SignOut(data, Socket_id);
                        break;
                    case 'Graphics':
                        users.Graphics(data, Socket_id);
                        break;
                    case 'Audio':
                        users.Audio(data, Socket_id);
                        break;
                    case 'feedback':
                        feedbackInstance.feedback(data, Socket_id);
                        break;
                    case 'Remove-To-Store':
                        storeInstance.RemoveToStore(data, Socket_id);
                        break;
                    case 'Dice-Daily':
                        users.DailyGoldenDice(data, Socket_id);
                        break;
                    case 'Dice-Weekly':
                        users.DailyGoldenDiceWeekly(data, Socket_id);
                        break;
                    case 'Dice-Challenges':
                        users.DailyGoldenDiceChallenges(data, Socket_id);
                        break;
                    case 'Daily-Bonus':
                        users.DailyBonus(data, Socket_id);
                        break;
                    case 'Gold-cash':
                        users.Goldcash(data, Socket_id);
                        break;
                    case 'add-Daily-challenges':
                        ChallengeInstance.addDailychallenges(data, Socket_id);
                        break;
                    case 'view-all-Challenges':
                        ChallengeInstance.viewallChallenges(data, Socket_id);
                        break;
                    case 'complete-Daily-Challenge':
                        ChallengeInstance.completeDailyChallenge(data, Socket_id);
                        break;
                    case 'View-Daily-Challenge':
                        ChallengeInstance.ViewDailyChallenge(data, Socket_id);
                        break;
                    // case "chellange-complite-gift":
                    //     users.chellangecomplitegift(data, Socket_id);
                    //     break;
                    case 'Coin-add':
                        users.GoldCoinAdd(data, Socket_id);
                        break;
                    case 'Gold-coin-remove':
                        users.Goldcoinremove(data, Socket_id);
                        break;
                    case 'cash-add':
                        users.cashadd(data, Socket_id);
                        break;
                    case 'cash-remove':
                        users.cashremove(data, Socket_id);
                        break;
                    default:
                        socket.emit('request', { message: 'Unknown action' });
                        break;
                }
            });
            socket.on('disconnect', async () => {
                delete this.connectedUsers[socket.id];
                logger.logError(`A user disconnected -------> ${socket.id}`);

                interface PlayerInfo {
                    playerid: string;
                    socketid: string;
                }

                const removePlayer = await this.db
                    .getCollection<{ playerinfo: PlayerInfo[] }>(dbConfig.room)
                    .findOne({ playerinfo: { $elemMatch: { socketid: socket.id } } });

                if (removePlayer?.playerinfo) {
                    const playerWithSocketId = removePlayer.playerinfo.find(player => player.socketid === socket.id);
                    const ids = playerWithSocketId.playerid;

                    const roomId = gameRoomManager.getRoomIdForPlayer(socket.id);

                    const collection = this.db.getCollection('room');
                    const result = await collection.updateMany({}, { $pull: { playerinfo: { socketid: socket.id } } });

                    // Use optional chaining to access 'playerinfo'
                    const allroomplayer = await collection.findOne<{ playerinfo: Array<{ socketid: string; playerid: string }> }>({});

                    if (allroomplayer && 'playerinfo' in allroomplayer) {
                        const playerinfo = allroomplayer.playerinfo;

                        const removePlayerPromises = playerinfo.map(async player => {
                            const socketid = player.socketid;

                            const removeplayer = await this.db
                                .getCollection('users')
                                .aggregate([
                                    {
                                        $match: { _id: new ObjectId(ids) },
                                    },
                                    {
                                        $project: {
                                            name: 1,
                                            email: 1,
                                            id: 1,
                                            image: 1,
                                        },
                                    },
                                ])
                                .toArray();

                            return { socketid, removeplayer };
                        });

                        // Wait for all removePlayerPromises to complete
                        const results = await Promise.all(removePlayerPromises);

                        // Now you can emit messages outside the forEach loop
                        results.forEach(({ socketid, removeplayer }) => {
                            this.io.to(socketid).emit('request', {
                                action: 'player-disconnected',
                                message: 'Another player has disconnected Or Player is exiting from the room !!',
                                status: 'info',
                                data: removeplayer,
                            });
                        });
                    }
                } else {
                    socket.emit('request', { message: 'Socket disconnect' });
                }
            });
        });
    }

    public startServer() {
        const PORT = process.env.PORT || 3332;
        this.server.listen(PORT, () => {
            logger.logInfo(`Server is running on port ${PORT}`);
        });
    }
}

const myServer = new MyServer();
myServer.startServer();
