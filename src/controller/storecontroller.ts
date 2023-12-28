import { mongoDB, MongoDBConnection } from "../config/Conection";
import { Server as SocketIo } from "socket.io";
import { ObjectId } from 'mongodb';
import DbCollection from "../constants/db.config";
import SocketService from "../services/SocketService";

class Store {
    private db: MongoDBConnection;
    private io: SocketIo;
    private socketService: SocketService;

    constructor(io: SocketIo) {
        this.db = mongoDB;
        this.io = io;
        this.socketService = new SocketService(io);
    }

    public SearchBar = async (data: any, socketId: string): Promise<any> => {
        try {
            if (!data || !data.spData.item || typeof data.spData.item !== 'string') {
                this.socketService.sendErrorResponse(socketId, "Please Insert a Valid Search Item.", "Search-Bar");
                return;
            }

            const db = this.db.getDb();
            const key = data.spData.item;

            const cursor = db.collection(DbCollection.store)
                .aggregate(
                    [
                        {
                            $match: {
                                $or: [
                                    { item: { $regex: key, $options: "i" } },
                                    { Type: { $regex: key, $options: "i" } }
                                ]
                            }
                        }
                    ]
                );

            const existingItems = await cursor.toArray();
            cursor.close();

            if (existingItems) {
                this.socketService.sendSuccessResponse(socketId, "Store items.", "Search-Bar", existingItems);
                return;
            } else {
                this.socketService.sendErrorResponse(socketId, "No matching results found !!", "Search-Bar");
                return;
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Search-Bar");
            return;
        }
    };


    public StoreItem = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const storeData = await db.collection(DbCollection.store).find({}).toArray();

            if (storeData.length > 0) {
                return this.socketService.sendSuccessResponse(socketId, "View All Store items.", "Store-Item", storeData);
            } else {
                return this.socketService.sendErrorResponse(socketId, "No items found !!", "Store-Item");
            }
        } catch (err) {
            return this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Store-Item");
        }
    };


    public AddToStore = async (data: any, socketId: string, filePath: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { item, type, price, iosid, android } = data;

            if (!filePath) {
                this.socketService.sendErrorResponse(socketId, "please insert an image !!", "Add-To-Store");
                return;
            }

            if (!item || !type || !price || !iosid || !android) {
                this.socketService.sendErrorResponse(socketId, "Please provide all required fields: item, Type, Price, iosid, and android id !!", "Add-To-Store");
                return;
            } else {
                const image = `http://165.22.222.197:5001/${filePath}`;
                const insert = await db
                    .collection(DbCollection.store)
                    .insertOne({ item, type, Price: price, ios: iosid, android, image });

                if (insert) {
                    this.socketService.sendSuccessResponse(socketId, "Data inserted successfully.", "Add-To-Store", insert);
                    return;
                } else {
                    this.socketService.sendErrorResponse(socketId, "Data not inserted !!", "Add-To-Store");
                    return;
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Add-To-Store");
            return;
        }
    };


    public RemoveToStore = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { id } = data.spData;

            if (!id) {
                this.socketService.sendErrorResponse(socketId, "Please provide an id !!", "Remove-To-Store");
                return;
            }

            const deleteResult = await db
                .collection(DbCollection.store)
                .deleteOne({ _id: new ObjectId(id) });

            console.log(deleteResult.deletedCount > 0);

            if (deleteResult.deletedCount > 0) {
                this.socketService.sendSuccessResponse(socketId, "Data deleted successfully.", "Remove-To-Store", deleteResult);
            } else {
                this.socketService.sendErrorResponse(socketId, "Data could not be deleted or not found !!", "Remove-To-Store");
            }

        } catch (err) {
            console.error(err);
            this.socketService.sendErrorResponse(socketId, "Something went wrong !!", "Remove-To-Store");
        }
    };

}

export default Store;
