import { AdminShell } from "@/components/AdminShell";
import { AdminOrdersClient } from "@/components/AdminOrdersClient";

export default function AdminOrdersPage() {
  return (
    <AdminShell>
      <AdminOrdersClient />
    </AdminShell>
  );
}
