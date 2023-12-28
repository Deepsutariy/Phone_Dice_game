import { mongoDB, MongoDBConnection } from '../config/Conection';
import { Server as SocketIo, Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import Service from '../services/TokenVerify';
import DbCollection from '../constants/db.config';
import SocketService from '../services/SocketService';
import GameRoomManager from '../services/room';
import dbConfig from '../constants/db.config';

const playerQueue2 = [];
const playerQueue5 = [];

class PlayerRoom {
    private db: MongoDBConnection;
    private io: SocketIo;
    private socketService: SocketService;
    private gameRoomManager: GameRoomManager;
    private usersInRooms: Map<string, string> = new Map();
    private service: Service;
    private connectedSockets: Record<string, Socket> = {};

    constructor(io: SocketIo) {
        this.db = mongoDB;
        this.io = io;
        this.socketService = new SocketService(io);
        this.gameRoomManager = new GameRoomManager(io);
        this.service = new Service('token');
    }

    // public CreateGameRoom = async (data: any, socket: Socket): Promise<any> => {
    //     try {
    //         const db = this.db.getDb();
    //         let { playerid } = data.spData;
    //         const roomplayer = data.spData.roomplayer;
    //         const number = parseInt(String(roomplayer), 10);
    //         const oldplayer = [];

    //         const result = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(playerid) });

    //         if (isNaN(number) || (number !== 2 && number !== 5)) {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'Invalid roomplayer value. It must be either 2 or 5 !!', status: "error", success: false });
    //             return;
    //         }

    //         if (this.usersInRooms.has(socket.id)) {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'You are already in a room.', status: "error", success: false });
    //             return;
    //         }

    //         let playerQueue;
    //         let waitingMessage;
    //         let roomType;

    //         if (number === 2) {
    //             playerQueue = playerQueue2;
    //             waitingMessage = "Waiting for 1 more player to join...";
    //             roomType = "2-player";
    //         } else if (number === 5) {
    //             playerQueue = playerQueue5;
    //             waitingMessage = "Waiting for 4 more players to join...";
    //             roomType = "5-player";
    //         } else {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'Invalid roomplayer value. It must be either 2 or 5 !!', status: "error", success: false });
    //             return;
    //         }

    //         if (playerQueue.includes(playerid)) {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'You are already waiting for another player to join...', success: false, status: "error" });
    //             return;
    //         }

    //         if (playerQueue.length === 0) {
    //             playerQueue.push(playerid);
    //             // socket.emit('request', { action: "Create-Game-Room", message: waitingMessage, status: "waiting" });
    //             this.io.local.emit('request', { action: "new-user-join", message: `New User Join a Room..`, data: result, status: "waiting" });
    //         } else {
    //             const requiredPlayers = (number === 2) ? 1 : 4;
    //             this.io.local.emit("request", { action: "new-user-join", success: true, message: "new join user.", data: result });
    //             if (playerQueue.length < requiredPlayers) {
    //                 socket.emit('request', { action: "Create-Game-Room", message: `Waiting for ${requiredPlayers - playerQueue.length} more players to join...`, status: "waiting" });
    //                 return;
    //             }

    //             const waitingPlayerIds = playerQueue.splice(0, requiredPlayers);
    //             const roomId = this.gameRoomManager.createRoom([playerid, ...waitingPlayerIds], number);
    //             // const roominfos = this.gameRoomManager.getRoomInfoById(roomId);
    //             this.usersInRooms.add(playerid);

    //             if (playerQueue.length === number) {
    //                 const roomId = this.gameRoomManager.createRoom(playerQueue, number);
    //                 this.usersInRooms.add(playerid);
    //                 const roomdata = this.gameRoomManager.getRoomInfoById(roomId);
    //                 for (const playerId of roomdata.players) {
    //                     const resultdata = await db.collection(DbCollection.users).findOne(
    //                         { _id: new ObjectId(playerId) },
    //                         {
    //                             projection: {
    //                                 name: 1,
    //                                 email: 1,
    //                                 image: 1,
    //                                 Gold: 1,
    //                                 Cash: 1
    //                             }
    //                         }
    //                     );

    //                     if (!resultdata) {
    //                         this.socketService.sendErrorResponse(socket.id, "User not in database !!", "Create-Game-Room");
    //                         return;
    //                     };

    //                     oldplayer.push(resultdata);
    //                 }
    //             }

    //             this.io.emit("request", { action: "Create-Game-Room", success: true, message: "Room created successfully", roomId: roomId, roomType: roomType, AllPlayer: oldplayer, status: "Join game" });
    //         }
    //     } catch (err) {
    //         this.socketService.sendErrorResponse(socket.id, "Something went wrong.", "Create-Game-Room");
    //     }
    // };

    // public CreateGameRoom = async (data: any, socket: Socket): Promise<any> => {
    //     try {
    //         const db = this.db.getDb();
    //         let { playerid } = data.spData;
    //         const roomplayer = data.spData.roomplayer;
    //         const number = parseInt(String(roomplayer), 10);
    //         const oldplayer = [];

    //         const result = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(playerid) }, {
    //             projection: {
    //                 name: 1,
    //                 email: 1,
    //                 image: 1,
    //                 Gold: 1,
    //                 Cash: 1
    //             }
    //         });

    //         if (!result) {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'User not in database, please cheack a user id  !!.', status: "error", success: false });
    //             return;
    //         }

    //         if (isNaN(number) || (number !== 2 && number !== 5)) {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'Invalid roomplayer value. It must be either 2 or 5 !!', status: "error", success: false });
    //             return;
    //         }

    //         if (this.usersInRooms.has(socket.id)) {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'You are already in a room.', status: "error", success: false });
    //             return;
    //         }

    //         let playerQueue;
    //         let roomType;

    //         if (number === 2) {
    //             playerQueue = playerQueue2;
    //             roomType = "2-player";
    //         } else if (number === 5) {
    //             playerQueue = playerQueue5;
    //             roomType = "5-player";
    //         } else {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'Invalid roomplayer value. It must be either 2 or 5 !!', status: "error", success: false });
    //             return;
    //         }

    //         if (playerQueue.includes(playerid)) {
    //             socket.emit('request', { action: "Create-Game-Room", message: 'You are already waiting for another player to join...', success: false, status: "error" });
    //             return;
    //         };

    //         playerQueue.push(playerid);
    //         const roomnum = number - playerQueue.length;

    //         this.io.emit('request', { action: "new-user-join", message: `New User Join a Room..`, data: result, status: "waiting" });

    //         if (roomType === 5) {
    //             if (roomnum !== 0) {
    //                 socket.emit('request', { action: "Create-Game-Room", message: `Waiting for ${number - playerQueue.length} more players to join...`, status: "waiting" });
    //             }
    //         }

    //         if (playerQueue.length === number) {
    //             const roomId = this.gameRoomManager.createRoom(playerQueue, number);
    //             this.usersInRooms.add(playerid);
    //             const roomdata = this.gameRoomManager.getRoomInfoById(roomId);
    //             for (const playerId of roomdata.players) {
    //                 const resultdata = await db.collection(DbCollection.users).findOne(
    //                     { _id: new ObjectId(playerId) },
    //                     {
    //                         projection: {
    //                             name: 1,
    //                             email: 1,
    //                             image: 1,
    //                             Gold: 1,
    //                             Cash: 1
    //                         }
    //                     }
    //                 );

    //                 if (!resultdata) {
    //                     this.socketService.sendErrorResponse(socket.id, "User not in database !!", "Create-Game-Room");
    //                     return;
    //                 };

    //                 oldplayer.push(resultdata);
    //             }

    //             this.io.emit("request", { action: "Create-Game-Room", success: true, message: "Room created successfully", roomId: roomId, roomType: roomType, AllPlayer: oldplayer });
    //         }
    //     } catch (err) {
    //         this.socketService.sendErrorResponse(socket.id, "Something went wrong.", "Create-Game-Room");
    //     }
    // };

    public CreateGameRoom = async (data: any, socket: Socket): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { playerid } = data.spData;
            let playerQueue = [];
            let oldroomdata = [];

            const roomId = this.gameRoomManager.getAvailableRoomId();

            // Check if the player exists in the database.
            const objectIdPlayerId = new ObjectId(playerid);
            const playerData = await db.collection(DbCollection.users).findOne({ _id: objectIdPlayerId });

            if (!playerData) {
                socket.emit('request', { action: 'Create-Game-Room', message: 'This player is not in the database!!', status: 'error', success: false });
                return;
            }

            // Check if the roomid exists in the DbCollection.room
            const roomExists = await db.collection(DbCollection.room).find({}).toArray();

            if (roomExists[0]) {
                if (roomExists[0].playerinfo.length === 0) {
                    const roomdelete = await db.collection(DbCollection.room).findOneAndDelete({})
                    const newRoomId = this.gameRoomManager.createRooms([playerid], [socket.id]);
                    await db.collection(DbCollection.room).insertOne({
                        roomid: newRoomId,
                        playerinfo: [
                            {
                                playerid: playerid,
                                socketid: socket.id,
                            },
                        ],
                    });
                    this.io.emit('request', { action: 'Create-Game-Room', success: true, message: 'Room created successfully', roomId: newRoomId });
                    this.io.to(socket.id).emit('request', { action: 'oldplayer-game-data', success: true, message: 'no players in Room!', roomId: newRoomId });
                    return;
                }
            }

            if (roomExists.length !== 0) {
                const roomData = roomExists[0];

                if (roomData.playerinfo) {
                    for (const player of roomData.playerinfo) {
                        const playerid = player.playerid;

                        const playerData = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(playerid) });

                        if (roomExists[0].playerinfo.length === 0) {
                            this.io.to(socket.id).emit('request', {
                                action: 'new-user-join',
                                message: 'new player Joined room with ID ' + roomData.roomid,
                                success: true,
                                roomId: roomData.roomid,
                                AllPlayer: playerData,
                            });
                        }

                        // Find the player data based on playerid

                        oldroomdata.push(playerData); // Push the player data into the result array
                    }
                } else {
                    this.io.to(socket.id).emit('request', { action: 'oldplayer-game-data', success: true, message: 'no players in Room!', data: [], roomId: roomData.roomid });
                    this.io.to(socket.id).emit('request', {
                        action: 'new-user-join',
                        message: 'new player Joined room with ID ' + roomData.roomid,
                        success: true,
                        roomId: roomData.roomid,
                        AllPlayer: playerData,
                    });
                    // socket.emit('request', { action: "Create-Game-Room", message: 'Internal Server Error !!', status: "error", success: false });
                }

                // Filter out null or undefined elements
                const filteredOldRoomData = oldroomdata.filter(playerData => playerData !== null && playerData !== undefined);

                if (filteredOldRoomData.length > 0) {
                    // Emit a message to the player's socket ID
                    this.io.to(socket.id).emit('request', {
                        action: 'oldplayer-game-data',
                        message: 'Room Old Player Data ' + roomData.roomid,
                        success: true,
                        roomId: roomData.roomid,
                        AllPlayer: filteredOldRoomData,
                    });
                }

                this.gameRoomManager.joinRoomglobal(roomId, playerid, socket.id);
                const playerExists = roomExists[0].playerinfo.some(player => player.playerid === playerid);

                if (!playerExists) {
                    // Player doesn't exist, so add the player's information to the array
                    const alloldsdata = await db.collection(DbCollection.room).updateOne(
                        { roomid: roomExists[0].roomid },
                        {
                            $push: {
                                playerinfo: {
                                    playerid: playerid,
                                    socketid: socket.id,
                                },
                            },
                        },
                    );

                    if (alloldsdata) {
                        this.io.to(socket.id).emit('request', {
                            action: 'new-user-join',
                            message: 'new player Joined room with IDs ' + roomData.roomid,
                            success: true,
                            roomId: roomData.roomid,
                            AllPlayer: playerData,
                        });

                        const roomExists = await db.collection(DbCollection.room).find({}).toArray();

                        if (roomExists.length === 0) {
                            this.io.to(socket.id).emit('request', { action: 'oldplayer-game-data', success: true, message: 'no players in Room!', data: [], roomId: roomData.roomid });
                            return;
                        }
                    }

                    this.gameRoomManager.joinRoomglobal(roomId, playerid, socket.id);

                    if (roomData) {
                        roomData.playerinfo.forEach(player => {
                            const socketId = player.socketid;

                            console.log(socketId);

                            if (socketId) {
                                // Emit a message to each socket ID
                                this.io.to(socketId).emit('request', {
                                    action: 'new-user-join',
                                    message: 'new player Joined room with ID ' + roomData.roomid,
                                    success: true,
                                    roomId: roomData.roomid,
                                    AllPlayer: playerData,
                                });
                            } else {
                                this.io.emit('request', {
                                    action: 'new-user-join',
                                    message: 'new player Joined room with ID ' + roomData.roomid,
                                    success: true,
                                    roomId: roomData.roomid,
                                    AllPlayer: playerData,
                                });
                            }
                        });
                    }
                } else {
                    socket.emit('request', { action: 'Create-Game-Room', message: 'You Are Already in the game room !!', status: 'error', success: false });
                    return;
                }
            } else {
                // Create a new room.
                console.log('Room Create');

                const newRoomId = this.gameRoomManager.createRooms([playerid], [socket.id]);
                playerQueue.push({ playerid, socketId: socket.id, roomId: newRoomId });

                await db.collection(DbCollection.room).insertOne({
                    roomid: newRoomId,
                    playerinfo: [
                        {
                            playerid: playerid,
                            socketid: socket.id,
                        },
                    ],
                });
                this.io.emit('request', { action: 'Create-Game-Room', success: true, message: 'Room created successfully', roomId: newRoomId });
                this.io.to(socket.id).emit('request', { action: 'oldplayer-game-data', success: true, message: 'no players in Room!', roomId: newRoomId });
                return;
            }
        } catch (err) {
            console.log(err);
            this.socketService.sendErrorResponse(socket.id, 'Something went wrong.', 'Create-Game-Room');
        }
    };

    public Priveateroomcreate = async (data: any, socket: Socket): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { playerid, room } = data.spData;
            const roomids = parseInt(room);

            if (![2, 5].includes(roomids)) {
                this.socketService.sendErrorResponse(socket.id, 'Room type must be 2 or 5 !!', 'Priveate-room-create');
                return;
            }

            if (!playerid) {
                this.socketService.sendErrorResponse(socket.id, 'Please provide a Player Id', 'Priveate-room-create');
                return;
            }

            const result = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(playerid) });

            if (!result) {
                this.socketService.sendErrorResponse(socket.id, 'Player not exist in the database !!', 'Priveate-room-create');
                return;
            }

            const roomId = this.gameRoomManager.createRoom([playerid], roomids);

            if (!roomId) {
                this.socketService.sendErrorResponse(socket.id, 'Failed to create the room.', 'Priveate-room-create');
                return;
            }

            const userDataArray = [
                {
                    name: result.name,
                    email: result.email,
                    image: result.image,
                    Cash: result.Cash,
                    Gold: result.Gold,
                },
            ];

            socket.join(roomId);
            this.io
                .to(roomId)
                .emit('request', { action: 'Priveate-room-create', success: true, message: 'Room is created.', data: userDataArray, roomId: roomId });
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socket.id, 'Something went wrong.', 'Priveate-room-create');
        }
    };

    public LeaveglobalRoom = async (data: any, socket: Socket): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { playerid, roomid } = data.spData;

            if (!playerid || !roomid) {
                this.socketService.sendErrorResponse(socket.id, 'Please provide both playerid and roomid.', 'Join-Game-Room');
                return;
            }

            const updatedRoom = await db.collection(dbConfig.room).findOne({ roomid: roomid });

            if (!updatedRoom) {
                this.io.to(socket.id).emit('request', { action: 'Leave-global-Room', success: false, message: 'Internal server error!', data: '' });
                return;
            }

            // Extract playerids from playerinfo array
            const playerids = updatedRoom.playerinfo;

            // Find the index of the player to be removed
            const playerIndex = playerids.findIndex(player => player.playerid === playerid);

            if (playerIndex === -1) {
                this.socketService.sendErrorResponse(socket.id, 'Player not found in the room.', 'Leave-global-Room');
                return;
            }

            // Remove the player from the playerinfo array
            playerids.splice(playerIndex, 1);

            const update = {
                $set: {
                    playerinfo: playerids,
                },
            };

            const result = await db.collection(dbConfig.room).findOneAndUpdate({ roomid: roomid }, update as any, { returnDocument: 'after' });

            if (!result) {
                this.socketService.sendErrorResponse(socket.id, 'No matching room found.', 'Leave-global-Room');
                return;
            }

            // Fetch player information from the database
            const player = await db.collection('users').findOne({ _id: new ObjectId(playerid) });

            if (!player) {
                this.io.to(socket.id).emit('request', { action: 'Leave-global-Room', success: false, message: 'Player not found.', data: '' });
                return;
            }

            // Notify other players about the player removal
            playerids.forEach(playerData => {
                this.io
                    .to(playerData.socketid)
                    .emit('request', { action: 'Leave-global-Room', success: true, message: 'Player removed from room.', data: player });
            });

            // Send the updated playerinfo array and player information to the specific socket
            this.io.to(socket.id).emit('request', { action: 'Leave-global-Room', success: true, message: 'Player removed from room.', data: player });
        } catch (err) {
            console.error(err);
            this.io.emit('request', { action: 'Leave-global-Room', message: 'Something went wrong' });
        }
    };

    public JoinGameRoom = async (data: any, socket: Socket): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { playerid, roomid } = data.spData;

            if (!playerid || !roomid) {
                this.socketService.sendErrorResponse(socket.id, 'Please provide both playerid and roomid.', 'Join-Game-Room');
                return;
            }

            const roomIdToJoin = roomid;
            const roomInfo = this.gameRoomManager.getRoomInfo(roomIdToJoin);

            if (!roomInfo) {
                this.socketService.sendErrorResponse(socket.id, 'Room not found.', 'Join-Game-Room');
                return;
            }

            const maxPlayers = roomInfo.maxPlayers;
            const numUsers = roomInfo.players.length;

            if (numUsers >= maxPlayers) {
                this.gameRoomManager.leaveRoom(roomIdToJoin, playerid);
                this.socketService.sendErrorResponse(socket.id, `Max ${maxPlayers} users can join the room !!`, 'Join-Game-Room');
                return;
            }

            if (this.gameRoomManager.joinRoom(roomIdToJoin, playerid)) {
                // Send data to room users for the new join
                const newuser = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(playerid) });
                if (newuser) {
                    const userDataToSend = {
                        name: newuser.name,
                        email: newuser.email,
                        image: newuser.image,
                        cash: newuser.Cash,
                        gold: newuser.Gold,
                    };
                    const userDataArray = [userDataToSend];
                    this.io.to(roomIdToJoin).emit('request', { action: 'new-user-join', success: true, message: 'new join user.', data: userDataArray });
                }

                socket.join(roomIdToJoin);
                const array = this.gameRoomManager.arrytofind(roomIdToJoin);

                // Room data in map and all user data send
                const playerIdsToFind = array[1];
                const oldplayers = await Promise.all(
                    playerIdsToFind.map(async playerIdToFind => {
                        const playerData = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(playerIdToFind) });
                        if (playerData) {
                            return {
                                name: playerData.name,
                                email: playerData.email,
                                image: playerData.image,
                                cash: playerData.Cash,
                                gold: playerData.Gold,
                            };
                        } else {
                            this.socketService.sendErrorResponse(socket.id, 'Failed to send user data', 'Join-Game-Room');
                            return null;
                        }
                    }),
                );

                const filteredOldPlayers = oldplayers.filter(player => player !== null);
                this.io
                    .to(socket.id)
                    .emit('request', { action: 'Join-Game-Room', success: true, message: 'room player data.', data: filteredOldPlayers, roomid: roomIdToJoin });
            } else {
                this.socketService.sendErrorResponse(socket.id, 'Failed to join the room', 'Join-Game-Room');
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socket.id, 'Something went wrong.', 'Join-Game-Room');
        }
    };

    public LeaveGameRoom = async (data: any, socket: Socket): Promise<void> => {
        try {
            const db = this.db.getDb();
            const { playerid, roomid } = data.spData;
            console.log(playerid, roomid);

            if (!playerid) {
                this.socketService.sendErrorResponse(socket.id, 'player id is required !!', 'Leave-Game-Room');
                return;
            }

            if (playerid.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(playerid)) {
                this.socketService.sendErrorResponse(socket.id, 'Invalid player id format', 'Leave-Game-Room');
                return;
            }

            const playersInRoom = this.gameRoomManager.getPlayersInRoom(roomid).players;
            const newuser = await db.collection(DbCollection.users).findOne({ _id: new ObjectId(playerid) });

            if (Array.isArray(playersInRoom)) {
                if (playersInRoom.includes(playerid)) {
                    const indexToRemove = playersInRoom.indexOf(playerid);

                    if (indexToRemove !== -1) {
                        playersInRoom.splice(indexToRemove, 1);

                        if (playersInRoom.length === 0) {
                            this.gameRoomManager.removeRoom(roomid);
                        } else {
                            playersInRoom.forEach(otherPlayerSocket => {
                                this.io
                                    .to(otherPlayerSocket)
                                    .emit('request', { roomId: roomid, action: 'Leave-Game-Room', message: `${newuser.name} has left the game room.` });
                            });
                        }
                        this.io.emit('request', { action: 'Leave-Game-Room', success: true, message: `${newuser.name} is left the game room.` });
                        this.io.to(roomid).emit('request', { action: 'Leave-Game-Room', success: true, message: `${newuser.name} is left the game room.` });
                    } else {
                        this.socketService.sendErrorResponse(socket.id, 'You are not in this game rooms !!', 'Leave-Game-Room');
                    }
                } else {
                    this.socketService.sendErrorResponse(socket.id, 'You are not in this game room !!', 'Leave-Game-Room');
                }
            } else {
                this.socketService.sendErrorResponse(socket.id, 'Invalid playersInRoom data !!', 'Leave-Game-Room');
            }
        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socket.id, 'Something went wrong !!', 'Leave-Game-Room');
        }
    };

    public chatmessage = async (data: any, socket: Socket): Promise<void> => {
        const db = this.db.getDb();

        const { playerid, receiverPlayerid, message } = data.spData;

        if (!playerid || !receiverPlayerid) {
            socket.emit('request', { action: 'chat-message', message: 'Please insert a playerid and receiverPlayerid !!', success: false });
            return;
        }

        if (playerid === receiverPlayerid) {
            socket.emit('request', { action: 'chat-message', message: 'Message cannot be sent to yourself !!', success: false });
            return;
        }

        return db
            .collection(DbCollection.message)
            .insertOne({
                playerid,
                receiverPlayerid,
                message,
                timestamp: new Date(),
            })
            .then(() => {
                this.io.to(receiverPlayerid).emit('request', { action: 'chat-message', playerid, message, success: true, player: playerid, data: message });
                this.io.emit('request', { action: 'chat-message', playerid, message, success: true, player: playerid, data: message });
            })
            .catch(err => {
                console.error(err);
                this.socketService.sendErrorResponse(socket.id, 'Something went wrong !!', 'chat-message');
            });
    };

    public chatmessagehistory = async (data: any, socket: Socket): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { playerid, receiverPlayerid } = data.spData;

            if (!playerid || !receiverPlayerid) {
                this.socketService.sendErrorResponse(socket.id, 'playerid and receiverPlayerid is require !!', 'chat-message-history');
                return;
            }

            const messages = await db
                .collection(DbCollection.message)
                .find({
                    $or: [
                        { playerid: playerid, receiverPlayerid: receiverPlayerid },
                        { playerid: receiverPlayerid, receiverPlayerid: playerid },
                    ],
                })
                .sort({ timestamp: -1 })
                .toArray();

            const messageHistory = messages.map(message => ({
                sender: message.playerid,
                receiver: message.receiverPlayerid,
                message: message.message,
                timestamp: message.timestamp,
            }));

            this.socketService.sendSuccessResponse(socket.id, 'view chat', 'chat-message-history', messageHistory);
        } catch (err) {
            this.socketService.sendErrorResponse(socket.id, 'Something went wrong !!', 'chat-message-history');
        }
    };

    public chatmessageprivate = async (data: any, socket: Socket): Promise<any> => {
        try {
            const { message, playerid, roomid } = data.spData;

            if (!message) {
                this.socketService.sendErrorResponse(socket.id, 'Message is required !!', 'chat-message-private');
                return;
            }

            if (roomid) {
                const roomInfo = this.gameRoomManager.getRoomInfoById(roomid);
                if (roomInfo) {
                    this.io.to(roomid).emit('request', { action: 'chat-message-private', success: true, message, data: playerid });
                } else {
                    this.socketService.sendErrorResponse(socket.id, 'Room not found !!', 'chat-message-private');
                }
            } else {
                this.socketService.sendErrorResponse(socket.id, 'You are not in a room !!', 'chat-message-private');
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socket.id, 'Something went wrong !!', 'chat-message-private');
        }
    };

    public createroomchat = async (data: any, socket: Socket): Promise<any> => {
        try {
            const { message, playerid } = data.spData;
            const db = this.db.getDb();

            if (!message) {
                this.socketService.sendErrorResponse(socket.id, 'Message is required !!', 'create-room-chat');
                return;
            }

            const room = await db.collection(dbConfig.room).findOne({});

            if (!room) {
                this.socketService.sendErrorResponse(socket.id, 'Internal Server error !!', 'create-room-chat');
                return;
            }

            // Find the player with the given playerid in the room's playerinfo
            const player = room.playerinfo.find(p => p.playerid === playerid);

            if (!player) {
                this.socketService.sendErrorResponse(socket.id, 'Player not found in the room !!', 'create-room-chat');
                return;
            }

            // Emit the chat message to all socket IDs in the room
            room.playerinfo.forEach(p => {
                this.io.to(p.socketid).emit('request', { action: 'create-room-chat', success: true, message, data: playerid });
            });
        } catch (err) {
            this.socketService.sendErrorResponse(socket.id, 'Something went wrong !!', 'create-room-chat');
        }
    };

    public playerjoinfriends = async (data: any, socket: Socket): Promise<void> => {
        try {
            const db = this.db.getDb();
            let { token, key } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socket.id, 'Token is required !!', 'player-join-friends');
                return;
            }

            if (!key) {
                this.socketService.sendErrorResponse(socket.id, 'Key must be true or false !!', 'player-join-friends');
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { userId } = decodedToken.payload;

            if (!userId) {
                this.socketService.sendErrorResponse(socket.id, 'Invalid token !!', 'player-join-friends');
                return;
            }

            if (key === 'true') {
                const thirtyMinutesAgo = new Date();
                thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 1);

                const result = await db.collection(DbCollection.Challenge).findOneAndUpdate(
                    {
                        ChallengeID: userId,
                        time: {
                            $gte: thirtyMinutesAgo.getTime(),
                            $lte: new Date().getTime(),
                        },
                    },
                    { $set: { status: 'accept' } },
                );

                const playerData = await db.collection(DbCollection.users).findOne({ email: result.user });

                if (result) {
                    const player1 = playerData._id;
                    const play1 = player1.toString().slice(0, 25);
                    const player2 = userId;

                    const roomId = this.gameRoomManager.createRoom([play1, player2], 2);
                    const roomIds = this.gameRoomManager.getRoomInfo(roomId);

                    this.socketService.sendSuccessResponse(
                        socket.id,
                        `join a friend's challenge. Room in ${roomIds.players.length} player are join..`,
                        'player-join-friends',
                        roomId,
                    );
                } else {
                    this.socketService.sendErrorResponse(socket.id, 'No recent challenge found !!', 'player-join-friends');
                }
            } else {
                this.socketService.sendErrorResponse(socket.id, 'Reject a friend request !!', 'player-join-friends');
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socket.id, 'Something went wrong !!', 'player-join-friends');
        }
    };
}

export default PlayerRoom;
