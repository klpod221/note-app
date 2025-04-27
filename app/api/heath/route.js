import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongoose";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json(
      { 
        status: 'success',
        message: 'Successfully connected to MongoDB',
        timestamp: new Date().toISOString() 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Failed to connect to MongoDB',
        error: error.message,
        timestamp: new Date().toISOString() 
      }, 
      { status: 500 }
    );
  }
}