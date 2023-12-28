export interface AppConfig {
    users: string;
    store: string;
    usersemail: string;
    Challenge: string;
    feedback: string;
    userChallenge: string;
    Dailychallenges: string;
    message: string;
    room: string
}

export default {
    users: "users",
    store: "store",
    usersemail: "usersemail",
    Challenge: "Challenge",
    feedback: "feedback",
    userChallenge: "userChallenge",
    Dailychallenges: "Dailychallenges",
    message: "message",
    room: "room"
} as AppConfig;
