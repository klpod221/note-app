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

    // If the note has a parent ID, verify that the parent exists and is not in trash
    if (note.parentId) {
      const parentFolder = await Note.findOne({
        _id: note.parentId,
        owner: session.user.id,
        deletedAt: null // Parent should not be in trash
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder does not exist or is in trash. Restore parent folder first." },
          { status: 400 }
        );
      }
    }

    // Helper function to get all child notes (recursive)
    async function getAllChildNotes(parentId) {
      const children = await Note.find({ 
        parentId, 
        owner: session.user.id,
        deletedAt: { $ne: null } // Only find children in trash
      });
      
      let allChildren = [...children];
      
      // Recursively get children of folders
      for (const child of children) {
        const childDescendants = await getAllChildNotes(child._id);
        allChildren = [...allChildren, ...childDescendants];
      }
      
      return allChildren;
    }

    // Get all children of this note/folder that are in trash
    const children = await getAllChildNotes(id);

    // Restore the note from trash
    note.deletedAt = null;
    await note.save();
    
    // Restore all children from trash
    if (children.length > 0) {
      await Note.updateMany(
        { _id: { $in: children.map(child => child._id) } },
        { deletedAt: null }
      );
    }

    return NextResponse.json({ 
      message: "Note and all children restored from trash",
      note,
      childrenCount: children.length
    });
  } catch (error) {
    console.error("Error restoring note:", error);
    return NextResponse.json(
      { error: "Failed to restore note" },
      { status: 500 }
    );
  }
}