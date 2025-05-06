"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import useNotify from "@/hooks/useNotify";
import { login } from "@/services/authService";

import { Form, Input, Button, Checkbox, Divider } from "antd";
import { LockOutlined, MailOutlined, LoginOutlined } from "@ant-design/icons";

export default function Login() {
  const router = useRouter();
  const notify = useNotify();

  const onFinish = async (values) => {
    try {
      notify.loading("Logging in...");
      await login(values.email, values.password);
      notify.success("Login successful!");
      router.push("/home");
    } catch (error) {
      notify.error(error.message || "Login failed");
      console.error(error);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-center mb-6">
        Login to Your Account
      </h2>
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
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
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>

        <Form.Item>
          <div className="flex justify-between items-center">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            icon={<LoginOutlined />}
            htmlType="submit"
            className="w-full"
          >
            Login
          </Button>
        </Form.Item>

        <Divider plain />

        <div className="text-center mt-4">
          Don&apos;t have an account? <Link href="/register">Register now</Link>
        </div>
      </Form>
    </>
  );
}
