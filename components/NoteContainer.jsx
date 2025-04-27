"use client";

import React, { useState, useEffect } from "react";
import NoteList from "@/components/NoteList";

export default function NoteContainer() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const onSelectNote = (note) => {
    console.log("Selected note:", note);
  };

  const onDeleteNote = (noteId) => {
    console.log("Delete note:", noteId);
  };

  const onRenameNote = (noteId) => {
    console.log("Rename note:", noteId);
  }

  const onCreateNote = (parentId, isFolder) => {
    if (isFolder) {
      console.log("Create folder under parent:", parentId);
    } else {
      console.log("Create note under parent:", parentId);
    }
  }

  // Fetch notes (simulated)
  useEffect(() => {
    // In a real app, fetch from your API
    setTimeout(() => {
      const sampleNotes = [
        {
          _id: "1",
          title: "Getting Started",
          isFolder: true,
          parent: null,
        },
        {
          _id: "2",
          title: "Welcome Note",
          isFolder: false,
          content: "Welcome to your new note app!",
          parent: "1",
        },
        {
          _id: "3",
          title: "Features",
          isFolder: false,
          content: "Here are some features of this app...",
          parent: "1",
        },
        {
          _id: "4",
          title: "Projects",
          isFolder: true,
          parent: null,
        },
        {
          _id: "5",
          title: "Project A",
          isFolder: false,
          content: "Project A details...",
          parent: "4",
        },
        {
          _id: "6",
          title: "Personal",
          isFolder: true,
          parent: null,
        },
        {
          _id: "7",
          title: "Todo List",
          isFolder: false,
          content: "Things to do...",
          parent: "6"
        },
      ];

      setNotes(sampleNotes);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <NoteList
      notes={notes}
      loading={loading}
      onSelectNote={onSelectNote}
    />
  );
}
