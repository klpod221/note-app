import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Note from "@/models/Note";

// GET handler - fetch notes
export async function GET(request) {
  const session = await getServerSession(auth);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const root = searchParams.get("root") === "true";
    const trash = searchParams.get("trash") === "true";
    const parentId = searchParams.get("parentId");

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

    const notes = await Note.find(query, { content: 0, tags: 0 }).sort({
      updatedAt: -1,
    });
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, name, parentId, isFolder } = await request.json();

  try {
    await connectDB();

    // if have id, it means we are duplicating a note
    if (id) {
      const note = await Note.findById(id);
      if (!note) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
      const newNote = new Note({
        name,
        parentId,
        isFolder,
        owner: session.user.id,
        content: note.content,
        tags: note.tags,
      });
      await newNote.save();
      return NextResponse.json(newNote);
    }

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
