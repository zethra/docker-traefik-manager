"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDomain, updateDomain } from "@/server/actions/domains";

type DomainFormProps = {
  certResolvers: string[];
  domain?: {
    id: string;
    name: string;
    certResolver: string;
    wildcard: boolean;
  };
  onSuccess?: () => void;
};

export function DomainForm({ certResolvers, domain, onSuccess }: DomainFormProps) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(domain?.name ?? "");
  const [certResolver, setCertResolver] = useState(
    domain?.certResolver ?? certResolvers[0] ?? "",
  );
  const [wildcard, setWildcard] = useState(domain?.wildcard ?? true);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const input = { name: name.trim(), certResolver, wildcard };
          const result = domain
            ? await updateDomain(domain.id, input)
            : await createDomain(input);
          if (result.ok) {
            toast.success(domain ? "Domain updated" : "Domain created");
            onSuccess?.();
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Domain name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="zethra.net"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="certResolver">Certificate resolver</Label>
        <Select value={certResolver} onValueChange={setCertResolver}>
          <SelectTrigger id="certResolver">
            <SelectValue placeholder="Select a resolver" />
          </SelectTrigger>
          <SelectContent>
            {certResolvers.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Resolvers are defined in <code>traefik.yml</code>.
        </p>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label htmlFor="wildcard">Wildcard certificate</Label>
          <p className="text-xs text-muted-foreground">
            Issue a single <code>*.{name || "example.com"}</code> certificate
            via DNS-01.
          </p>
        </div>
        <Switch id="wildcard" checked={wildcard} onCheckedChange={setWildcard} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {domain ? "Save changes" : "Create domain"}
      </Button>
    </form>
  );
}
