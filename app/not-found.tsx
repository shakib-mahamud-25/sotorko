import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <MapPinOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          We couldn&rsquo;t find that
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The page or report you&rsquo;re looking for doesn&rsquo;t exist or may
          have been removed.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to the map</Link>
      </Button>
    </div>
  );
}
