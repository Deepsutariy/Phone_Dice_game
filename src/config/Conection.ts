import { MongoClient, Db, Collection } from 'mongodb';
import logger from '../logger/logger';

class MongoDBConnection {
  private client: MongoClient;
  private uri: string;
  private db: Db | null = null;

  constructor(uri: string) {
    this.uri = uri;
    this.client = new MongoClient(this.uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      logger.logInfo('Connected to MongoDB');
    } catch (err) {
      logger.logError('Error connecting to MongoDB:');
      throw err;
    }
  }

  getDb(): Db | null {
    return this.db;
  }

  getCollection<T>(name: string): Collection<T> | null {
    if (this.db) {
      return this.db.collection(name);
    }
    return null;
  }
}

const clientUri = 'mongodb://127.0.0.1:27017/dice';
const mongoDB = new MongoDBConnection(clientUri);

(async () => {
  try {
    await mongoDB.connect();
  } catch (err) {
    logger.logError('Failed to connect to MongoDB:');
  }
})();

export { mongoDB, MongoDBConnection };
