import Link from "next/link";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-button bg-primary text-primary-foreground">
            <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="text-base">
            Sotorko <span className="font-normal text-muted-foreground">সতর্ক</span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Map
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
        </nav>

        <Button asChild variant="danger" size="sm">
          <Link href="/report">
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            Report Incident
          </Link>
        </Button>
      </div>
    </header>
  );
}
