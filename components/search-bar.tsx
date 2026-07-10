"use client";

import * as React from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { geocodeDhaka, type GeocodeResult } from "@/lib/map/geocode";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSelectLocation: (result: GeocodeResult) => void;
}

export function SearchBar({ onSelectLocation }: SearchBarProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GeocodeResult[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const found = await geocodeDhaka(value);
        setResults(found);
        setIsOpen(true);
      } catch {
        setError("Search failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 450); // respects Nominatim's 1 req/sec fair-use limit
  }

  function handleSelect(result: GeocodeResult) {
    setQuery(result.displayName.split(",")[0]);
    setResults([]);
    setIsOpen(false);
    onSelectLocation(result);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) handleSelect(results[0]);
        }}
        className="flex w-full items-center gap-2 rounded-card border border-border bg-card p-2 shadow-sm"
      >
        {isLoading ? (
          <Loader2
            className="ml-2 h-4.5 w-4.5 shrink-0 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          <Search className="ml-2 h-4.5 w-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <Input
          name="q"
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search an area, road, or landmark in Dhaka…"
          aria-label="Search a location in Dhaka"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
          className="h-9 border-0 shadow-none focus-visible:ring-0"
        />
      </form>

      {error && (
        <p className="mt-1.5 px-1 text-xs text-destructive">{error}</p>
      )}

      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-card border border-border bg-card shadow-lg"
        >
          {results.map((result, i) => (
            <li key={`${result.lat}-${result.lng}-${i}`}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(result)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none",
                  i !== results.length - 1 && "border-b border-border"
                )}
              >
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-foreground">{result.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
