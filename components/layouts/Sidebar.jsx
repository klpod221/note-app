"use client";

import React, { useState, useEffect } from "react";

import NoteContainer from "@/components/NoteContainer";

import { Layout, Drawer } from "antd";
const { Sider } = Layout;

const Sidebar = ({ isMobile, open, toggleDrawer }) => {
  const sidebarContent = (
    <div className="h-full flex flex-col">
      <NoteContainer />
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
