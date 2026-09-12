import { Component, Suspense, useState, type ReactNode } from "react";
import type { CountryType } from "./type";
import Countries from "./components/countries/countries";
import { isCountry } from "./utils/countryUtils";

// Validate the API response.
function parseCountries(value: unknown): CountryType[] {
  if (!value || typeof value !== "object")
    throw new Error("Invalid countries response");
  const countries = (value as { countries?: unknown }).countries;
  if (!Array.isArray(countries) || !countries.every(isCountry))
    throw new Error("Invalid countries response");
  return countries;
}

// Load and cache country data.
const countriesPromise = async (): Promise<CountryType[]> => {
  // Reuse valid cached data.
  const cached = sessionStorage.getItem("countries-cache");
  if (cached) {
    try {
      const parsed: unknown = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.every(isCountry)) return parsed;
      sessionStorage.removeItem("countries-cache");
    } catch {
      sessionStorage.removeItem("countries-cache");
    }
  }
  const response = await fetch("https://openapi.programming-hero.com/api/all");
  if (!response.ok) throw new Error("Unable to load countries");
  const countries = parseCountries(await response.json());
  sessionStorage.setItem("countries-fetched-at", String(Date.now()));
  sessionStorage.setItem("countries-cache", JSON.stringify(countries));
  return countries;
};

interface ErrorBoundaryProps {
  children: ReactNode;
  onRetry: () => void;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Reset the boundary on retry.
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? (
      <ErrorState onRetry={this.props.onRetry} />
    ) : (
      this.props.children
    );
  }
}

// Provide loading and error states.
function App() {
  const [attempt, setAttempt] = useState(0);
  return (
    <ErrorBoundary
      key={attempt}
      onRetry={() => setAttempt((current) => current + 1)}
    >
      <Suspense fallback={<SkeletonLoading />}>
        <Countries countriesPromise={countriesPromise()} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Render the explorer skeleton loading state.
function SkeletonLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading countries explorer"
      className="mx-auto min-h-dvh w-full max-w-7xl overflow-hidden px-3 py-4 pb-10 sm:px-5 sm:py-6 sm:pb-12 lg:px-8"
    >
      <span className="sr-only">Loading countries explorer…</span>
      <header className="mb-7 flex flex-col gap-5">
        <div className="flex w-full min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start justify-between gap-4 sm:contents">
            <div className="min-w-0 text-left sm:order-1">
              <div className="h-8 w-56 animate-pulse rounded-lg bg-neutral-800" />
              <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-neutral-800/60" />
            </div>
            <div className="text-right sm:order-2 sm:flex-1 sm:text-center">
              <div className="ml-auto h-7 w-28 animate-pulse rounded bg-neutral-800 sm:mx-auto" />
              <div className="ml-auto mt-2 h-4 w-36 animate-pulse rounded bg-neutral-800/60 sm:mx-auto" />
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:order-3 sm:w-auto sm:gap-3">
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-neutral-800 sm:w-28 sm:flex-none" />
            <div className="h-10 flex-1 animate-pulse rounded-lg bg-neutral-800 sm:w-20 sm:flex-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 ${
                index === 2 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-800" />
              <div className="mt-2 h-6 w-12 animate-pulse rounded bg-neutral-800" />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-4">
          <div className="h-4 w-44 animate-pulse rounded bg-neutral-800" />
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="h-14 w-14 animate-pulse rounded-full border-2 border-neutral-800" />
            <div className="h-4 w-52 animate-pulse rounded bg-neutral-800/60" />
          </div>
        </div>
      </header>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/4 p-4 shadow-lg backdrop-blur-xl sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="h-10 animate-pulse rounded-xl bg-neutral-800" />
          <div className="h-10 animate-pulse rounded-xl bg-neutral-800" />
          <div className="h-10 animate-pulse rounded-xl bg-neutral-800" />
          <div className="h-10 animate-pulse rounded-xl bg-neutral-800" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-sm"
          >
            <div className="aspect-video w-full animate-pulse bg-neutral-800" />
            <div className="flex flex-1 flex-col items-center gap-2 p-4 text-center">
              <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800/60" />
              <div className="mt-2 flex w-full flex-col items-center gap-1.5">
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-neutral-800/50" />
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-neutral-800/50" />
                <div className="h-3.5 w-1/3 animate-pulse rounded bg-neutral-800/50" />
              </div>
            </div>
            <div className="p-4 pt-0">
              <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Show a retryable error state.
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 text-center text-neutral-100">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Couldn’t load countries
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

export default App;
