import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Note from "@/models/Note";

// GET handler - get single note by ID
export async function GET(request, props) {
  const params = await props.params;

  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    await connectDB();

    // Find note and verify ownership
    const note = await Note.findOne({
      _id: id,
      owner: session.user.id,
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

// PUT handler - update note by ID
export async function PUT(request, props) {
  const params = await props.params;

  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    await connectDB();

    // Find note and verify ownership
    const note = await Note.findOne({
      _id: id,
      owner: session.user.id,
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Update note
    const body = await request.json();
    Object.assign(note, body);
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

export async function DELETE(request, props) {
  const params = await props.params;

  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    await connectDB();

    // Find note and verify ownership
    const note = await Note.findOne({
      _id: id,
      owner: session.user.id,
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Helper function to get all child notes (recursive)
    async function getAllChildNotes(parentId) {
      const children = await Note.find({ 
        parentId, 
        owner: session.user.id 
      });
      
      let allChildren = [...children];
      
      // Recursively get children of folders
      for (const child of children) {
        const childDescendants = await getAllChildNotes(child._id);
        allChildren = [...allChildren, ...childDescendants];
      }
      
      return allChildren;
    }

    // Get all children of this note/folder
    const children = await getAllChildNotes(id);

    // Delete the note
    if (note.deletedAt) {
      // Permanently delete the note and all its children
      await Note.deleteOne({ _id: id });
      
      // Delete all children permanently
      if (children.length > 0) {
        const childIds = children.map(child => child._id);
        await Note.deleteMany({ _id: { $in: childIds } });
      }
      
      return NextResponse.json(
        { message: "Note and all children deleted permanently" },
        { status: 200 }
      );
    }

    // Move the note to trash
    note.deletedAt = new Date();
    await note.save();
    
    // Move all children to trash
    if (children.length > 0) {
      await Note.updateMany(
        { _id: { $in: children.map(child => child._id) } },
        { deletedAt: new Date() }
      );
    }

    return NextResponse.json(
      { message: "Note and all children moved to trash" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
