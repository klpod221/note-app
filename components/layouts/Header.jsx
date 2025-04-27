"use client";

import React from "react";

import useNotify from "@/hooks/useNotify";
import { logout } from "@/services/authService";

import { Layout, Button, Avatar, Dropdown } from "antd";
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from "@ant-design/icons";

const Header = ({ user, open, toggleDrawer }) => {
  const notify = useNotify();

  const handleLogout = async () => {
    try {
      notify.loading("Logging out...");
      await logout();
      notify.success("Logged out successfully");
    } catch (error) {
      notify.error("Logout failed");
    }
  }

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign out",
      onClick: () => handleLogout(),
    },
  ];

  return (
    <Layout.Header
      className="fixed top-0 left-0 w-full z-10 flex items-center justify-between px-4 border-b border-gray-100"
      style={{ 
        background: "#fff",
        padding: '0 16px',
        height: '64px'
      }}
    >
      <div className="flex items-center">
        <Button
          type="text"
          icon={open ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={toggleDrawer}
          className="mr-3"
        />
        <h1 className="text-lg font-bold m-0">Note Taking App</h1>
      </div>

      <div className="flex items-center">
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <div className="flex items-center cursor-pointer">
            <span className="mr-2 hidden sm:inline">
              {user?.username || "User"}
            </span>
            <Avatar 
              icon={<UserOutlined />}
              alt={user?.username || "User"} 
            />
          </div>
        </Dropdown>
      </div>
    </Layout.Header>
  );
};

export default Header;
