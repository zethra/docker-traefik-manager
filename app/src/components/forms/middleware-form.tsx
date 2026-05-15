"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { middlewareTypes, type MiddlewareType } from "@/lib/zod-schemas";
import {
  createMiddleware,
  updateMiddleware,
} from "@/server/actions/middlewares";

const TYPE_LABELS: Record<MiddlewareType, string> = {
  IP_WHITELIST: "IP allow list",
  BASIC_AUTH: "Basic auth",
  RATE_LIMIT: "Rate limit",
  HEADERS: "Custom headers",
  STRIP_PREFIX: "Strip prefix",
  REDIRECT_REGEX: "Redirect (regex)",
  COMPRESS: "Compress",
};

type Props = {
  middleware?: {
    id: string;
    name: string;
    type: MiddlewareType;
    config: unknown;
  };
  onSuccess?: () => void;
};

export function MiddlewareForm({ middleware, onSuccess }: Props) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(middleware?.name ?? "");
  const [type, setType] = useState<MiddlewareType>(
    middleware?.type ?? "IP_WHITELIST",
  );
  const [config, setConfig] = useState<Record<string, unknown>>(() =>
    middleware?.config && typeof middleware.config === "object"
      ? (middleware.config as Record<string, unknown>)
      : defaultConfigFor(middleware?.type ?? "IP_WHITELIST"),
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const input = { name: name.trim(), type, config };
          const result = middleware
            ? await updateMiddleware(middleware.id, input)
            : await createMiddleware(input);
          if (result.ok) {
            toast.success(middleware ? "Middleware updated" : "Middleware created");
            onSuccess?.();
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="mw-name">Name</Label>
        <Input
          id="mw-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="lan-only"
          required
          disabled={!!middleware}
        />
        <p className="text-xs text-muted-foreground">
          Used as the Traefik middleware identifier; cannot be changed later.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mw-type">Type</Label>
        <Select
          value={type}
          onValueChange={(v) => {
            const t = v as MiddlewareType;
            setType(t);
            setConfig(defaultConfigFor(t));
          }}
          disabled={!!middleware}
        >
          <SelectTrigger id="mw-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {middlewareTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TypeFields type={type} config={config} setConfig={setConfig} />

      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {middleware ? "Save changes" : "Create middleware"}
      </Button>
    </form>
  );
}

function defaultConfigFor(type: MiddlewareType): Record<string, unknown> {
  switch (type) {
    case "IP_WHITELIST":
      return { sourceRange: [] };
    case "BASIC_AUTH":
      return { users: [] };
    case "RATE_LIMIT":
      return { average: 100, period: "1s" };
    case "HEADERS":
      return { customRequestHeaders: {}, customResponseHeaders: {} };
    case "STRIP_PREFIX":
      return { prefixes: [] };
    case "REDIRECT_REGEX":
      return { regex: "", replacement: "", permanent: true };
    case "COMPRESS":
      return {};
  }
}

function TypeFields({
  type,
  config,
  setConfig,
}: {
  type: MiddlewareType;
  config: Record<string, unknown>;
  setConfig: (c: Record<string, unknown>) => void;
}) {
  switch (type) {
    case "IP_WHITELIST":
      return (
        <StringListField
          label="Allowed source IPs / CIDRs"
          placeholder="10.0.0.0/8"
          values={(config.sourceRange as string[]) ?? []}
          onChange={(v) => setConfig({ ...config, sourceRange: v })}
        />
      );
    case "BASIC_AUTH":
      return (
        <StringListField
          label="Users (htpasswd format)"
          placeholder="user:$apr1$..."
          values={(config.users as string[]) ?? []}
          onChange={(v) => setConfig({ ...config, users: v })}
        />
      );
    case "RATE_LIMIT":
      return (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Average</Label>
            <Input
              type="number"
              min={1}
              value={(config.average as number) ?? ""}
              onChange={(e) =>
                setConfig({ ...config, average: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Period</Label>
            <Input
              value={(config.period as string) ?? ""}
              onChange={(e) => setConfig({ ...config, period: e.target.value })}
              placeholder="1s"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Burst</Label>
            <Input
              type="number"
              min={1}
              value={(config.burst as number) ?? ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  burst: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      );
    case "HEADERS":
      return (
        <div className="space-y-4">
          <KeyValueField
            label="Custom request headers"
            value={(config.customRequestHeaders as Record<string, string>) ?? {}}
            onChange={(v) =>
              setConfig({ ...config, customRequestHeaders: v })
            }
          />
          <KeyValueField
            label="Custom response headers"
            value={
              (config.customResponseHeaders as Record<string, string>) ?? {}
            }
            onChange={(v) =>
              setConfig({ ...config, customResponseHeaders: v })
            }
          />
        </div>
      );
    case "STRIP_PREFIX":
      return (
        <StringListField
          label="Prefixes to strip"
          placeholder="/api"
          values={(config.prefixes as string[]) ?? []}
          onChange={(v) => setConfig({ ...config, prefixes: v })}
        />
      );
    case "REDIRECT_REGEX":
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Regex</Label>
            <Input
              value={(config.regex as string) ?? ""}
              onChange={(e) => setConfig({ ...config, regex: e.target.value })}
              placeholder="^http://(.*)"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Replacement</Label>
            <Input
              value={(config.replacement as string) ?? ""}
              onChange={(e) =>
                setConfig({ ...config, replacement: e.target.value })
              }
              placeholder="https://$1"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label>Permanent (301)</Label>
            <Switch
              checked={(config.permanent as boolean) ?? true}
              onCheckedChange={(v) => setConfig({ ...config, permanent: v })}
            />
          </div>
        </div>
      );
    case "COMPRESS":
      return (
        <p className="text-sm text-muted-foreground">
          No options. Enables Traefik's default compression.
        </p>
      );
  }
}

function StringListField({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea
        placeholder={`${placeholder}\n${placeholder}`}
        value={values.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        rows={4}
      />
      <p className="text-xs text-muted-foreground">One value per line.</p>
    </div>
  );
}

function KeyValueField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const entries = Object.entries(value);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="space-y-2">
        {entries.map(([k, v], i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={k}
              placeholder="Header"
              onChange={(e) => {
                const next: Record<string, string> = {};
                entries.forEach(([kk, vv], j) => {
                  next[j === i ? e.target.value : kk] = vv;
                });
                onChange(next);
              }}
            />
            <Input
              value={v}
              placeholder="Value"
              onChange={(e) => {
                const next = { ...value, [k]: e.target.value };
                onChange(next);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const next = { ...value };
                delete next[k];
                onChange(next);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...value, "": "" })}
        >
          Add header
        </Button>
      </div>
    </div>
  );
}
