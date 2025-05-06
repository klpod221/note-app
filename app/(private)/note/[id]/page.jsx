"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Result, Button } from "antd";
import useNoteStore from "@/store/noteStore";

import { updateNote } from "@/services/noteService";

import NoteEditor from "@/components/NoteEditor";

export default function NotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { fetchNote, note, noteLoading } = useNoteStore();

  // Fetch note on component mount or id change
  useEffect(() => {
    if (id) {
      const loadNote = async () => {
        await fetchNote(id);
      };

      loadNote();
    }
  }, [id, fetchNote]);

  // Loading state
  if (noteLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-96px)]">
        <Spin size="large" />
      </div>
    );
  }

  // Not found state
  if (!note._id) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-96px)]">
        <Result
          status="404"
          title="Note Not Found"
          subTitle="Sorry, the note you are looking for does not exist or was deleted."
          extra={
            <Button type="primary" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-84px)]">
      <NoteEditor updateNote={updateNote} />
    </div>
  );
}
