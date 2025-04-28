'use client';

import { Result, Button } from 'antd';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <Result
          status="error"
          title="Something went wrong!"
          subTitle={`We're sorry for the inconvenience. The error has been logged.`}
          extra={[
            <Button type="primary" key="console" onClick={() => reset()}>
              Try again
            </Button>,
            <Button key="home" href="/">
              Back to Home
            </Button>,
          ]}
          className="shadow-lg rounded-lg p-6"
        />
      </body>
    </html>
  );
}