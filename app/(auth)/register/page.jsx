"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import useNotify from "@/hooks/useNotify";
import { register } from "@/services/authService";

import { Form, Input, Button, Divider } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";

export default function Register() {
  const router = useRouter();
  const notify = useNotify();

  const onFinish = async (values) => {
    try {
      notify.loading("Registering...");
      const { username, email, password } = values;
      await register(username, email, password);
      notify.success("Registration successful! Please login.");
      router.push("/login");
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Create an Account
      </h1>
      <Form name="register" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item
          name="username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Username" />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Please input your password!" },
            { min: 6, message: "Password must be at least 6 characters!" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("The two passwords do not match!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm Password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full"
          >
            Register
          </Button>
        </Form.Item>

        <Divider plain />

        <div className="text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Login
          </Link>
        </div>
      </Form>
    </>
  );
}
