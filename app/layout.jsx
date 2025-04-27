import "@/styles/globals.css";

import { App } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";

export const metadata = {
  title: "Note Taking App by klpod221",
  description: "A simple note taking app with markdown editor",
  authors: [
    {
      name: "klpod221",
      url: "klpod221.com",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <AntdRegistry>
          <App>{children}</App>
        </AntdRegistry>
      </body>
    </html>
  );
}
