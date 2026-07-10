"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/components/admin/admin-auth-context";

export function AdminLoginGate({ children }: { children: React.ReactNode }) {
  const { secret, isVerifying, verify } = useAdminAuth();
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  if (secret) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = await verify(input);
    if (!ok) setError("That code wasn't recognized.");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Moderator Access</span>
          </div>
          <CardTitle className="text-xl">Sign in to moderate</CardTitle>
          <CardDescription>
            This is an interim access code, not a full account system —
            see PROJECT_CONTEXT.md for what a real moderator login
            needs before launch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-secret">Access code</Label>
              <Input
                id="admin-secret"
                type="password"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" disabled={isVerifying || !input}>
              {isVerifying ? "Checking…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
