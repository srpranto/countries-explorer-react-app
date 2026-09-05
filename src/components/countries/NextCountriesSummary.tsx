import { useMemo, useState } from "react";
import type { CountryType } from "../../type";
import { capital, countryCode, flag, region } from "../../utils/countryUtils";
import { Button } from "../ui/button";
import MonthPicker from "../ui/month-picker";

interface NextCountriesSummaryProps {
  allCountries: CountryType[];
  countries: CountryType[];
  onAdd: (country: CountryType) => void;
  onRemove: (country: CountryType) => void;
  notes: Record<string, string>;
  travelDates: Record<string, string>;
  savedAt: Record<string, number>;
  onNoteChange: (code: string, value: string) => void;
  onDateChange: (code: string, value: string) => void;
}

// Render planned destinations and search.
export default function NextCountriesSummary({
  allCountries,
  countries,
  onAdd,
  onRemove,
  notes,
  travelDates,
  savedAt,
  onNoteChange,
  onDateChange,
}: NextCountriesSummaryProps) {
  const [search, setSearch] = useState("");
  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return allCountries
      .filter(
        (country) =>
          !countries.some(
            (item) => countryCode(item) === countryCode(country),
          ) &&
          (country.name.common.toLowerCase().includes(query) ||
            capital(country).toLowerCase().includes(query)),
      )
      .slice(0, 8);
  }, [allCountries, countries, search]);

  return (
    <section
      aria-labelledby="next-destinations-title"
      className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-5"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <div>
          <h3
            id="next-destinations-title"
            className="text-base font-semibold text-white"
          >
            Your next destinations
          </h3>
          <p className="mt-1 text-sm text-neutral-400">
            Search for a country and add it to your private travel plan.
          </p>
        </div>
        <span className="text-xs font-medium text-neutral-500">
          {countries.length}/3 selected
        </span>
      </div>
      <div className="relative mt-4 flex min-w-0 flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="next-country-search">
          Search planned countries
        </label>
        <input
          id="next-country-search"
          type="search"
          autoComplete="off"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by country or capital"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-neutral-500 backdrop-blur-xl focus:border-white/30 focus:ring-2 focus:ring-white/20"
        />
        {suggestions.length > 0 && (
          <div
            role="listbox"
            aria-label="Planned country suggestions"
            className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-white/15 bg-neutral-900/95 p-1.5 shadow-2xl backdrop-blur-2xl"
          >
            {suggestions.map((country) => (
              <Button
                key={countryCode(country)}
                type="button"
                role="option"
                variant="ghost"
                onClick={() => {
                  onAdd(country);
                  setSearch("");
                }}
                className="h-auto w-full justify-start rounded-lg px-3 py-2 text-left text-white"
              >
                {country.name.common}
                <span className="ml-auto text-xs text-neutral-500">
                  {capital(country)}
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
      {countries.length > 0 ? (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {countries.map((country) => {
            const images = flag(country);
            return (
              <article
                key={countryCode(country)}
                className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
              >
                <img
                  src={images.svg}
                  alt={`${country.name.common} flag`}
                  className="h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                  onError={(event) => {
                    if (images.png && event.currentTarget.src !== images.png)
                      event.currentTarget.src = images.png;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {country.name.common}
                  </p>
                  <p className="truncate text-xs text-neutral-400">
                    Planned · {capital(country)} · {region(country)}
                  </p>
                  <MonthPicker
                    label="Travel date"
                    value={travelDates[countryCode(country)] ?? ""}
                    onChange={(value) =>
                      onDateChange(countryCode(country), value)
                    }
                  />
                  <textarea
                    aria-label={`Travel notes for ${country.name.common}`}
                    value={notes[countryCode(country)] ?? ""}
                    onChange={(event) =>
                      onNoteChange(countryCode(country), event.target.value)
                    }
                    placeholder="Add a note..."
                    rows={2}
                    className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-white/6 px-2 py-1 text-xs text-neutral-300 outline-none placeholder:text-neutral-600 focus:border-white/30"
                  />
                  {savedAt[countryCode(country)] && (
                    <p className="mt-1 text-[10px] text-neutral-500">
                      Last saved at{" "}
                      {new Date(
                        savedAt[countryCode(country)],
                      ).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(country)}
                  aria-label={`Remove ${country.name.common} from planned destinations`}
                  className="shrink-0 text-neutral-400 hover:text-white"
                >
                  ×
                </Button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-neutral-500">
          Your planned countries will appear here after you select a suggestion.
        </p>
      )}
    </section>
  );
}
