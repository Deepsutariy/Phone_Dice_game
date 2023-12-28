import { mongoDB, MongoDBConnection } from '../config/Conection';
import { Server as SocketIo } from 'socket.io';
import nodemailer from 'nodemailer';
import Service from '../services/TokenVerify';
import DbCollection from '../constants/db.config';
import path from 'path';
import SocketService from '../services/SocketService';
import EmailService from '../services/EmailService';
import { log } from 'winston';
import { ObjectId } from 'mongodb';

class usersemail {
    private db: MongoDBConnection;
    private io: SocketIo;
    private service: Service;
    private socketService: SocketService;
    private emailService: EmailService;

    constructor(io: SocketIo) {
        this.db = mongoDB;
        this.io = io;
        this.service = new Service('token');
        this.socketService = new SocketService(io);
        this.emailService = new EmailService();
    }

    public sendInbox = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            let { token } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, 'Token is required!!', 'send-Inbox');
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, 'Please check the token, it is not valid !!', 'send-Inbox');
                return;
            }

            const emaildata = await db
                .collection(DbCollection.usersemail)
                .find({
                    from: email,
                })
                .toArray();

            this.socketService.sendSuccessResponse(socketId, 'View send inbox.', 'send-Inbox', emaildata);
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, 'Something went wrong.', 'send-Inbox');
        }
    };

    public CreateMail = async (data: any, socketId: string, filePath?: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            let { from, token, Subjects, message } = data;

            if (!from) {
                this.socketService.sendErrorResponse(socketId, 'Please insert an Email Address!!', 'Create-mail');
                return;
            }

            if (!token) {
                this.socketService.sendErrorResponse(socketId, 'Token is required!!', 'Create-mail');
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            const { username, email } = decodedToken.payload;

            if (!username || !email) {
                this.socketService.sendErrorResponse(socketId, 'Please check the token; it is not valid!!', 'Create-mail');
                return;
            }

            if (from === email) {
                this.socketService.sendErrorResponse(socketId, 'You cannot send an email to yourself!!', 'Create-mail');
                return;
            }

            const results = await db.collection(DbCollection.users).findOne({ email: from });

            if (!results) {
                this.socketService.sendErrorResponse(socketId, "The 'from' user does not exist in the database!!", 'Create-mail');
                return;
            }

            let tos = results.email;
            let image = '';

            if (filePath == undefined) {
                if (filePath) {
                    const filePathWithForwardSlashes = filePath.replace(/\\/g, '/');
                    image = `http://165.22.222.197:5001/${encodeURIComponent(filePathWithForwardSlashes)}`;
                    await this.emailService.sendEmail(tos, Subjects, message, '', filePathWithForwardSlashes);
                }
            }

            const currentDate = new Date();
            const day = currentDate.getDate();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const time = currentDate.toLocaleTimeString();

            const result = await db.collection(DbCollection.usersemail).insertOne({
                day: day,
                month: month,
                year: year,
                time: time,
                subject: Subjects,
                from: email,
                name: username,
                to: tos,
                message: message,
                image: image,
                status: true,
            });

            if (result) {
                console.log('Email Sent successfully');
                // this.socketService.sendSuccessResponse(socketId, "Email Sent successfully.", "Create-mail", mailDetails);
            } else {
                this.socketService.sendErrorResponse(socketId, 'Email information not inserted.', 'Create-mail');
            }
        } catch (err) {
            console.error(err);
            // this.socketService.sendErrorResponse(socketId, "Something went wrong.", "Create-mail");
        }
    };

    public EmailInbox = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            let { token } = data.spData;

            if (!token) {
                this.socketService.sendErrorResponse(socketId, 'Token is required !!', 'Inbox');
                return;
            } else {
                const decodedToken = await this.service.tokenverify(token);
                const { email } = decodedToken.payload;

                if (!email) {
                    this.socketService.sendErrorResponse(socketId, 'Please check the token, is not valid !!', 'Inbox');
                    return;
                }

                const emailInbox = await db
                    .collection(DbCollection.usersemail)
                    .aggregate([
                        {
                            $match: { to: email, status: true },
                        },
                        {
                            $group: {
                                _id: null,
                                emails: { $push: '$$ROOT' },
                            },
                        },
                    ])
                    .toArray();

                if (emailInbox.length === 0 || !emailInbox[0].emails) {
                    this.socketService.sendErrorResponse(socketId, 'Empty email inbox !!', 'Inbox');
                    return;
                } else {
                    this.io.to(socketId).emit('request', { message: 'Email inbox', success: true, action: 'Inbox', data: emailInbox[0].emails });
                }
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, 'Something went wrong !!', 'Inbox');
        }
    };

    public EmailCode = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { token } = data.spData;
            const froms = 'deepcodelto@gmail.com';

            if (!token) {
                this.socketService.sendErrorResponse(socketId, 'Token is required !!', 'Email-Code');
                return;
            }

            const decodedToken = await this.service.tokenverify(token);
            let { email } = decodedToken.payload;

            if (!email) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, it's not valid !!", 'Email-Code');
                return;
            }

            const mailTransporter = new EmailService();

            const min = 100000;
            const max = 999999;
            const otp = Math.floor(Math.random() * (max - min + 1)) + min;

            const emailTemplate = `
                <html>
                    <body>
                        <p>Hello,</p>
                        <p><strong>${email}</strong> has been invited to Dice Game, and their OTP is <strong>${otp}</strong></p>
                        <p>Best regards,</p>
                        <p>Your Dice Game Team 🙂</p>
                    </body>
                </html>
            `;

            await mailTransporter.sendEmail(email, 'Phone Dice Game', 'Plain Text Message', emailTemplate);

            const result = await db.collection(DbCollection.usersemail).insertOne({ email: froms, otp });
            const results = await db.collection(DbCollection.users).updateOne({ email }, { $set: { otp } });

            if (result && results.modifiedCount > 0) {
                this.socketService.sendSuccessResponse(socketId, 'Email Sent successfully.', 'Email-Code', '');
            } else {
                this.socketService.sendErrorResponse(socketId, 'User not found.', 'Email-Code');
            }
        } catch (err) {
            this.socketService.sendErrorResponse(socketId, 'Something went wrong !!', 'Email-Code');
        }
    };

    public EmailDelete = async (data: any, socketId: string): Promise<any> => {
        try {
            const db = this.db.getDb();
            const { token, id } = data.spData;

            if (!token || !id) {
                this.socketService.sendErrorResponse(socketId, 'Token and emailid are required !!', 'Email-Delete');
                return;
            }

            const decodedToken = await this.service.tokenverify(token);

            if (!decodedToken) {
                this.socketService.sendErrorResponse(socketId, "Please check the token, it's not valid !!", 'Email-Delete');
                return;
            }

            let { email } = decodedToken.payload;

            const emailInbox = await db.collection(DbCollection.usersemail).findOne({ from: email, _id: new ObjectId(id) });

            if (emailInbox) {
                const result = await db.collection(DbCollection.usersemail).findOneAndDelete({ from: email, _id: new ObjectId(id) });

                if (result) {
                    this.socketService.sendSuccessResponse(socketId, 'Email Delete successfully.....', 'Email-Delete', '');
                    return;
                } else {
                    this.socketService.sendErrorResponse(socketId, 'Internal server error !!!', 'Email-Delete');
                    return;
                }
            } else {
                const results = await db
                    .collection(DbCollection.usersemail)
                    .findOneAndUpdate({ to: email, _id: new ObjectId(id) }, { $set: { status: false } });

                if (results) {
                    this.socketService.sendSuccessResponse(socketId, 'Email Delete successfully.', 'Email-Delete', '');
                    return;
                } else {
                    this.socketService.sendErrorResponse(socketId, 'Internal server error !!', 'Email-Delete');
                    return;
                }
            }
        } catch (err) {
            console.log(err);
            this.socketService.sendErrorResponse(socketId, 'Something went wrong !!', 'Email-Delete');
        }
    };
}

export default usersemail;
