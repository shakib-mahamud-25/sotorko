import { AdminAuthProvider } from "@/components/admin/admin-auth-context";
import { AdminLoginGate } from "@/components/admin/admin-login-gate";
import { ModerationDashboard } from "@/components/admin/moderation-dashboard";

export const metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminLoginGate>
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <ModerationDashboard />
        </div>
      </AdminLoginGate>
    </AdminAuthProvider>
  );
}
