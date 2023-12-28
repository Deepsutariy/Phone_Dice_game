import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { mongoDB, MongoDBConnection } from "../config/Conection";
import { WithId } from "mongodb";

class Middle {
    private db: MongoDBConnection;

    constructor() {
        this.db = mongoDB;
    }

    setupGoogleStrategy() {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.clientID,
                    clientSecret: process.env.clientSecret,
                    callbackURL: "http://localhost:5001/auth/google/callback",
                    passReqToCallback: true,
                },
                async (req: any, accessToken: string, refreshToken: string, profile: any, cb: any) => {
                    const db = this.db.getDb();

                    const newUser = {
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        password: "",
                        image: profile.photos[0].value,
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
                        Effects: 0
                    };

                    try {
                        const existingUser = await db.collection<WithId<any>>("users").findOne({ email: profile.emails[0].value });

                        if (existingUser) {
                            return cb(null, existingUser);
                        } else {
                            const result = await db.collection<WithId<any>>("users").insertOne({ googleToken: refreshToken, profile, ...newUser });
                            const newUserData = result;
                            return cb(null, newUserData);
                        }
                    } catch (err) {
                        return cb(err);
                    }
                }
            )
        );
    }
}

export default Middle;
