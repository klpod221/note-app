import { Result, Button } from 'antd';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Link href="/" passHref>
            <Button type="primary">Back Home</Button>
          </Link>
        }
        className="shadow-lg rounded-lg p-6"
      />
    </div>
  );
}