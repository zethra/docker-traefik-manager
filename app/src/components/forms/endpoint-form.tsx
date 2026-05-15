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
import { createEndpoint, updateEndpoint } from "@/server/actions/endpoints";

type EndpointFormProps = {
  hostId: string;
  endpoint?: {
    id: string;
    address: string;
    port: number;
    scheme: "HTTP" | "HTTPS";
    isPrimary: boolean;
    healthCheckPath: string;
  };
  onSuccess?: () => void;
};

export function EndpointForm({ hostId, endpoint, onSuccess }: EndpointFormProps) {
  const [pending, startTransition] = useTransition();
  const [address, setAddress] = useState(endpoint?.address ?? "");
  const [port, setPort] = useState<number | "">(endpoint?.port ?? "");
  const [scheme, setScheme] = useState<"HTTP" | "HTTPS">(
    endpoint?.scheme ?? "HTTP",
  );
  const [isPrimary, setIsPrimary] = useState(endpoint?.isPrimary ?? false);
  const [healthCheckPath, setHealthCheckPath] = useState(
    endpoint?.healthCheckPath ?? "/",
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (typeof port !== "number") {
          toast.error("Port is required");
          return;
        }
        startTransition(async () => {
          const input = {
            hostId,
            address: address.trim(),
            port,
            scheme,
            isPrimary,
            healthCheckPath: healthCheckPath.trim() || "/",
          };
          const result = endpoint
            ? await updateEndpoint(endpoint.id, input)
            : await createEndpoint(input);
          if (result.ok) {
            toast.success(endpoint ? "Endpoint updated" : "Endpoint added");
            onSuccess?.();
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="192.168.1.10"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(e) =>
              setPort(e.target.value === "" ? "" : Number(e.target.value))
            }
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="scheme">Upstream scheme</Label>
        <Select
          value={scheme}
          onValueChange={(v) => setScheme(v as "HTTP" | "HTTPS")}
        >
          <SelectTrigger id="scheme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HTTP">HTTP</SelectItem>
            <SelectItem value="HTTPS">HTTPS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hcPath">Health check path</Label>
        <Input
          id="hcPath"
          value={healthCheckPath}
          onChange={(e) => setHealthCheckPath(e.target.value)}
          placeholder="/"
        />
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label htmlFor="primary">Primary endpoint</Label>
          <p className="text-xs text-muted-foreground">
            Other endpoints will become passive failovers.
          </p>
        </div>
        <Switch
          id="primary"
          checked={isPrimary}
          onCheckedChange={setIsPrimary}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {endpoint ? "Save changes" : "Add endpoint"}
      </Button>
    </form>
  );
}
