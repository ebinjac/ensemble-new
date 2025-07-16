import { AdminSidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6">
          {children}
        </div>
      </main>
    </div>
  );
} 