import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export function getMongoURI(): string | undefined {
  return process.env.MONGODB_URI;
}

export async function connectDB() {
  const uri = getMongoURI();

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable in .env.local or settings');
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDBStatus(): { isConnected: boolean; readyState: number; uriConfigured: boolean } {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    uriConfigured: Boolean(process.env.MONGODB_URI),
  };
}
