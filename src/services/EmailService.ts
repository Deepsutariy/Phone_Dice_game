import nodemailer from "nodemailer";
import path from "path";

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.user,
                pass: process.env.pass,
            },
        });
    }

    async sendEmail(to: string, subject: string, textMessage: string, htmlMessage: string, filePathWithForwardSlashes?: string): Promise<void> {
        try {
            const mailDetails: nodemailer.SendMailOptions = {
                from: process.env.user,
                to,
                subject,
                text: textMessage,
                html: htmlMessage,
            };

            const parentDirectoryPath = path.dirname(path.dirname(__dirname));
            console.log(parentDirectoryPath);

            if (filePathWithForwardSlashes) {
                const EmailImage = path.join(parentDirectoryPath, filePathWithForwardSlashes);

                mailDetails.attachments = [
                    {
                        filename: path.basename(filePathWithForwardSlashes),
                        path: EmailImage,
                    },
                ];
            }

            await this.transporter.sendMail(mailDetails);
        } catch (error) {
            throw new Error(`Error sending email: ${error}`);
        }
    }

}

export default EmailService;