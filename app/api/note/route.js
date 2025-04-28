import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Note from "@/models/Note";

// GET handler - fetch notes
export async function GET(request) {
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const root = searchParams.get('root') === 'true';
    const trash = searchParams.get('trash') === 'true';
    const parentId = searchParams.get('parentId');
    
    let query = { owner: session.user.id };
    
    // Handle different query types
    if (root) {
      // Root level notes (no parent)
      query.parentId = null;
      query.deletedAt = null; // Not in trash
    } else if (trash) {
      // Items in trash
      query.deletedAt = { $ne: null };
    } else if (parentId) {
      // Children of a specific folder
      query.parentId = parentId;
      query.deletedAt = null; // Not in trash
    } else {
      // Default - all non-deleted notes
      query.deletedAt = null;
    }
    
    const notes = await Note.find(query).sort({ updatedAt: -1 });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST handler - create new note
export async function POST(request) {
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  const { name, parentId, isFolder } = await request.json();

  try {
    await connectDB();
    const note = new Note({
      name,
      parentId,
      isFolder,
      owner: session.user.id,
    });
    await note.save();

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

// PATCH handler - update existing note
export async function PATCH(request) {
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    
    await connectDB();
    
    // Find note and verify ownership
    const note = await Note.findOne({ 
      _id: id,
      owner: session.user.id,
      deletedAt: null // Can't update deleted notes
    });
    
    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }
    
    // Update allowed fields
    const allowedFields = ['name', 'content', 'parentId'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        note[field] = data[field];
      }
    });
    
    await note.save();
    
    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

// DELETE handler - soft delete or permanent delete
export async function DELETE(request) {
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';
    
    await connectDB();
    
    // Find note and verify ownership
    const note = await Note.findOne({ 
      _id: id,
      owner: session.user.id
    });
    
    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }
    
    if (permanent) {
      // Permanent delete
      await Note.deleteOne({ _id: id });
      return NextResponse.json({ success: true, message: "Note permanently deleted" });
    } else {
      // Soft delete - move to trash
      note.deletedAt = new Date();
      await note.save();
      return NextResponse.json(note);
    }
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}

// PUT handler - restore a soft-deleted note
export async function PUT(request) {
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    await connectDB();
    
    // Find note and verify ownership
    const note = await Note.findOne({ 
      _id: id,
      owner: session.user.id,
      deletedAt: { $ne: null } // Must be in trash
    });
    
    if (!note) {
      return NextResponse.json(
        { error: "Note not found in trash" },
        { status: 404 }
      );
    }
    
    // Restore from trash
    note.deletedAt = null;
    await note.save();
    
    return NextResponse.json(note);
  } catch (error) {
    console.error("Error restoring note:", error);
    return NextResponse.json(
      { error: "Failed to restore note" },
      { status: 500 }
    );
  }
}
