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

    // Delete the note
    if (note.deletedAt) {
      await Note.deleteOne({ _id: id });
      return NextResponse.json(
        { message: "Note deleted permanently" },
        { status: 200 }
      );
    }

    // Move the note to trash
    note.deletedAt = new Date();
    await note.save();

    return NextResponse.json(
      { message: "Note moved to trash" },
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
