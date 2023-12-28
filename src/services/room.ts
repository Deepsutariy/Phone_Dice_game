import { Server, Socket } from 'socket.io';
import { log } from 'winston';

const array = [];
const rooms = new Map<string, RoomInfo>();
const roomss = new Map<string, RoomInfos>();

interface RoomInfo {
    maxPlayers: number;
    players: string[];
}

interface RoomInfos {
    players: { playerId: string; socketId: string }[];
}

class GameRoomManager {
    private roomPlayerMap: Record<string, string> = {};
    private io: Server;
    private player: Map<string, string[]> = new Map();
    private roomss: Map<string, RoomInfos> = new Map();

    constructor(io: Server) {
        this.io = io;
        this.player = new Map<string, string[]>();
    }

    private generateUniqueId() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let uniqueId = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            uniqueId += characters[randomIndex];
        }
        return uniqueId.toLowerCase();
    }

    removePlayerFromRooms(roomId: string, playerId: string) {
        this.leaveRoom(roomId, playerId);
    }

    public createRoom(playerIds: string[], maxPlayers: number): string {

        const roomId = this.generateUniqueId();

        playerIds.forEach((playerId) => {
            this.roomPlayerMap[playerId] = roomId;
        });

        const roomInfo: RoomInfo = {
            maxPlayers: maxPlayers,
            players: playerIds,
        };

        rooms.set(roomId, roomInfo);
        array.push([roomId, playerIds]);
        return roomId;
    }

    public createRooms(playerIds: string[], socketIds: string[]): string {
        const roomId = this.generateUniqueId();

        const roomInfo: RoomInfos = {
            players: playerIds.map((playerId, index) => ({
                playerId,
                socketId: socketIds[index],
            })),
        };
        console.log(roomInfo);


        roomss.set(roomId, roomInfo);
        array.push([roomId, playerIds, socketIds]);
        return roomId;
    }

    getAvailableRoomId(): string | undefined {
        for (const [roomId, roomInfo] of this.roomss) {
            return roomId;
        }
        return undefined;
    }

    joinRoomglobal(roomId: string, playerId: string, socketId: string): boolean {
        const roomInfo = roomss.get(roomId);

        if (roomInfo) {
            roomInfo.players.push({ playerId, socketId });
            this.roomPlayerMap[playerId] = roomId;
            return true;
        }

        return false;
    }


    getPlayersInRoom(roomId: string): { players: string[]; maxPlayers: number } {
        const roomInfo = rooms.get(roomId);
        if (roomInfo) {
            const result = { players: roomInfo.players, maxPlayers: roomInfo.maxPlayers };
            return result;
        }
        return { players: [], maxPlayers: 0 };
    };

    getRoomIdForPlayer(socketId: string): string | undefined {
        for (const roomData of array) {
            if (roomData.length >= 3) {
                if (roomData[2].includes(socketId)) {
                    return roomData[0];
                } else if (roomData[2].includes(socketId)) {
                    return roomData[1];
                }
            } else {
                return undefined;
            }

        }
        return undefined;
    }


    removeRoom(roomId: string) {
        const roomInfo = rooms.get(roomId);
        if (roomInfo) {
            const players = roomInfo.players;
            players.forEach(playerId => {
                delete this.roomPlayerMap[playerId];
            });
            rooms.delete(roomId);

            const index = array.findIndex(item => item[0] === roomId);
            if (index !== -1) {
                array.splice(index, 1);
            }
        }
    };

    public removePlayerFromRoom(roomId: string, playerId: string) {
        const roomInfo = rooms.get(roomId);

        delete rooms[roomId];
        delete this.roomPlayerMap[playerId];

    }

    getRoomInfo(roomId: string): RoomInfo | undefined {
        const { players, maxPlayers } = this.getPlayersInRoom(roomId);
        const roomInfo: RoomInfo = {
            maxPlayers: maxPlayers,
            players: players,
        };
        return roomInfo;
    };

    public getRoomInfos(roomId: string): RoomInfos | undefined {
        const roomInfo = roomss.get(roomId);

        if (roomInfo) {
            return roomInfo;
        }

        return undefined;
    }

    joinRoom(roomId: string, playerId: string): boolean {
        const roomInfo = rooms.get(roomId);

        if (roomInfo && roomInfo.players.length <= roomInfo.maxPlayers) {
            roomInfo.players.push(playerId);
            this.roomPlayerMap[playerId] = roomId;
            return true;
        }

        return false;
    };

    leaveRoom(roomId: string, playerId: string): void {
        const roomInfo = rooms.get(roomId);

        if (roomInfo) {
            const index = roomInfo.players.indexOf(playerId);
            if (index !== -1) {
                roomInfo.players.splice(index, 1);
                rooms.set(roomId, roomInfo);
                delete this.roomPlayerMap[playerId];
            }
        }
    };

    broadcastToRoom(roomId: string, messageType: string, data: any) {
        const roomInfo = rooms.get(roomId);

        if (roomInfo) {
            const players = roomInfo.players;
            for (const playerId of players) {
                const playerSocket = this.io.sockets.sockets[playerId];
                if (playerSocket) {
                    playerSocket.emit(messageType, data);
                }
            }
        }
    };

    getRoomInfoById(roomId: string): RoomInfo | undefined {
        const roomInfo = rooms.get(roomId);
        if (roomInfo) {
            return roomInfo;
        }
        return undefined;
    };

    arrytofind(roomId: string): [string, string[]] | undefined {
        const foundArray = array.find(([id, _]) => id === roomId);
        return foundArray;
    };

};

export default GameRoomManager;