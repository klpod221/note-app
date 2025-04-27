"use client";

import React, { useState, useEffect } from "react";
import { Layout } from "antd";
import useWindowSize from "@/hook/useWindowSize";
import Header from "@/components/layouts/Header";
import Sidebar from "@/components/layouts/Sidebar";

const { Content } = Layout;

export default function Main({ children }) {
  const windowSize = useWindowSize();
  const isMobile = windowSize.width < 768;

  const [open, setOpen] = useState(!isMobile);

  // Update drawer state when screen size changes
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Layout className="min-h-screen">
      <Header isMobile={isMobile} open={open} toggleDrawer={toggleDrawer} />
      <Layout className="pt-[64px]">
        <Sidebar isMobile={isMobile} open={open} toggleDrawer={toggleDrawer} />
        <Layout
          style={{
            marginLeft: isMobile ? 0 : open ? 200 : 0,
            transition: "margin 0.2s",
          }}
        >
          <Content className="p-4 m-0 min-h-[280px] overflow-auto">
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
