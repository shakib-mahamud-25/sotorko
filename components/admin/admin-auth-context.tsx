"use client";

import * as React from "react";

interface AdminAuthContextValue {
  secret: string | null;
  setSecret: (secret: string | null) => void;
  isVerifying: boolean;
  verify: (candidate: string) => Promise<boolean>;
}

const AdminAuthContext = React.createContext<AdminAuthContextValue | null>(null);

/**
 * Holds the admin bearer secret in memory ONLY — not localStorage,
 * not cookies. This is a deliberate consequence of lib/admin-auth.ts
 * being an interim shared-secret gate rather than real Supabase Auth:
 * a bearer secret is more sensitive than a session token (it's not
 * scoped to a user, doesn't expire, and there's no server-side way to
 * revoke a single moderator's access without rotating it for
 * everyone), so it shouldn't persist anywhere durable. This means
 * moderators re-enter it every session/refresh — an accepted
 * trade-off until real auth exists.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [secret, setSecret] = React.useState<string | null>(null);
  const [isVerifying, setIsVerifying] = React.useState(false);

  const verify = React.useCallback(async (candidate: string): Promise<boolean> => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${candidate}` },
      });
      if (res.ok) {
        setSecret(candidate);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ secret, setSecret, isVerifying, verify }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = React.useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
