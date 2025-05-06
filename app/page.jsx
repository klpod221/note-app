"use client";

import { useState, useEffect } from "react";
import { Button, Card, Space, Tag } from "antd";
import {
  EditOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  RocketOutlined,
  GithubOutlined,
  CodeOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  LayoutOutlined,
  RiseOutlined,
} from "@ant-design/icons";

import Link from "next/link";

import NoteEditor from "@/components/NoteEditor";
import Header from "@/components/layouts/public/Header";
import Footer from "@/components/layouts/public/Footer";
import { fetchReadmeNotes } from "@/services/noteService";

export default function LandingPage() {
  const [readmeContent, setReadmeContent] = useState("");

  useEffect(() => {
    // Define an async function inside the useEffect
    const fetchReadme = async () => {
      try {
        const data = await fetchReadmeNotes();
        if (data && data.content) {
          setReadmeContent(data.content);
        } else {
          throw new Error("Failed to load README");
        }
      } catch (error) {
        console.error("Error loading README:", error);
        // Fallback content if API not available
        setReadmeContent(`# Note App

A simple note application that allows you to create, manage, and organize your notes. Built with Next.js, Ant Design, MongoDB, and more.

## Features

- User authentication
- Rich text formatting with Markdown
- Custom Monaco editor
- Categories for organization
- And more!

Try editing this content to see how the editor works!`);
      }
    };

    // Call the async function
    fetchReadme();
  }, []);

  const features = [
    {
      title: "Markdown Editor",
      description: "Powerful markdown editor with preview and split view modes",
      icon: <EditOutlined className="!text-blue-500 text-2xl" />,
    },
    {
      title: "MongoDB Storage",
      description: "Your notes securely stored in MongoDB database",
      icon: <DatabaseOutlined className="!text-green-500 text-2xl" />,
    },
    {
      title: "Redis Caching",
      description: "Fast performance with Redis caching",
      icon: <CloudServerOutlined className="!text-red-500 text-2xl" />,
    },
    {
      title: "Secure Authentication",
      description: "Safe user authentication with NextAuth.js",
      icon: <SafetyCertificateOutlined className="!text-yellow-500 text-2xl" />,
    },
    {
      title: "Real-time Sync",
      description: "Future support for syncing across devices",
      icon: <SyncOutlined className="!text-purple-500 text-2xl" />,
    },
    {
      title: "Easy Deployment",
      description: "Ready to deploy on Vercel with minimal setup",
      icon: <RocketOutlined className="!text-orange-500 text-2xl" />,
    },
  ];

  const techStack = [
    {
      name: "Next.js",
      description: "React framework for production",
      icon: <CodeOutlined className="text-2xl" />,
      color: "bg-black",
    },
    {
      name: "MongoDB",
      description: "Document-based database",
      icon: <DatabaseOutlined className="text-2xl" />,
      color: "bg-green-600",
    },
    {
      name: "Redis",
      description: "In-memory data structure store",
      icon: <ThunderboltOutlined className="text-2xl" />,
      color: "bg-red-600",
    },
    {
      name: "Ant Design",
      description: "UI component library",
      icon: <AppstoreOutlined className="text-2xl" />,
      color: "bg-blue-600",
    },
    {
      name: "TailwindCSS",
      description: "Utility-first CSS framework",
      icon: <LayoutOutlined className="text-2xl" />,
      color: "bg-sky-500",
    },
    {
      name: "Monaco Editor",
      description: "Code editor for the web",
      icon: <RiseOutlined className="text-2xl" />,
      color: "bg-purple-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <div
          id="home"
          className="bg-gradient-to-r from-teal-500 to-blue-500 text-white py-20"
        >
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Note-Taking App
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              A powerful, markdown-based note-taking application built with
              Next.js and Ant Design. Organize your thoughts, create lists,
              and keep track of everything important.
            </p>
            <Space size="large" className="justify-center">
              <Link href="/register">
                <Button type="primary" size="large">
                  Get Started
                </Button>
              </Link>
              <Button
                size="large"
                icon={<GithubOutlined />}
                href="https://github.com/klpod221/note-app"
                target="_blank"
              >
                GitHub
              </Button>
            </Space>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="h-full hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center">
              Try the Editor
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Experience our powerful markdown editor with live preview
            </p>
            <div
              className="border rounded-lg overflow-hidden shadow-lg"
              style={{ height: "500px" }}
            >
              <NoteEditor content={readmeContent} />
            </div>
            <div className="mt-6 text-center">
              <Tag color="blue">Edit Mode</Tag>
              <Tag color="green">Preview Mode</Tag>
              <Tag color="purple">Split Mode</Tag>
              <p className="text-gray-500 mt-2">
                Toggle between different view modes and try the markdown
                formatting
              </p>
            </div>
          </div>
        </div>

        {/* About & Tech Stack Section */}
        <div id="about" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8">
              About the Project
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* About Content */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-md h-full">
                  <h3 className="text-2xl font-semibold mb-4">
                    Note-Taking App
                  </h3>
                  <p className="text-gray-700 mb-3">
                    An open-source project featuring a clean yet powerful
                    interface for note management with markdown support. Built
                    with modern web technologies.
                  </p>
                  <p className="text-gray-700">
                    Designed for productivity and ease of use, this application
                    welcomes contributions from the community. Join us in making
                    note-taking better for everyone.
                  </p>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-2xl font-semibold mb-6">Tech Stack</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {techStack.map((tech, index) => (
                      <div key={index} className="flex items-start">
                        <div
                          className={`p-3 mr-4 rounded-full ${tech.color} text-white flex items-center justify-center`}
                        >
                          {tech.icon}
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold mb-1">
                            {tech.name}
                          </h4>
                          <p className="text-gray-600">{tech.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 bg-gradient-to-r from-teal-500 to-blue-500 text-white">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8">
              Create an account now and start organizing your notes with our
              powerful editor
            </p>
            <Space size="large">
              <Link href="/register">
                <Button type="primary" size="large">
                  Sign Up Now
                </Button>
              </Link>
              <Link href="/login">
                <Button size="large" ghost>
                  Login
                </Button>
              </Link>
            </Space>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
