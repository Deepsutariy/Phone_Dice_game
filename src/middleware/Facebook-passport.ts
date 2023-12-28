import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { mongoDB, MongoDBConnection } from "../config/Conection";
import { WithId } from "mongodb";

class middleFacebook {
    private db: MongoDBConnection;
    public userId: any;

    constructor() {
        this.db = mongoDB;
        this.userId = null;
    }

    setupFacebookStrategy() {
        passport.use(
            new FacebookStrategy(
                {
                    clientID: process.env.FaceclientID,
                    clientSecret: process.env.FaceclientSecret,
                    callbackURL: "https://your-domain.com/auth/facebook/callback",
                    profileFields: ['id', 'displayName', 'emails'],
                },
                async (accessToken, refreshToken, profile, cb) => {
                    const db = this.db.getDb();

                    try {
                        const existingUser = await db.collection<WithId<any>>("users").findOne({ email: profile.emails[0].value });

                        if (existingUser) {
                            return cb(null, existingUser);
                        } else {
                            const newUser = {
                                facebookId: profile.id,
                                displayName: profile.displayName,
                                email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
                            };

                            const result = await db.collection<WithId<any>>("users").insertOne(newUser);

                            return cb(null, result);
                        }
                    } catch (err) {
                        console.error(err);
                        return cb(err);
                    }
                }
            )
        );
    }
}

export default middleFacebook;
