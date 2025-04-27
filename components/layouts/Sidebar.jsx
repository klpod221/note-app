import React from "react";
import {
  LaptopOutlined,
  NotificationOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Drawer } from "antd";

// Navigation menu items
const menuItems = [UserOutlined, LaptopOutlined, NotificationOutlined].map(
  (icon, index) => {
    const key = String(index + 1);
    return {
      key: `sub${key}`,
      icon: React.createElement(icon),
      label: `subnav ${key}`,
      children: Array.from({ length: 4 }).map((_, j) => {
        const subKey = index * 4 + j + 1;
        return {
          key: subKey,
          label: `option${subKey}`,
        };
      }),
    };
  }
);

export default function Sidebar({ isMobile, open, toggleDrawer }) {
  return (
    <Drawer
      closable={false}
      placement="left"
      onClose={toggleDrawer}
      open={open}
      width={200}
      mask={isMobile}
      styles={{
        body: {
          padding: 0,
        },
        wrapper: {
          top: 64,
          boxShadow: "none",
        },
        mask: {
          top: 64,
        },
      }}
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        style={{ height: "100%", borderRight: 0 }}
        items={menuItems}
      />
    </Drawer>
  );
}