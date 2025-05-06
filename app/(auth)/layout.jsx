import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2">
      <div className="flex items-center justify-center p-6 order-2 md:order-1">
        <div className="w-full max-w-md p-8 bg-white rounded-xl">
          {children}
        </div>
      </div>

      <div className="bg-gradient-to-br from-teal-500 to-blue-500 flex flex-col items-center justify-center p-12 order-1 md:order-2">
        <div className="bg-gray-200 rounded-full p-6">
          <Image
            priority
            width={100}
            height={100}
            src="/images/logo.png"
            alt="Logo"
            className="drop-shadow-lg transform hover:scale-105 transition-transform"
          />
        </div>
        <h1 className="text-3xl font-bold text-center mt-4">
          Note-Taking App by{" "}
          <Link
            href="https://klpod221.com"
            target="_blank"
            className="!text-[#000000E0] hover:!underline"
            rel="noopener noreferrer"
          >
            klpod221
          </Link>
        </h1>
        <p className="mt-4 max-w-md text-center">
          A beautiful and intuitive app to organize your notes, ideas, and tasks
          all in one place.
        </p>
      </div>
    </div>
  );
}
