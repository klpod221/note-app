"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { SessionProvider } from "next-auth/react";
import { App } from "antd";
import { MessageProvider } from "@/providers/MessageProvider";

export default function Providers({ children }) {
  return (
    <AntdRegistry>
      <SessionProvider>
        <App>
          <MessageProvider>{children}</MessageProvider>
        </App>
      </SessionProvider>
    </AntdRegistry>
  );
}
