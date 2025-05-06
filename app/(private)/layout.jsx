"use client";

import React, { useState, useEffect, useMemo } from "react";

import useCurrentUser from "@/hooks/useCurrentUser";
import useWindowSize from "@/hooks/useWindowSize";

import Header from "@/components/layouts/private/Header";
import Sidebar from "@/components/layouts/private/Sidebar";

import { Layout, Spin } from "antd";

export default function PrivateLayout({ children }) {
  const { user, loading, authenticated } = useCurrentUser();
  const windowSize = useWindowSize();
  
  // Calculate isMobile once when window size changes
  const isMobile = useMemo(() => windowSize.width < 768, [windowSize.width]);

  // Initialize sidebar state based on device type
  const [open, setOpen] = useState(!isMobile);

  // Update drawer state when screen size changes
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Show loading state if user data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Handle unauthenticated state
  if (!authenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">You need to be logged in to access this area</p>
        </div>
      </div>
    );
  }

  return (
    <Layout className="min-h-screen">
      <Header 
        user={user}
        isMobile={isMobile} 
        open={open} 
        toggleDrawer={toggleDrawer} 
      />
      <Layout className="pt-[52px]">
        <Sidebar 
          user={user}
          isMobile={isMobile} 
          open={open} 
          toggleDrawer={toggleDrawer} 
        />
        <Layout
          style={{
            marginLeft: 0,
            transition: "all 0.2s",
          }}
        >
          <Layout.Content className="p-4 m-0 min-h-[280px] overflow-auto">
            {children}
          </Layout.Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
