export default function AuthLayout({ children }) {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
}
