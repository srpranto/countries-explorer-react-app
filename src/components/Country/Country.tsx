import type { CountryType } from "../../type";
import { capital, flag, region, unwrap } from "../../utils/countryUtils";
import { Button } from "../ui/button";

export interface CountryProps {
  country: CountryType;
  visited: boolean;
  handleVisitedCountry: (country: CountryType) => void;
  onSelect: (country: CountryType) => void;
  favorite: boolean;
  onToggleFavorite: (country: CountryType) => void;
}

// Render one country card.
export default function Country({
  country,
  visited,
  handleVisitedCountry,
  onSelect,
  favorite,
  onToggleFavorite,
}: CountryProps) {
  const images = flag(country);
  const population = unwrap(country.population, "population");
  return (
    <article
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow duration-200 hover:shadow-xl ${visited ? "border-neutral-950 ring-2 ring-neutral-400 dark:border-neutral-100 dark:ring-neutral-700" : "border-neutral-200 dark:border-neutral-800"} dark:bg-neutral-900`}
    >
      <div className="relative">
        <img
          src={images.svg}
          alt={`${country.name.common} flag`}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            if (images.png && event.currentTarget.src !== images.png)
              event.currentTarget.src = images.png;
          }}
          className="aspect-video w-full object-cover"
        />
        <button
          type="button"
          onClick={() => onToggleFavorite(country)}
          aria-label={`${favorite ? "Remove" : "Add"} ${country.name.common} favorite`}
          className="absolute right-3 top-3 rounded-full border border-black/10 bg-white/90 px-2.5 py-1 text-sm text-neutral-900 shadow-sm backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:bg-neutral-900/90 dark:text-white"
        >
          {favorite ? "★" : "☆"}
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 p-4 text-center sm:p-5">
        <button
          type="button"
          onClick={() => onSelect(country)}
          className="max-w-full wrap-break-word text-lg font-bold text-neutral-950 hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:text-white"
          aria-label={`View details for ${country.name.common}`}
        >
          {country.name.common}
        </button>
        <p className="max-w-full wrap-break-word text-xs text-neutral-600 dark:text-neutral-300">
          {country.name.official}
        </p>
        <div className="mt-2 flex flex-col items-center gap-0.5 text-sm text-neutral-700 dark:text-neutral-200">
          <p>
            Population:{" "}
            {population !== undefined
              ? population.toLocaleString()
              : "Not listed"}
          </p>
          <p>Capital: {capital(country)}</p>
          <p>Region: {region(country)}</p>
        </div>
      </div>
      <div className="p-4 pt-0">
        <Button
          type="button"
          variant={visited ? "default" : "outline"}
          onClick={() => handleVisitedCountry(country)}
          className={`w-full border transition-all duration-300 ${visited ? "border-transparent bg-linear-to-r from-neutral-100 to-neutral-300 text-neutral-950 shadow-lg shadow-black/20 hover:from-white hover:to-neutral-200 hover:shadow-black/30" : "border-white/20 bg-white/6 text-neutral-200 hover:border-transparent hover:bg-linear-to-r hover:from-neutral-800/95 hover:to-neutral-700/95 hover:text-white hover:shadow-lg hover:shadow-black/30 dark:border-white/20"}`}
        >
          {visited ? "Visited" : "Mark as Visited"}
        </Button>
      </div>
    </article>
  );
}
