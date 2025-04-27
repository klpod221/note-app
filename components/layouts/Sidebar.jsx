"use client";

import React, { useState, useEffect } from "react";

import NoteList from "@/components/NoteList";

import { Layout, Drawer } from "antd";
const { Sider } = Layout;

const Sidebar = ({ user, isMobile, open, toggleDrawer }) => {
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notes, setNotes] = useState([]);

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
          parent: "6",
        }
      ];
      
      setNotes(sampleNotes);
      setNotesLoading(false);
    }, 1000);
  }, []);

  const handleSelectNote = (node) => {
    setActiveNoteId(node.key);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <NoteList 
        notes={notes} 
        loading={notesLoading} 
        onSelectNote={handleSelectNote}
        activeNoteId={activeNoteId}
      />
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
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
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
