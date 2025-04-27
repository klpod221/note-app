import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    // Check if all required fields are provided
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message:
            existingUser.email === email
              ? "User already exists with this email"
              : "Username already taken",
        },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check is first user, then set role to admin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    // Return success response (without password)
    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Error registering user" },
      { status: 500 }
    );
  }
}
