import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Note from "@/models/Note";

// PATCH handler - move a note to a new parent folder
export async function PATCH(request, { params }) {
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = params;
  const { parentId } = await request.json();

  try {
    await connectDB();

    // Find note and verify ownership
    const note = await Note.findOne({ 
      _id: id, 
      owner: session.user.id,
      deletedAt: null // Can't move items in trash
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    // If parentId is specified, verify it's a valid folder
    if (parentId) {
      const parentFolder = await Note.findOne({
        _id: parentId,
        owner: session.user.id,
        isFolder: true,
        deletedAt: null
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found or not a folder" },
          { status: 400 }
        );
      }

      // Prevent circular references
      if (id === parentId) {
        return NextResponse.json(
          { error: "Cannot move a folder inside itself" },
          { status: 400 }
        );
      }
    }

    // Update the parent ID
    note.parentId = parentId;
    await note.save();

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error moving note:", error);
    return NextResponse.json(
      { error: "Failed to move note" },
      { status: 500 }
    );
  }
}