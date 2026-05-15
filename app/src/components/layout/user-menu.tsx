import { LogOut, User as UserIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { logout } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function UserMenu() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <UserIcon className="size-4" />
          <span className="hidden sm:inline">{session.user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">
          {session.user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="w-full flex items-center gap-2 text-left"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
