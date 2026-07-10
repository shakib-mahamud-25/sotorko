"use client";

import * as React from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EditCodeReveal({ editCode, reportId }: { editCode: string; reportId: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(editCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail silently (permissions, non-secure
      // context) — the code is still visible on screen to copy by
      // hand, so this isn't a blocking failure.
    }
  }

  return (
    <Card className="border-accent/30">
      <CardHeader>
        <div className="flex items-center gap-2 text-accent">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">Save this code now</span>
        </div>
        <CardTitle className="text-xl">Your report has been submitted</CardTitle>
        <CardDescription>
          This code is shown only once. You&rsquo;ll need it to edit or delete
          this report later — we don&rsquo;t keep any other way to prove it&rsquo;s
          yours, since no account was created.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-card border border-dashed border-accent/40 bg-accent/5 px-5 py-4">
          <span className="font-mono text-xl font-semibold tracking-wider text-foreground sm:text-2xl">
            {editCode}
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Write it down, save it in a password manager, or take a screenshot
          somewhere private. Sotorko cannot recover this code for you if you
          lose it.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/">Back to the map</Link>
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link href={`/incident/${reportId}`}>View this report</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
