"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import useNotify from "@/hooks/useNotify";
import { logout } from "@/services/authService";

import { Layout, Button, Avatar, Dropdown } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import Image from "next/image";

export default function Header({ user, open, toggleDrawer }) {
  const notify = useNotify();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      notify.loading("Logging out...");
      await logout();
      notify.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      notify.error("Logout failed");
    }
  };

  const handleMenuClick = (key) => {
    switch (key) {
      case "profile":
        router.push("/profile");
        break;
      case "settings":
        router.push("/settings");
        break;
      default:
        break;
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      onClick: () => handleMenuClick("profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => handleMenuClick("settings"),
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
        padding: "0 16px",
        height: "52px",
      }}
    >
      <div className="flex items-center">
        <Button
          type="text"
          icon={
            open ? (
              <MenuFoldOutlined className="!text-lg mt-[27px]" />
            ) : (
              <MenuUnfoldOutlined className="!text-lg mt-[27px]" />
            )
          }
          onClick={toggleDrawer}
          className="mr-3"
        />
        <Link href="/home" className="flex items-center">
          <Image src="/images/logo.png" alt="Logo" width={20} height={20} />
          <h1 className="ml-2 mt-1 !text-[#000000E0] text-lg font-semibold">Note-Taking App</h1>
        </Link>
      </div>

      <div className="flex items-center">
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <div className="flex items-center cursor-pointer">
            <span className="mr-2 hidden sm:inline">
              {user?.username || "User"}
            </span>
            <Avatar icon={<UserOutlined />} alt={user?.username || "User"} />
          </div>
        </Dropdown>
      </div>
    </Layout.Header>
  );
}
