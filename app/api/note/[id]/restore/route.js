import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Note from "@/models/Note";

// PUT handler - restore a note from trash
export async function PUT(request, props) {
  const params = await props.params;
  
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = params;

  try {
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