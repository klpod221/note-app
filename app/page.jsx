"use client";

import Link from "next/link";
import { Button, Card, Divider } from "antd";
import { EditOutlined, InfoCircleOutlined } from "@ant-design/icons";

export default function Page() {
  return (
    <div className="h-screen  p-4 sm:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Note Taking App
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            <span className="text-gray-500">Created by </span>
            <Link
              href="https://klpod221.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              klpod221
            </Link>
          </p>

          <Divider className="my-4 sm:my-6" />

          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            A simple note-taking app with markdown editor
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/notes">
              <Button
                type="primary"
                size="large"
                icon={<EditOutlined />}
                className="w-full sm:w-auto"
              >
                Start Writing
              </Button>
            </Link>
            <Link href="/about">
              <Button
                type="default"
                size="large"
                icon={<InfoCircleOutlined />}
                className="w-full sm:w-auto"
              >
                About
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
