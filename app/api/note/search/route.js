import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import auth from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Note from "@/models/Note";

// GET handler - search notes
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
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ data: [], hasMore: false, success: true });
    }
    
    // Create a regex search pattern that's case insensitive
    const searchRegex = new RegExp(query, 'i');
    
    // Search query
    const findQuery = { 
      owner: session.user.id, 
      deletedAt: null,
      isFolder: false,
      $or: [
        { name: searchRegex },
        { content: searchRegex }
      ] 
    };

    // Get total count for pagination info
    const totalCount = await Note.countDocuments(findQuery);
    
    // Search in name and content fields, excluding deleted items and folders
    const notes = await Note.find(findQuery)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit); 
    
    // Process the notes to get content excerpt around search term
    const processedNotes = notes.map(note => {
      const noteObj = note.toObject();
      
      if (noteObj.content) {
        const content = noteObj.content;
        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();
        const indexOfQuery = contentLower.indexOf(queryLower);
        
        // If query is found in content
        if (indexOfQuery !== -1) {
          // Calculate start and end positions to get text around the query
          let start = Math.max(0, indexOfQuery - 10);
          let end = Math.min(content.length, indexOfQuery + query.length + 10);
          
          // Adjust if excerpt is less than 20 chars
          if (end - start < 20) {
            if (start === 0) {
              end = Math.min(content.length, 20);
            } else if (end === content.length) {
              start = Math.max(0, content.length - 20);
            }
          }
          
          // Get the excerpt and wrap the search term with <strong> tags
          const beforeMatch = content.substring(start, indexOfQuery);
          const match = content.substring(indexOfQuery, indexOfQuery + query.length);
          const afterMatch = content.substring(indexOfQuery + query.length, end);
          
          let excerpt = '';
          if (start > 0) excerpt += '...';
          excerpt += beforeMatch + '<strong>' + match + '</strong>' + afterMatch;
          if (end < content.length) excerpt += '...';
          
          noteObj.content = excerpt;
        } else {
          // If query not found in content, return first 20 chars
          noteObj.content = content.substring(0, 20);
          if (content.length > 20) noteObj.content += '...';
        }
      }
      
      return noteObj;
    });
    
    // Calculate if there are more results
    const hasMore = skip + notes.length < totalCount;
    
    return NextResponse.json({
      data: processedNotes,
      hasMore,
      success: true
    });
  } catch (error) {
    console.error("Error searching notes:", error);
    return NextResponse.json(
      { error: "Failed to search notes", success: false },
      { status: 500 }
    );
  }
}