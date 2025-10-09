import { AdminNav } from '@/components/admin/admin-nav';

export const metadata = {
  title: "Harthio Admin",
  description: "Admin panel for managing Harthio content",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      {children}
    </div>
  );
}
