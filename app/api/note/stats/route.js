import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Note from "@/models/Note";

// GET handler - fetch note statistics
export async function GET(request) {
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    
    // Get the current date and date from 7 days ago
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    // Basic stats - total notes, folders, deleted items
    const totalNotes = await Note.countDocuments({ 
      owner: session.user.id,
      isFolder: false,
      deletedAt: null
    });
    
    const totalFolders = await Note.countDocuments({
      owner: session.user.id,
      isFolder: true,
      deletedAt: null
    });
    
    const trashCount = await Note.countDocuments({
      owner: session.user.id,
      deletedAt: { $ne: null }
    });
    
    // Recent notes (updated in the last 7 days)
    const recentNotesCount = await Note.countDocuments({
      owner: session.user.id,
      isFolder: false,
      deletedAt: null,
      updatedAt: { $gte: sevenDaysAgo }
    });
    
    // Favorite notes count
    const favoritesCount = await Note.countDocuments({
      owner: session.user.id,
      isFolder: false,
      deletedAt: null,
      isFavorite: true
    });
    
    // Get the actual recent notes (limited to 5)
    const recentNotes = await Note.find({
      owner: session.user.id,
      isFolder: false,
      deletedAt: null
    })
    .sort({ updatedAt: -1 })
    .limit(6)
    .select('name content createdAt updatedAt'); // Just select needed fields
    
    // Process the notes to get content excerpts
    const processedRecentNotes = recentNotes.map(note => {
      const noteObj = note.toObject();
      
      if (noteObj.content) {
        // Truncate content to first 60 characters
        noteObj.content = noteObj.content.substring(0, 60);
        if (noteObj.content.length === 60) {
          noteObj.content += '...';
        }
      }
      
      return noteObj;
    });
    
    // Calculate notes created per day for the last week
    const activityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      // Set to beginning of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      // Set to end of day
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Count notes created on this day
      const count = await Note.countDocuments({
        owner: session.user.id,
        isFolder: false,
        createdAt: { 
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      activityData.push({
        date: startOfDay.toISOString().split('T')[0], // Format as YYYY-MM-DD
        count
      });
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        total: totalNotes,
        folders: totalFolders,
        trash: trashCount,
        recent: recentNotesCount,
        favorites: favoritesCount
      },
      recentNotes: processedRecentNotes,
      activityData
    });
  } catch (error) {
    console.error("Error fetching note statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch note statistics", success: false },
      { status: 500 }
    );
  }
}