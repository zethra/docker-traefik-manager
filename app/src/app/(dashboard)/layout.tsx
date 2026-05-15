import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar className="hidden md:flex md:w-64" />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3 md:px-6">
          <MobileNav />
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
