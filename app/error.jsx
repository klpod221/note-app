'use client';

import { Result, Button } from 'antd';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 p-4">
      <Result
        status="warning"
        title="Something went wrong!"
        subTitle="We encountered an error while loading this page."
        extra={[
          <Button type="primary" key="retry" onClick={() => reset()}>
            Try again
          </Button>,
          <Button key="home" href="/">
            Back to Home
          </Button>
        ]}
        className="shadow-lg rounded-lg p-6"
      />
    </div>
  );
}