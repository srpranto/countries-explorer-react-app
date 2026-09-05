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
      <Suspense fallback={<Loading />}>
        <Countries countriesPromise={countriesPromise()} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Show the loading state.
function Loading() {
  return (
    <main
      className="flex min-h-dvh items-center justify-center px-5 py-10 text-neutral-100"
      aria-live="polite"
      aria-label="Loading countries"
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-neutral-700 border-t-neutral-100 motion-safe:animate-spin" />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Loading countries
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Preparing your explorer…
        </p>
        <div className="mt-6 space-y-2" aria-hidden="true">
          <div className="h-2 animate-pulse rounded-full bg-neutral-800" />
          <div className="mx-auto h-2 w-2/3 animate-pulse rounded-full bg-neutral-800" />
        </div>
      </div>
    </main>
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
