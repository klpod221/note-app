"use client";

import React from "react";
import NoteList from "@/components/NoteList";
import useNoteStore from "@/store/noteStore";

export default function NoteContainer() {
  const { activeNoteId, setActiveNoteId } = useNoteStore();

  const handleSelectNote = (note) => {
    console.log("Selected note:", note);
    setActiveNoteId(note.key);
  };

  return (
    <>
      <NoteList 
        activeNoteId={activeNoteId} 
        onSelectNote={handleSelectNote} 
      />
    </>
  );
}
