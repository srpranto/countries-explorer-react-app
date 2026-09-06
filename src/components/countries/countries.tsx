import {
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CountryType } from "../../type";
import Country from "../Country/Country";
import {
  capital,
  countryCode,
  flag,
  isCountry,
  region,
  unwrap,
} from "../../utils/countryUtils";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import NextCountriesSummary from "./NextCountriesSummary";
import CountryStatusDialog from "./CountryStatusDialog";

export interface CountriesProps {
  countriesPromise: Promise<CountryType[]>;
}

// Restore visited countries.
function readVisited(): CountryType[] {
  try {
    const saved = localStorage.getItem("visited-countries");
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) && parsed.every(isCountry) ? parsed : [];
  } catch {
    return [];
  }
}

// Restore planned countries.
function readNext(): CountryType[] {
  try {
    const saved = localStorage.getItem("next-countries");
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) && parsed.every(isCountry) ? parsed : [];
  } catch {
    return [];
  }
}

// Read browser data safely.
function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Sort saved countries by the active preference.
function sortCountryList(countries: CountryType[], sort: string) {
  return [...countries].sort((a, b) =>
    sort === "population"
      ? (unwrap(b.population, "population") ?? 0) -
        (unwrap(a.population, "population") ?? 0)
      : sort === "region"
        ? region(a).localeCompare(region(b))
        : a.name.common.localeCompare(b.name.common),
  );
}

// Apply an immediate viewport correction without smooth scrolling.
function scrollViewportTo(top: number) {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(0, top);
  root.style.scrollBehavior = previousBehavior;
}

// Manage explorer state.
export default function Countries({ countriesPromise }: CountriesProps) {
  const countries = use(countriesPromise);
  // Read shareable filters.
  const params = new URLSearchParams(window.location.search);
  const [visitedCountries, setVisitedCountries] =
    useState<CountryType[]>(readVisited);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const searchInput = useRef<HTMLInputElement>(null);
  const preservedCountryButton = useRef<{
    element: HTMLElement;
    top: number;
  } | null>(null);
  const preservedScrollY = useRef<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState(
    params.get("region") ?? "all",
  );
  const [sort, setSort] = useState(params.get("sort") ?? "name");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(Number(params.get("page") ?? "1"));
  const [selectedCountry, setSelectedCountry] = useState<CountryType | null>(
    null,
  );
  const [pendingCountry, setPendingCountry] = useState<CountryType | null>(
    null,
  );
  const [favorites, setFavorites] = useState<string[]>(() =>
    readStorage("favorite-countries", []),
  );
  const [recentCodes, setRecentCodes] = useState<string[]>(() =>
    readStorage("recent-countries", []),
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    readStorage("country-notes", {}),
  );
  const [travelDates, setTravelDates] = useState<Record<string, string>>(() =>
    readStorage("country-dates", {}),
  );
  const [savedAt, setSavedAt] = useState<Record<string, number>>({});
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [nextCountries, setNextCountries] = useState<CountryType[]>(readNext);
  const [countryFacts, setCountryFacts] = useState<Record<string, string>>({});
  const [showQuotes, setShowQuotes] = useState(false);
  const [fact, setFact] = useState("");
  const [factCountry, setFactCountry] = useState("");
  const [factLoading, setFactLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const dataUpdatedAt = sessionStorage.getItem("countries-fetched-at");
  const pageSize = 12;

  const regions = useMemo(
    () => [...new Set(countries.map(region))].sort(),
    [countries],
  );
  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return countries
      .filter((country) => {
        const matchesSearch =
          !query ||
          country.name.common.toLowerCase().includes(query) ||
          capital(country).toLowerCase().includes(query);
        return (
          matchesSearch &&
          (selectedRegion === "all" || region(country) === selectedRegion) &&
          (statusFilter === "all" ||
            (statusFilter === "visited" &&
              visitedCountries.some(
                (item) => countryCode(item) === countryCode(country),
              )) ||
            (statusFilter === "planned" &&
              nextCountries.some(
                (item) => countryCode(item) === countryCode(country),
              )) ||
            (statusFilter === "unvisited" &&
              !visitedCountries.some(
                (item) => countryCode(item) === countryCode(country),
              )) ||
            (statusFilter === "favorites" &&
              favorites.includes(countryCode(country))))
        );
      })
      .sort((a, b) =>
        sort === "population"
          ? (unwrap(b.population, "population") ?? 0) -
            (unwrap(a.population, "population") ?? 0)
          : sort === "region"
            ? region(a).localeCompare(region(b))
            : a.name.common.localeCompare(b.name.common),
      );
  }, [
    countries,
    search,
    selectedRegion,
    sort,
    statusFilter,
    visitedCountries,
    nextCountries,
    favorites,
  ]);
  const pageCount = Math.max(1, Math.ceil(filteredCountries.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleCountries = filteredCountries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return countries
      .filter(
        (country) =>
          country.name.common.toLowerCase().includes(query) ||
          capital(country).toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [countries, search]);
  const visitedRegions = new Set(visitedCountries.map(region)).size;
  const visitProgress = countries.length
    ? Math.round((visitedCountries.length / countries.length) * 100)
    : 0;
  const recentCountries = recentCodes
    .map((code) => countries.find((country) => countryCode(country) === code))
    .filter((country): country is CountryType => Boolean(country));
  const sortedVisitedCountries = useMemo(
    () => sortCountryList(visitedCountries, sort),
    [sort, visitedCountries],
  );
  const sortedNextCountries = useMemo(
    () => sortCountryList(nextCountries, sort),
    [nextCountries, sort],
  );
  useLayoutEffect(() => {
    const countryButton = preservedCountryButton.current;
    if (countryButton) {
      if (countryButton.element.isConnected) {
        scrollViewportTo(
          window.scrollY +
            countryButton.element.getBoundingClientRect().top -
            countryButton.top,
        );
      }
      preservedCountryButton.current = null;
    }
    if (preservedScrollY.current === null) return;
    scrollViewportTo(preservedScrollY.current);
    preservedScrollY.current = null;
  }, [visitedCountries.length, nextCountries.length]);

  // Persist visited countries.
  useEffect(() => {
    localStorage.setItem("visited-countries", JSON.stringify(visitedCountries));
  }, [visitedCountries]);
  // Persist planned countries.
  useEffect(() => {
    localStorage.setItem("next-countries", JSON.stringify(nextCountries));
  }, [nextCountries]);
  // Persist personal metadata.
  useEffect(() => {
    localStorage.setItem("favorite-countries", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem("recent-countries", JSON.stringify(recentCodes));
  }, [recentCodes]);
  useEffect(() => {
    localStorage.setItem("country-notes", JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem("country-dates", JSON.stringify(travelDates));
  }, [travelDates]);
  useEffect(() => {
    // Fetch summaries for saved countries.
    if (!showQuotes) return;
    const targets = [...visitedCountries, ...nextCountries].filter(
      (country, index, list) =>
        list.findIndex((item) => countryCode(item) === countryCode(country)) ===
        index,
    );
    if (!targets.length) return;
    let cancelled = false;
    Promise.all(
      targets.map(async (country) => {
        try {
          const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country.name.common)}`,
          );
          const data = (await response.json()) as { extract?: string };
          return [
            countryCode(country),
            data.extract ?? "No summary available.",
          ] as const;
        } catch {
          return [
            countryCode(country),
            "Summary unavailable right now.",
          ] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) setCountryFacts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [visitedCountries, nextCountries, showQuotes]);
  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (selectedRegion !== "all") next.set("region", selectedRegion);
    if (sort !== "name") next.set("sort", sort);
    if (currentPage > 1) next.set("page", String(currentPage));
    window.history.replaceState(
      null,
      "",
      next.toString() ? `?${next}` : window.location.pathname,
    );
    document.title = visitedCountries.length
      ? `Countries Explorer · ${visitedCountries.length} visited`
      : "Countries Explorer";
  }, [search, selectedRegion, sort, currentPage, visitedCountries.length]);
  useEffect(() => {
    const clock = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);
  // Support keyboard shortcuts.
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        searchInput.current?.focus();
      }
      if (event.key === "Escape") {
        setSearchFocused(false);
        setPendingCountry(null);
        setSelectedCountry(null);
        setClearDialogOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // Toggle a country's visited state.
  const preserveCountryButton = (button: HTMLElement) => {
    preservedCountryButton.current = {
      element: button,
      top: button.getBoundingClientRect().top,
    };
  };
  const handleVisitedCountry = (country: CountryType) => {
    const code = countryCode(country);
    const alreadyVisited = visitedCountries.some(
      (item) => countryCode(item) === code,
    );
    setVisitedCountries((current) =>
      alreadyVisited
        ? current.filter((item) => countryCode(item) !== code)
        : [...current, country],
    );
    if (!alreadyVisited)
      setNextCountries((current) =>
        current.filter((item) => countryCode(item) !== code),
      );
  };
  // Remove a visited country.
  const removeVisited = (country: CountryType) => {
    preservedScrollY.current = window.scrollY;
    setVisitedCountries((current) =>
      current.filter((item) => countryCode(item) !== countryCode(country)),
    );
  };
  // Open the clear confirmation.
  const clearVisitedCountries = () => setClearDialogOpen(true);
  // Clear visited countries after confirmation.
  const confirmClearVisitedCountries = () => {
    preservedScrollY.current = window.scrollY;
    setVisitedCountries([]);
    setClearDialogOpen(false);
  };
  // Open the print PDF flow.
  const downloadPdf = () => window.print();
  // Open details and update history.
  const openCountry = (country: CountryType) => {
    const code = countryCode(country);
    setSelectedCountry(country);
    setRecentCodes((current) =>
      [code, ...current.filter((item) => item !== code)].slice(0, 5),
    );
  };
  // Toggle a favorite.
  const toggleFavorite = (country: CountryType) =>
    setFavorites((current) =>
      current.includes(countryCode(country))
        ? current.filter((item) => item !== countryCode(country))
        : [...current, countryCode(country)],
    );
  // Select a random country.
  const chooseRandomCountry = () =>
    setSelectedCountry(
      countries[Math.floor(Math.random() * countries.length)] ?? null,
    );
  // Remove a planned country.
  const removeNextCountry = (country: CountryType) =>
    setNextCountries((current) =>
      current.filter((item) => countryCode(item) !== countryCode(country)),
    );
  // Add a planned country.
  const addPlannedCountry = (country: CountryType) => {
    if (
      nextCountries.length < 3 &&
      !nextCountries.some((item) => countryCode(item) === countryCode(country))
    )
      setPendingCountry(country);
  };
  // Save the selected country status.
  const chooseCountryStatus = (status: "visited" | "planned") => {
    if (!pendingCountry) return;
    if (status === "visited") preservedScrollY.current = window.scrollY;
    const code = countryCode(pendingCountry);
    setVisitedCountries((current) =>
      status === "visited"
        ? [
            ...current.filter((item) => countryCode(item) !== code),
            pendingCountry,
          ]
        : current.filter((item) => countryCode(item) !== code),
    );
    setNextCountries((current) =>
      status === "planned" && current.length < 3
        ? [
            ...current.filter((item) => countryCode(item) !== code),
            pendingCountry,
          ]
        : current.filter((item) => countryCode(item) !== code),
    );
    setPendingCountry(null);
  };
  // Fetch a random country fact.
  const getRandomFact = async () => {
    const country = countries[Math.floor(Math.random() * countries.length)];
    if (!country) return;
    setFactLoading(true);
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country.name.common)}`,
      );
      const data = (await response.json()) as { extract?: string };
      setFact(data.extract ?? "No fact was available for this country.");
    } catch {
      setFact("The fact service is unavailable right now. Please try again.");
    }
    setFactCountry(country.name.common);
    setFactLoading(false);
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-7xl overflow-hidden px-3 py-4 pb-10 sm:px-5 sm:py-6 sm:pb-12 lg:px-8">
      <header className="mb-7 flex flex-col gap-5">
        <div className="flex w-full min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start justify-between gap-4 sm:contents">
            <div className="min-w-0 text-left sm:order-1">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Countries Explorer
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                Explore countries and plan your next journey.
              </p>
            </div>
            <div className="text-right sm:order-2 sm:flex-1 sm:text-center">
              <time
                className="clock-display block whitespace-nowrap text-xl tabular-nums text-white sm:text-2xl"
                dateTime={currentTime.toISOString()}
              >
                {currentTime
                  .toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                  .replace(/\s/g, "")}
              </time>
              <p className="mt-1 text-sm text-neutral-400">
                {currentTime.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:order-3 sm:w-auto sm:gap-3">
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!visitedCountries.length && !nextCountries.length}
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-neutral-100 transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              Save as PDF
            </button>
            <button
              type="button"
              onClick={clearVisitedCountries}
              disabled={!visitedCountries.length}
              className="flex-1 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-300/60 hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-300/50 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-500 disabled:opacity-70 sm:flex-none"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
            <span className="block text-neutral-400">Countries</span>
            <strong className="text-lg text-white">
              {filteredCountries.length}
            </strong>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
            <span className="block text-neutral-400">Visited</span>
            <strong className="text-lg text-white">
              {visitedCountries.length}
            </strong>
          </div>
          <div className="col-span-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 sm:col-span-1">
            <span className="block text-neutral-400">Regions visited</span>
            <strong className="text-lg text-white">{visitedRegions}</strong>
          </div>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-4">
          <p className="text-sm text-neutral-300">
            Data last updated:{" "}
            {dataUpdatedAt
              ? new Date(Number(dataUpdatedAt)).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "from cache"}
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 text-center">
            <div className="relative h-14 w-14 shrink-0">
              <svg
                className="h-14 w-14 -rotate-90"
                viewBox="0 0 36 36"
                aria-hidden="true"
              >
                <path
                  className="text-neutral-800"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831"
                />
                <path
                  className="text-white transition-all duration-500"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${visitProgress}, 100`}
                  d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {visitProgress}%
              </span>
            </div>
            <p className="text-center text-sm text-neutral-300">
              A small step at a time. Keep exploring.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={chooseRandomCountry}
          className="mx-auto mt-3 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 sm:w-fit"
        >
          Discover a random country
        </button>
        <NextCountriesSummary
          allCountries={countries}
          countries={sortedNextCountries}
          onAdd={addPlannedCountry}
          onRemove={removeNextCountry}
          notes={notes}
          travelDates={travelDates}
          savedAt={savedAt}
          onNoteChange={(code, value) => {
            setNotes((current) => ({ ...current, [code]: value }));
            setSavedAt((current) => ({ ...current, [code]: Date.now() }));
          }}
          onDateChange={(code, value) => {
            setTravelDates((current) => ({ ...current, [code]: value }));
            setSavedAt((current) => ({ ...current, [code]: Date.now() }));
          }}
        />
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Country fact</p>
              <p className="mt-1 text-xs text-neutral-400">
                Get a fact from Wikipedia’s country summary.
              </p>
            </div>
            <button
              type="button"
              onClick={getRandomFact}
              disabled={factLoading}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {factLoading ? "Finding fact…" : "Random fact"}
            </button>
          </div>
          {fact && (
            <blockquote className="mt-4 border-l-2 border-neutral-500 pl-4 text-sm leading-6 text-neutral-200">
              “{fact}”
              <cite className="mt-2 block text-xs not-italic text-neutral-500">
                — {factCountry}
              </cite>
            </blockquote>
          )}
        </div>
      </header>

      {visitedCountries.length > 0 && (
        <section
          id="visited-countries-panel"
          aria-label="Your visited countries"
          className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm sm:p-5"
        >
          <div className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-neutral-300">
            Your visited countries
          </div>
          <div className="max-h-76 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-950">
            <table className="w-full min-w-0 border-collapse text-left text-xs sm:text-sm">
              <thead className="sticky top-0 bg-neutral-900">
                <tr>
                  <th className="w-16 px-3 py-3 text-neutral-300">Flag</th>
                  <th className="py-3 text-neutral-300">Country</th>
                  <th className="w-16 px-3 py-3 text-right text-neutral-300">
                    Remove
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVisitedCountries.map((country) => (
                  <tr
                    key={countryCode(country)}
                    className="h-9 border-t border-neutral-800 odd:bg-neutral-900"
                  >
                    <td className="px-3 py-1">
                      <img
                        src={flag(country).png}
                        alt={`${country.name.common} flag`}
                        className="h-5 w-9 rounded object-cover shadow-sm"
                      />
                    </td>
                    <td className="py-1 font-medium text-neutral-100">
                      {country.name.common}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeVisited(country)}
                        aria-label={`Remove ${country.name.common}`}
                        className="text-neutral-400 underline-offset-2 hover:text-white hover:underline"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 border-t border-neutral-700 pt-3">
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-[0.2em] text-neutral-300">
              Flag gallery
            </div>
            <div className="relative flex touch-pan-x gap-2 overflow-x-auto overscroll-x-contain px-1 pb-20 pt-1">
              {sortedVisitedCountries.map((country, index) => (
                <button
                  type="button"
                  aria-label={`Show details for ${country.name.common}`}
                  key={countryCode(country)}
                  className="group relative flex-none rounded-md border-0 bg-transparent p-0 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                >
                  <img
                    src={flag(country).png}
                    alt={`${country.name.common} flag`}
                    className="h-8 w-12 rounded-md object-cover shadow-sm ring-1 ring-neutral-600 transition group-hover:ring-2 group-hover:ring-neutral-200"
                  />
                  <span
                    className={`pointer-events-none absolute top-10 z-50 w-44 max-w-[calc(100vw-2rem)] rounded-lg border border-neutral-600 bg-neutral-950 px-3 py-2 text-left text-white opacity-0 shadow-xl transition duration-150 group-hover:opacity-100 group-focus:opacity-100 ${index === 0 ? "left-0" : index === visitedCountries.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                  >
                    <span className="block wrap-break-word text-sm font-semibold">
                      {country.name.common}
                    </span>
                    <span className="mt-0.5 block wrap-break-word text-xs text-neutral-400">
                      Capital: {capital(country)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {(visitedCountries.length > 0 || nextCountries.length > 0) && (
        <button
          type="button"
          onClick={() => setShowQuotes(!showQuotes)}
          className="mx-auto mb-4 block rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500"
        >
          {showQuotes ? "Hide country quotes" : "Show country quotes"}
        </button>
      )}
      {showQuotes &&
        (visitedCountries.length > 0 || nextCountries.length > 0) && (
          <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h3 className="text-lg font-bold text-white">Country quotes</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {[...visitedCountries, ...nextCountries]
                .filter(
                  (country, index, list) =>
                    list.findIndex(
                      (item) => countryCode(item) === countryCode(country),
                    ) === index,
                )
                .map((country) => (
                  <blockquote
                    key={countryCode(country)}
                    className="border-l-2 border-neutral-500 pl-4 text-sm leading-6 text-neutral-200"
                  >
                    “
                    {countryFacts[countryCode(country)] ??
                      "Finding a country summary…"}
                    ”
                    <cite className="mt-2 block text-xs not-italic text-neutral-500">
                      — {country.name.common}
                    </cite>
                  </blockquote>
                ))}
            </div>
          </section>
        )}
      <div className="relative z-40 mb-6 rounded-2xl border border-white/10 bg-white/4 p-4 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="relative z-50 grid min-w-0 gap-1">
            <div className="flex h-8 items-center justify-between gap-3">
              <label
                className="text-base font-semibold leading-none text-white"
                htmlFor="country-search"
              >
                Search countries
              </label>
              {visitedCountries.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearVisitedCountries}
                  className="h-8 shrink-0 rounded-lg border-red-400/40 bg-red-500/10 px-3 text-xs font-semibold text-red-200 shadow-sm hover:border-red-300/60 hover:bg-red-500/20 hover:text-red-100 focus-visible:ring-red-300/50"
                >
                  Clear visited
                </Button>
              )}
            </div>
            <input
              id="country-search"
              ref={searchInput}
              type="search"
              autoComplete="off"
              value={search}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                setActiveSuggestion(0);
              }}
              onKeyDown={(event) => {
                if (!searchSuggestions.length) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveSuggestion(
                    (current) => (current + 1) % searchSuggestions.length,
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveSuggestion(
                    (current) =>
                      (current - 1 + searchSuggestions.length) %
                      searchSuggestions.length,
                  );
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  const country = searchSuggestions[activeSuggestion];
                  if (country) {
                    setSearch(country.name.common);
                    setPage(1);
                    setSearchFocused(false);
                  }
                }
              }}
              placeholder="Search by country or capital"
              className="h-10 min-w-0 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none placeholder:text-neutral-500 backdrop-blur-xl transition focus:border-white/30 focus:bg-white/9 focus:ring-2 focus:ring-white/20"
            />
            {searchFocused && searchSuggestions.length > 0 && (
              <div
                role="listbox"
                aria-label="Country suggestions"
                className="absolute left-0 right-0 top-[4.35rem] z-60 overflow-hidden rounded-xl border border-white/15 bg-neutral-900/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl"
              >
                {searchSuggestions.map((country) => (
                  <Button
                    key={countryCode(country)}
                    type="button"
                    role="option"
                    aria-selected={
                      activeSuggestion === searchSuggestions.indexOf(country)
                    }
                    variant="ghost"
                    className={`h-auto w-full justify-start gap-3 rounded-lg px-3 py-2 text-left ${activeSuggestion === searchSuggestions.indexOf(country) ? "bg-white/10" : ""}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setSearch(country.name.common);
                      setPage(1);
                      setSearchFocused(false);
                    }}
                  >
                    <span className="truncate text-white">
                      {country.name.common}
                    </span>
                    <span className="ml-auto truncate text-xs text-neutral-500">
                      {capital(country)}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="grid min-w-0 gap-1">
            <label
              className="flex h-8 items-center text-sm font-semibold text-neutral-200"
              htmlFor="region-filter"
            >
              Region
            </label>
            <Select
              value={selectedRegion}
              onValueChange={(value) => {
                setSelectedRegion(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="region-filter">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {regions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-0 gap-1">
            <label
              className="flex h-8 items-center text-sm font-semibold text-neutral-200"
              htmlFor="country-sort"
            >
              Sort by
            </label>
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="country-sort">
                <SelectValue placeholder="Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="population">Population</SelectItem>
                <SelectItem value="region">Region</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-0 gap-1">
            <label
              className="flex h-8 items-center text-sm font-semibold text-neutral-200"
              htmlFor="country-status-filter"
            >
              Show
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger id="country-status-filter">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                <SelectItem value="visited">Visited</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="unvisited">Unvisited</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {recentCountries.length > 0 && (
        <section
          aria-labelledby="recent-countries-title"
          className="mb-5 rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl"
        >
          <h3
            id="recent-countries-title"
            className="text-sm font-semibold text-white"
          >
            Recently viewed
          </h3>
          <div className="mt-3 flex touch-pan-x gap-2 overflow-x-auto overscroll-x-contain">
            {recentCountries.map((country) => (
              <Button
                key={countryCode(country)}
                type="button"
                variant="ghost"
                onClick={() => openCountry(country)}
                className="shrink-0 rounded-lg border border-white/10 px-3 text-neutral-300"
              >
                {country.name.common}
              </Button>
            ))}
          </div>
        </section>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {visibleCountries.map((country) => (
          <Country
            key={countryCode(country)}
            country={country}
            visited={visitedCountries.some(
              (item) => countryCode(item) === countryCode(country),
            )}
            handleVisitedCountry={handleVisitedCountry}
            onVisitStart={preserveCountryButton}
            onSelect={openCountry}
            favorite={favorites.includes(countryCode(country))}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
      {!visibleCountries.length && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-12 text-center text-neutral-300">
          No countries match your search.
        </div>
      )}
      <nav
        aria-label="Country pages"
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="page-jump">
            Jump to page
          </label>
          <Select
            value={String(currentPage)}
            onValueChange={(value) => setPage(Number(value))}
          >
            <SelectTrigger id="page-jump" className="h-10 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: pageCount }, (_, index) => (
                <SelectItem key={index + 1} value={String(index + 1)}>
                  Page {index + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-neutral-300">of {pageCount}</span>
        </div>
        <button
          type="button"
          disabled={currentPage === pageCount}
          onClick={() => setPage(currentPage + 1)}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </nav>
      {clearDialogOpen && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="clear-visited-title"
          aria-describedby="clear-visited-description"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-neutral-900 p-5 text-white shadow-2xl shadow-black/50 sm:p-6">
            <h2 id="clear-visited-title" className="text-lg font-semibold">
              Clear visited countries?
            </h2>
            <p
              id="clear-visited-description"
              className="mt-2 text-sm leading-6 text-neutral-400"
            >
              This removes every country from your visited list.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setClearDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={confirmClearVisitedCountries}
                className="border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-red-100"
              >
                Clear visited
              </Button>
            </div>
          </div>
        </div>
      )}
      {selectedCountry && (
        <CountryDetails
          country={selectedCountry}
          onClose={() => setSelectedCountry(null)}
        />
      )}
      {pendingCountry && (
        <CountryStatusDialog
          country={pendingCountry}
          onChooseVisited={() => chooseCountryStatus("visited")}
          onChoosePlanned={() => chooseCountryStatus("planned")}
          onClose={() => setPendingCountry(null)}
        />
      )}
      <div className="pdf-report">
        <h1>Countries Explorer</h1>
        <p>Generated {new Date().toLocaleDateString()}</p>
        <p className="pdf-progress-label">Your exploration progress</p>
        <div className="pdf-summary">
          <span>
            <strong>{visitedCountries.length}</strong> / {countries.length}{" "}
            visited
          </span>
          <span>
            <strong>{nextCountries.length}</strong> planned
          </span>
          <span>
            <strong>{countries.length - visitedCountries.length}</strong>{" "}
            remaining
          </span>
        </div>
        <div
          className="pdf-progress-track"
          role="progressbar"
          aria-label="Country exploration progress"
          aria-valuemin={0}
          aria-valuemax={countries.length}
          aria-valuenow={visitedCountries.length}
        >
          <span style={{ width: `${visitProgress}%` }} />
        </div>
        <PdfSection title="Visited countries" countries={visitedCountries} />
        <PdfSection title="Planned countries" countries={nextCountries} />
      </div>
    </div>
  );
}

// Render a PDF country section.
function PdfSection({
  title,
  countries,
}: {
  title: string;
  countries: CountryType[];
}) {
  return (
    <section className="pdf-section">
      <h2>{title}</h2>
      {countries.length ? (
        <div className="pdf-grid">
          {countries.map((country) => (
            <article key={countryCode(country)}>
              <img
                src={flag(country).png}
                alt={`${country.name.common} flag`}
              />
              <h3>{country.name.common}</h3>
              <p>Capital: {capital(country)}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="pdf-empty">No countries added yet.</p>
      )}
    </section>
  );
}

// Render country details.
function CountryDetails({
  country,
  onClose,
}: {
  country: CountryType;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const languages = unwrap<Record<string, string>>(
    country.languages,
    "languages",
  );
  const currencies = unwrap<Record<string, { name: string; symbol?: string }>>(
    country.currencies,
    "currencies",
  );
  const borders = unwrap(country.borders, "borders") ?? [];
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${country.name.common} details`}
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-700 bg-neutral-900 p-5 text-white shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{country.name.common}</h2>
            <p className="mt-1 text-sm text-neutral-400">
              {country.name.official}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg px-3 py-1 text-2xl leading-none text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            ×
          </button>
        </div>
        <div
          className="mt-6 flex touch-pan-x gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-white/10 bg-white/4 p-1"
          role="tablist"
          aria-label="Country details"
        >
          {[
            "overview",
            "geography",
            "languages",
            "currencies",
            "borders",
            "time zones",
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${activeTab === tab ? "bg-white text-neutral-950" : "text-neutral-400 hover:bg-white/10 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {activeTab === "overview" && (
            <>
              <Detail label="Capital" value={capital(country)} />
              <Detail
                label="Population"
                value={(
                  unwrap(country.population, "population") ?? 0
                ).toLocaleString()}
              />
              <Detail label="Official name" value={country.name.official} />
            </>
          )}
          {activeTab === "geography" && (
            <>
              <Detail label="Region" value={region(country)} />
              <Detail
                label="Subregion"
                value={unwrap(country.subregion, "subregion") ?? "Not listed"}
              />
              <Detail
                label="Area"
                value={`${(unwrap(country.area, "area") ?? 0).toLocaleString()} km²`}
              />
            </>
          )}
          {activeTab === "languages" && (
            <Detail
              label="Languages"
              value={
                languages ? Object.values(languages).join(", ") : "Not listed"
              }
            />
          )}
          {activeTab === "currencies" && (
            <Detail
              label="Currencies"
              value={
                currencies
                  ? Object.values(currencies)
                      .map((item) => item.name)
                      .join(", ")
                  : "Not listed"
              }
            />
          )}
          {activeTab === "borders" && (
            <Detail label="Borders" value={borders.join(", ") || "None"} />
          )}
          {activeTab === "time zones" && (
            <Detail
              label="Time zones"
              value={
                (unwrap(country.timezones, "timezones") ?? []).join(", ") ||
                "Not listed"
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Render one detail field.
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
      <span className="block text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <span className="mt-1 block wrap-break-word text-neutral-100">
        {value}
      </span>
    </div>
  );
}
