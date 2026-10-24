import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectDB, getDBStatus } from '@/lib/db';

export async function GET() {
  try {
    const status = getDBStatus();
    let dbName = undefined;
    let host = undefined;

    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      dbName = mongoose.connection.db.databaseName;
      host = mongoose.connection.host;
    }

    return NextResponse.json({
      ...status,
      dbName,
      host,
    });
  } catch (error) {
    return NextResponse.json(
      { isConnected: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionString, saveToEnv = true } = body;

    if (!connectionString || typeof connectionString !== 'string') {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    const trimmed = connectionString.trim();

    if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
      return NextResponse.json(
        { error: 'Invalid MongoDB connection string. Must start with mongodb:// or mongodb+srv://' },
        { status: 400 }
      );
    }

    // Try a test connection using a standalone client or mongoose
    const testConnection = await mongoose.createConnection(trimmed, {
      serverSelectionTimeoutMS: 6000,
      bufferCommands: false,
    }).asPromise();

    const dbName = testConnection.name || 'test';
    await testConnection.close();

    // If test succeeds, set process.env and optionally save to .env.local
    process.env.MONGODB_URI = trimmed;

    if (saveToEnv) {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
      }

      if (envContent.includes('MONGODB_URI=')) {
        envContent = envContent.replace(/MONGODB_URI=.*(\r?\n|$)/g, `MONGODB_URI=${trimmed}\n`);
      } else {
        envContent = `${envContent ? envContent.trim() + '\n' : ''}MONGODB_URI=${trimmed}\n`;
      }

      fs.writeFileSync(envPath, envContent, 'utf-8');
    }

    // Force reconnect with new URI
    if (global.mongoose) {
      if (global.mongoose.conn) {
        await mongoose.disconnect();
      }
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }

    await connectDB();

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to MongoDB',
      dbName,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to MongoDB',
      },
      { status: 400 }
    );
  }
}
