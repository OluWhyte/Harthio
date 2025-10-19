export const metadata = {
  title: "Admin Login - Harthio",
  description: "Admin login for Harthio platform",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout will be overridden by the parent admin layout
  // The parent layout will conditionally hide navigation for login page
  return <>{children}</>;
}