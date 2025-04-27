import "@/styles/globals.css";

import Providers from "@/providers/Providers";

export const metadata = {
  title: "Note Taking App by klpod221",
  description: "A simple note taking app with markdown editor",
  authors: [
    {
      name: "klpod221",
      url: "https://klpod221.com",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
          <Providers>{children}</Providers>
      </body>
    </html>
  );
}
