import React from "react";
import {
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Layout, Button, Dropdown, Avatar } from "antd";

const { Header } = Layout;

export default function AppHeader({ isMobile, open, toggleDrawer }) {
  // User dropdown menu items
  const userMenuItems = [
    {
      key: "1",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "2",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "3",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
    },
  ];

  return (
    <Header
      className="flex items-center justify-between fixed w-full z-10"
      style={{ padding: isMobile ? "0 10px" : "0" }}
    >
      <div className="flex items-center">
        {isMobile ? (
          <>
            <Button
              type="text"
              icon={
                open ? (
                  <MenuFoldOutlined style={{ color: "white", fontSize: "18px" }} />
                ) : (
                  <MenuUnfoldOutlined style={{ color: "white", fontSize: "18px" }} />
                )
              }
              onClick={toggleDrawer}
              style={{ height: "40px", width: "40px" }}
            />
            <div className="ml-2 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                Note Taking
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-[200px] flex items-center justify-center">
              <span className="w-[120px] h-[32px] bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold text-white">
                Note Taking
              </span>
            </div>
            <Button
              type="text"
              icon={
                open ? (
                  <MenuFoldOutlined style={{ color: "white", fontSize: "18px" }} />
                ) : (
                  <MenuUnfoldOutlined style={{ color: "white", fontSize: "18px" }} />
                )
              }
              onClick={toggleDrawer}
              style={{ height: "40px", width: "40px" }}
            />
          </>
        )}
      </div>
      <div className={isMobile ? "ml-auto" : "mr-4"}>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div className="cursor-pointer flex items-center gap-1">
            <Avatar icon={<UserOutlined />} />
            <span className="text-white hidden sm:inline">User Name</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
}