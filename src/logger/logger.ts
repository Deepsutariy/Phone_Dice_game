import winston, { createLogger, transports, format, Logger } from "winston";

class LoggerService {
    private logger: Logger;

    constructor() {
        this.logger = createLogger({
            level: "info",
            format: format.simple(),
            transports: [
                new transports.Console(),
                new transports.File({ filename: "error.log", level: "error" }),
            ],
        });
    }

    public logInfo(message: string) {
        this.logger.info(message);
    }

    public logError(message: string) {
        this.logger.error(message);
    }
}

export default new LoggerService();
