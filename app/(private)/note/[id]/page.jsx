"use client";

import { useParams } from "next/navigation";
import NoteEditor from "@/components/NoteEditor";

export default function NotePage() {
  const { id } = useParams();

  return (
    <div className="flex flex-col h-[calc(100vh-96px)]">
      <NoteEditor id={id} />
    </div>
  );
}
