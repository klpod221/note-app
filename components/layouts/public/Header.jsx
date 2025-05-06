"use client";

import { useState } from "react";
import { Button, Menu, Drawer, Image } from "antd";
import Link from "next/link";
import {
  MenuOutlined,
  HomeOutlined,
  BookOutlined,
  InfoCircleOutlined,
  LoginOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [current, setCurrent] = useState("home");

  const handleMenuClick = (e) => {
    setCurrent(e.key);
    setMobileMenuOpen(false);
  };

  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: <Link href="/#home">Home</Link>,
    },
    {
      key: "features",
      icon: <BookOutlined />,
      label: <Link href="/#features">Features</Link>,
    },
    {
      key: "about",
      icon: <InfoCircleOutlined />,
      label: <Link href="/#about">About</Link>,
    },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/images/logo.png" alt="Logo" width={20} height={20} />
            <h1 className="ml-2 mt-1 !text-[#000000E0] text-lg font-semibold">
              Note-Taking App
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block w-[300px]">
            <Menu
              mode="horizontal"
              items={menuItems}
              selectedKeys={[current]}
              onClick={handleMenuClick}
              className="!border-0"
            />
          </div>

          {/* Authentication Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/login">
              <Button type="text" icon={<LoginOutlined />}>
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button type="primary" icon={<UserAddOutlined />}>
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              size="large"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
      >
        <Menu
          mode="vertical"
          items={menuItems}
          selectedKeys={[current]}
          onClick={handleMenuClick}
          style={{ border: "none" }}
        />
        <div className="mt-8 pt-4 border-t space-y-4">
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button type="default" icon={<LoginOutlined />} block>
              Login
            </Button>
          </Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
            <Button type="primary" icon={<UserAddOutlined />} block>
              Sign Up
            </Button>
          </Link>
        </div>
      </Drawer>
    </header>
  );
};

export default Header;
