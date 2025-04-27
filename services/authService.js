import api from "@/lib/api";
import { signIn, signOut } from "next-auth/react";

export const login = async (email, password) => {
  const res = await signIn("credentials", {
    redirect: false,
    email,
    password,
  });

  if (res.error) {
    throw new Error(res.error);
  }

  return res;
};

export const register = async (username, email, password) => {
  return await api.post("/register", {
    username,
    email,
    password,
  });
};

export const logout = async () => {
  const res = await signOut({ redirect: false });

  if (res.error) {
    throw new Error(res.error);
  }
};
