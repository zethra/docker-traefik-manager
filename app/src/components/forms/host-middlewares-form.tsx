"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { setHostMiddlewares } from "@/server/actions/hosts";

type Middleware = { id: string; name: string; type: string };

type Props = {
  hostId: string;
  allMiddlewares: Middleware[];
  selectedIds: string[];
  onSuccess?: () => void;
};

export function HostMiddlewaresForm({
  hostId,
  allMiddlewares,
  selectedIds,
  onSuccess,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(selectedIds);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const move = (id: string, dir: -1 | 1) => {
    setSelected((prev) => {
      const idx = prev.indexOf(id);
      const next = idx + dir;
      if (idx === -1 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  const orderedSelected = selected
    .map((id) => allMiddlewares.find((m) => m.id === id))
    .filter((m): m is Middleware => Boolean(m));
  const unselected = allMiddlewares.filter((m) => !selected.includes(m.id));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await setHostMiddlewares(hostId, selected);
          if (result.ok) {
            toast.success("Middlewares updated");
            onSuccess?.();
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      {orderedSelected.length > 0 && (
        <div className="space-y-2">
          <Label>Chain order (top to bottom)</Label>
          <ul className="space-y-1.5 rounded-md border p-2">
            {orderedSelected.map((m, i) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
              >
                <span className="flex-1 truncate">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {m.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {m.type}
                  </span>
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(m.id, -1)}
                    disabled={i === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => move(m.id, 1)}
                    disabled={i === orderedSelected.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(m.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label>Available middlewares</Label>
        {unselected.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            All middlewares are attached.
          </p>
        ) : (
          <ul className="space-y-1.5 rounded-md border p-2">
            {unselected.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <Checkbox
                  id={`mw-${m.id}`}
                  checked={false}
                  onCheckedChange={() => toggle(m.id)}
                />
                <Label htmlFor={`mw-${m.id}`} className="flex-1 cursor-pointer">
                  {m.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    {m.type}
                  </span>
                </Label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save middleware chain
      </Button>
    </form>
  );
}
