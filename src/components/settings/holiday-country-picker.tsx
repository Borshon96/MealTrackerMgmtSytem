"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { serializeHolidayCountryCodes } from "@/lib/holiday-codes";

type Country = { countryCode: string; name: string };

export function HolidayCountryPicker({
  initialCodes,
}: {
  initialCodes: string[];
}) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selected, setSelected] = useState<string[]>(initialCodes);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(initialCodes);
  }, [initialCodes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/holidays/countries");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load calendars");
        if (!cancelled) setCountries(data.countries ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load calendars");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.countryCode.toLowerCase().includes(q)
    );
  }, [countries, query]);

  function toggle(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code].sort()
    );
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Public holiday calendars</Label>
      <p className="text-xs text-muted-foreground">
        Bangladesh uses{" "}
        <a
          href="https://www.bangladatetoday.com/holidays-bangladesh"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          BanglaDateToday
        </a>{" "}
        (government gazette). Other countries use{" "}
        <a
          href="https://date.nager.at"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Nager.Date
        </a>
        .
      </p>
      <input
        type="hidden"
        name="holidayCountryCodes"
        value={serializeHolidayCountryCodes(selected)}
      />
      {selected.length > 0 ? (
        <p className="text-xs font-medium">
          Selected: {selected.join(", ")}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">No calendars selected — holidays hidden.</p>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search country or code…"
          className="h-9 pl-9"
          disabled={loading}
        />
      </div>
      {error ? <p className="text-xs text-due">{error}</p> : null}
      <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-white">
        {loading ? (
          <p className="p-3 text-sm text-muted-foreground">Loading calendars…</p>
        ) : (
          filtered.map((c) => {
            const checked = selected.includes(c.countryCode);
            return (
              <label
                key={c.countryCode}
                className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-secondary/60"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.countryCode)}
                />
                <span className="font-mono text-xs text-muted-foreground">{c.countryCode}</span>
                <span className="font-medium">{c.name}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
