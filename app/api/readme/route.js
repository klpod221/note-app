import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read the README.md file content
    const readmePath = path.join(process.cwd(), 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    
    return NextResponse.json({ 
      success: true, 
      content 
    });
  } catch (error) {
    console.error('Error reading README file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to read README content' 
      },
      { status: 500 }
    );
  }
}