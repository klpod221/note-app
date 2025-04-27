"use client";

import { createContext, useContext } from "react";
import { App } from "antd";

const MessageContext = createContext(null);

export const MessageProvider = ({ children }) => {
  const { message } = App.useApp();

  return (
    <MessageContext.Provider value={{ message }}>
      {children}
    </MessageContext.Provider>
  );
};

export function useMessage() {
  return useContext(MessageContext);
}
