import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Note from "@/models/Note";

const session = await getServerSession(auth);

// GET handler - fetch notes
export async function GET(request) {}

// POST handler - create new note
export async function POST(request) {}

// PATCH handler - update existing note
export async function PATCH(request) {}

// DELETE handler - soft delete or permanent delete
export async function DELETE(request) {}

// PUT handler - restore a soft-deleted note
export async function PUT(request) {}
