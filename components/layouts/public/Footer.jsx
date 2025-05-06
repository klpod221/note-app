"use client";

import { HeartFilled } from "@ant-design/icons";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 py-2 text-center text-gray-400 flex flex-col justify-center items-center">
      <p>© {currentYear} Note-Taking App. All rights reserved.</p>
      <p className="flex items-center">
        Made with <HeartFilled className="!text-red-500 mx-1" /> by klpod221
      </p>
    </footer>
  );
}
