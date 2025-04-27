'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Form, Input, Button, Checkbox, Divider, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

export default function Login() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Implement login logic here
      console.log('Login values:', values);
      message.success('Login successful!');
      // Redirect to app after login
    } catch (error) {
      message.error('Login failed!');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Please input your email!' },
                 { type: 'email', message: 'Please enter a valid email!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" />
        </Form.Item>

        <Form.Item>
          <div className="flex justify-between items-center">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Link href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </Form.Item>
        
        <Divider plain>Or</Divider>
        
        <div className="text-center mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register">
            Register now
          </Link>
        </div>
      </Form>
    </>
  );
}