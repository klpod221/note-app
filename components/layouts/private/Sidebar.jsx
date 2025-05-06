"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import NoteList from "@/components/NoteList";
import useNoteStore from "@/store/noteStore";

import { Layout, Drawer } from "antd";
const { Sider } = Layout;

export default function Sidebar ({ isMobile, open, toggleDrawer }) {
  const router = useRouter();
  const { note } = useNoteStore();

  const resizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const [siderWidth, setSiderWidth] = useState(250);

  const handleSelectNote = (selectedNote) => {
    if (selectedNote.key !== note.id && !selectedNote.isFolder) {
      if (isMobile) {
        toggleDrawer();
      }
      router.push(`/note/${selectedNote.key}`);
    }
  };

  // Handle resizing functionality
  const handleMouseDown = (e) => {
    resizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = siderWidth;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e) => {
    if (resizingRef.current) {
      const newWidth = startWidthRef.current + (e.clientX - startXRef.current);
      // Set min and max width constraints
      if (newWidth >= 200 && newWidth <= 500) {
        setSiderWidth(newWidth);
      } else if (newWidth < 200) {
        setSiderWidth(200);
      } else if (newWidth > 500) {
        setSiderWidth(500);
      }
    }
  };

  const handleMouseUp = () => {
    resizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const sidebarContent = (
    <div className="h-full flex flex-col">
      <NoteList onSelectNote={handleSelectNote} />
    </div>
  );

  // For mobile: use Drawer with horizontal scroll
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
            overflowX: "auto", // Add horizontal scrolling
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // For desktop: use resizable Sider
  return (
    <>
      <Sider
        width={siderWidth}
        theme="light"
        collapsible={false}
        trigger={null}
        collapsedWidth={0}
        collapsed={!open}
        className="h-screen fixed left-0"
        style={{
          overflow: "hidden",
          height: "calc(100vh - 52px)",
          position: "relative",
        }}
      >
        {sidebarContent}
        {/* Resizer handle */}
        {open && (
          <div
            className="absolute top-0 right-0 w-[5px] h-full cursor-ew-resize z-[100] transition-colors duration-200 hover:bg-blue-400"
            onMouseDown={handleMouseDown}
          />
        )}
      </Sider>
    </>
  );
};
