"use client";

import React from "react";

import NoteList from "@/components/NoteList";
import useNoteStore from "@/store/noteStore";

import { Layout, Drawer } from "antd";
const { Sider } = Layout;

const Sidebar = ({ isMobile, open, toggleDrawer }) => {
  const { activeNoteId, setActiveNoteId } = useNoteStore();

  const handleSelectNote = (note) => {
    console.log("Selected note:", note);
    setActiveNoteId(note.key);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <NoteList activeNoteId={activeNoteId} onSelectNote={handleSelectNote} />
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

export default Sidebar;
