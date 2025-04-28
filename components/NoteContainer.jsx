"use client";

import React, { useState, useEffect } from "react";
import NoteList from "@/components/NoteList";

export default function NoteContainer() {
  const [notes, setNotes] = useState([]);
  const [trashNotes, setTrashNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedFolders, setLoadedFolders] = useState(new Set());
  const [trashLoaded, setTrashLoaded] = useState(false);

  // Initial load - only get root level notes/folders
  const fetchRootNotes = async () => {
    setLoading(true);

    setTimeout(() => {
      // Filter for only root-level items (parentId is null)
      const rootNotes = [
        {
          _id: "1",
          title: "Getting Started",
          isFolder: true,
          parentId: null,
        },
        {
          _id: "4",
          title: "Projects",
          isFolder: true,
          parentId: null,
        },
        {
          _id: "6",
          title: "Personal",
          isFolder: true,
          parentId: null,
        },
        {
          _id: "9",
          title: "Work",
          isFolder: true,
          parentId: null,
        },
        {
          _id: "12",
          title: "Archived",
          isFolder: false,
          parentId: null,
        },
      ];

      setNotes(rootNotes);
      setLoading(false);
    }, 1000);
  };

  // Function to load trash items separately
  const fetchTrashItems = async () => {
    // Don't reload if already loaded
    if (trashLoaded) {
      return Promise.resolve(trashNotes);
    }
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulating an API call to fetch trash items
        const trashItems = [
          {
            _id: "14",
            title: "Deleted Note 1",
            isFolder: false,
            parentId: null,
            deletedAt: new Date().toISOString(),
            content: "This note has been deleted",
          },
          {
            _id: "16",
            title: "Deleted Note 2",
            isFolder: false,
            parentId: null,
            deletedAt: new Date().toISOString(),
            content: "Another deleted note",
          },
        ];

        setTrashNotes(trashItems);
        setTrashLoaded(true);
        resolve(trashItems);
      }, 500);
    });
  };

  // Function to fetch children of a specific folder when expanded
  const fetchFolderChildren = async (folderId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulating an API call to fetch children for this folder
        const allNotes = [
          {
            _id: "1",
            title: "Getting Started",
            isFolder: true,
            parentId: null,
          },
          {
            _id: "2",
            title: "Welcome Note",
            isFolder: false,
            content: "Welcome to your new note app!",
            parentId: "1",
          },
          {
            _id: "3",
            title: "Features",
            isFolder: false,
            content: "Here are some features of this app...",
            parentId: "1",
          },
          {
            _id: "4",
            title: "Projects",
            isFolder: true,
            parentId: null,
          },
          {
            _id: "5",
            title: "Project A",
            isFolder: false,
            content: "Project A details...",
            parentId: "4",
          },
          {
            _id: "6",
            title: "Personal",
            isFolder: true,
            parentId: null,
          },
          {
            _id: "7",
            title: "Todo List",
            isFolder: false,
            content: "Things to do...",
            parentId: "6",
          },
          {
            _id: "8",
            title: "Shopping List",
            isFolder: false,
            content: "Items to buy...",
            parentId: "6",
          },
          {
            _id: "9",
            title: "Work",
            isFolder: true,
            parentId: null,
          },
          {
            _id: "10",
            title: "Meeting Notes",
            isFolder: false,
            content: "Notes from the last meeting...",
            parentId: "9",
          },
          {
            _id: "11",
            title: "Project B",
            isFolder: true,
            parentId: "9",
          },
          {
            _id: "12",
            title: "Archived",
            isFolder: false,
            parentId: null,
          },
          {
            _id: "13",
            title: "Personal Archive",
            isFolder: false,
            content: "These are old notes...",
            parentId: "11",
          },
        ];

        // Filter for children of the requested folder
        const children = allNotes.filter((note) => note.parentId === folderId);

        // Add these children to our notes state
        setNotes((prevNotes) => {
          // Create a unique set of notes by ID
          const notesMap = {};
          [...prevNotes, ...children].forEach((note) => {
            notesMap[note._id] = note;
          });

          // Convert back to array
          return Object.values(notesMap);
        });

        // Mark this folder as loaded
        setLoadedFolders((prev) => new Set([...prev, folderId]));

        // Resolve the promise with the children
        resolve(children);
      }, 500);
    });
  };

  const onSelectNote = (note) => {
    console.log("Selected note:", note);
  };

  const onDeleteNote = (noteId) => {
    console.log("Delete note:", noteId);
    
    // Find the note to be deleted
    const noteToDelete = notes.find(note => note._id === noteId);
    
    if (noteToDelete) {
      // Remove from notes
      setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
      
      // Add to trash with deletedAt timestamp
      const trashedNote = {
        ...noteToDelete,
        deletedAt: new Date().toISOString()
      };
      
      setTrashNotes(prevTrash => [...prevTrash, trashedNote]);
    }
  };

  const onRestoreNote = (noteId) => {
    console.log("Restore note:", noteId);
    
    // Find the note to restore
    const noteToRestore = trashNotes.find(note => note._id === noteId);
    
    if (noteToRestore) {
      // Remove from trash
      setTrashNotes(prevTrash => prevTrash.filter(note => note._id !== noteId));
      
      // Add back to notes without deletedAt
      const { deletedAt, ...restoredNote } = noteToRestore;
      setNotes(prevNotes => [...prevNotes, restoredNote]);
    }
  };

  const onRenameNote = ({ id, title }) => {
    console.log("Rename note:", id, "to title:", title);
  };

  const onCreateNote = ({ title, parentId, isFolder }) => {
    console.log(
      "Create note:",
      title,
      "with parentId:",
      parentId,
      "isFolder:",
      isFolder
    );
  };

  const onDuplicateNote = (noteId) => {
    console.log("Duplicate note:", noteId);
  };

  const onMoveNote = (noteId, newParentId) => {
    console.log("Move note:", noteId, "to parentId:", newParentId);
  };

  const onRefresh = () => {
    setLoading(true);
    setLoadedFolders(new Set()); // Reset loaded folders tracking
    setTrashLoaded(false); // Reset trash loaded state
    setTrashNotes([]); // Clear trash notes
    fetchRootNotes();
  };

  // Fetch root notes on initial load
  useEffect(() => {
    fetchRootNotes();
  }, []);

  return (
    <>
      <NoteList
        notes={notes}
        trashNotes={trashNotes}
        loading={loading}
        onSelectNote={onSelectNote}
        onDeleteNote={onDeleteNote}
        onRestoreNote={onRestoreNote}
        onRenameNote={onRenameNote}
        onCreateNote={onCreateNote}
        onDuplicateNote={onDuplicateNote}
        onMoveNote={onMoveNote}
        onRefresh={onRefresh}
        onLoadFolderChildren={fetchFolderChildren}
        onLoadTrash={fetchTrashItems}
      />
    </>
  );
}
