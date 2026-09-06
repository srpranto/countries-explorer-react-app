import type { CountryType } from "../../type";
import { capital, flag, region, unwrap } from "../../utils/countryUtils";
import { Button } from "../ui/button";

export interface CountryProps {
  country: CountryType;
  visited: boolean;
  handleVisitedCountry: (country: CountryType) => void;
  onVisitStart?: (button: HTMLElement) => void;
  onSelect: (country: CountryType) => void;
  favorite: boolean;
  onToggleFavorite: (country: CountryType) => void;
}

// Render one country card. Layout is the same at every breakpoint; only
// spacing/typography scale compactly on smaller viewports. Colors never change
// with screen size (the dark palette is applied via the `dark:` variant).
export default function Country({
  country,
  visited,
  handleVisitedCountry,
  onVisitStart,
  onSelect,
  favorite,
  onToggleFavorite,
}: CountryProps) {
  const images = flag(country);
  const population = unwrap(country.population, "population");
  return (
    <article className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
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
          className="absolute right-1.5 top-1.5 rounded-full border border-black/10 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-neutral-950 shadow-sm backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:bg-neutral-900/90 dark:text-white sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-sm"
        >
          {favorite ? "★" : "☆"}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 p-3 text-center sm:p-4 md:gap-2">
        <button
          type="button"
          onClick={() => onSelect(country)}
          className="max-w-full wrap-break-word text-base font-bold text-neutral-950 hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:text-white sm:text-lg"
          aria-label={`View details for ${country.name.common}`}
        >
          {country.name.common}
        </button>
        <p className="max-w-full wrap-break-word text-[11px] text-neutral-600 dark:text-neutral-300 sm:text-xs">
          {country.name.official}
        </p>

        <div className="mt-1 flex flex-col items-center gap-0.5 text-xs text-neutral-700 dark:text-neutral-200 sm:mt-2 sm:text-sm">
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

      <div className="p-3 pt-0 sm:p-4">
        <Button
          type="button"
          variant={visited ? "default" : "outline"}
          onPointerDown={(event) => {
            event.preventDefault();
            onVisitStart?.(event.currentTarget);
          }}
          onFocus={(event) => onVisitStart?.(event.currentTarget)}
          onClick={() => handleVisitedCountry(country)}
          className={`w-full border transition-all duration-300 ${
            visited
              ? "border-transparent bg-linear-to-r from-neutral-100 to-neutral-300 text-neutral-950 shadow-lg shadow-black/20 hover:from-white hover:to-neutral-200 hover:shadow-black/30"
              : "border-white/20 bg-white/6 text-neutral-200 hover:border-transparent hover:bg-linear-to-r hover:from-neutral-800/95 hover:to-neutral-700/95 hover:text-white hover:shadow-lg hover:shadow-black/30 dark:border-white/20"
          }`}
        >
          {visited ? "Visited" : "Mark as Visited"}
        </Button>
      </div>
    </article>
  );
}
