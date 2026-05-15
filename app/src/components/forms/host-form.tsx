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
import { createHost, updateHost } from "@/server/actions/hosts";

type HostFormProps = {
  domains: { id: string; name: string }[];
  host?: {
    id: string;
    subdomain: string;
    domainId: string;
    enabled: boolean;
  };
  onSuccess?: () => void;
};

export function HostForm({ domains, host, onSuccess }: HostFormProps) {
  const [pending, startTransition] = useTransition();
  const [subdomain, setSubdomain] = useState(host?.subdomain ?? "");
  const [domainId, setDomainId] = useState(host?.domainId ?? domains[0]?.id ?? "");
  const [enabled, setEnabled] = useState(host?.enabled ?? true);

  const previewDomain = domains.find((d) => d.id === domainId)?.name ?? "";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const input = { subdomain: subdomain.trim(), domainId, enabled };
          const result = host
            ? await updateHost(host.id, input)
            : await createHost(input);
          if (result.ok) {
            toast.success(host ? "Host updated" : "Host created");
            onSuccess?.();
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="subdomain">Subdomain</Label>
        <Input
          id="subdomain"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          placeholder="plex"
          required
        />
        <p className="text-xs text-muted-foreground">
          Use <code>@</code> for the apex.{" "}
          {previewDomain && subdomain && (
            <>
              FQDN will be{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                {subdomain === "@" ? previewDomain : `${subdomain}.${previewDomain}`}
              </code>
            </>
          )}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="domain">Domain</Label>
        <Select value={domainId} onValueChange={setDomainId}>
          <SelectTrigger id="domain">
            <SelectValue placeholder="Select a domain" />
          </SelectTrigger>
          <SelectContent>
            {domains.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label htmlFor="enabled">Enabled</Label>
          <p className="text-xs text-muted-foreground">
            Disabled hosts are excluded from Traefik configuration.
          </p>
        </div>
        <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {host ? "Save changes" : "Create host"}
      </Button>
    </form>
  );
}
