import jwt from 'jsonwebtoken';
export default class Service {
    public constructor(token: string) {
    }

    public tokenverify = async (token: string): Promise<any> => {
        try {
            const decodedToken = jwt.decode(token, {
                complete: true,
            });
            return decodedToken;

        } catch (error) {
            throw new Error(error);
        }

    }
}