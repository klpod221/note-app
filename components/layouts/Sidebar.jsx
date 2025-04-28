"use client";

import React from "react";
import { useRouter } from "next/navigation";

import NoteList from "@/components/NoteList";
import useNoteStore from "@/store/noteStore";

import { Layout, Drawer } from "antd";
const { Sider } = Layout;

export default function Sidebar ({ isMobile, open, toggleDrawer }) {
  const router = useRouter();
  const { note } = useNoteStore();

  const handleSelectNote = (selectedNote) => {
    if (selectedNote.key !== note.id && !selectedNote.isFolder) {
      if (isMobile) {
        toggleDrawer();
      }
      router.push(`/note/${selectedNote.key}`);
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <NoteList onSelectNote={handleSelectNote} />
    </div>
  );

  // For mobile: use Drawer
  if (isMobile) {
    return (
      <Drawer
        placement="left"
        closable={false}
        onClose={toggleDrawer}
        open={open}
        width={250}
        styles={{
          body: {
            padding: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // For desktop: use Sider
  return (
    <Sider
      width={250}
      theme="light"
      collapsible={false}
      trigger={null}
      collapsedWidth={0}
      collapsed={!open}
      className="h-screen fixed left-0"
      style={{
        overflow: "hidden",
        height: "calc(100vh - 64px)",
      }}
    >
      {sidebarContent}
    </Sider>
  );
};
