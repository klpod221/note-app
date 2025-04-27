"use client";

import { App } from "antd";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <App>{children}</App>
    </SessionProvider>
  );
}
