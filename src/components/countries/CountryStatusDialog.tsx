import { useEffect } from "react";
import type { CountryType } from "../../type";
import { Button } from "../ui/button";

interface CountryStatusDialogProps {
  country: CountryType;
  onChooseVisited: () => void;
  onChoosePlanned: () => void;
  onClose: () => void;
}

// Ask which list should contain the country.
export default function CountryStatusDialog({
  country,
  onChooseVisited,
  onChoosePlanned,
  onClose,
}: CountryStatusDialogProps) {
  // Close the dialog with Escape.
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-status-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-neutral-900 p-5 text-white shadow-2xl shadow-black/40 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Save country
            </p>
            <h2
              id="country-status-title"
              className="mt-2 text-xl font-semibold"
            >
              What is {country.name.common} to you?
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              Choose one option so your visited and future destinations stay
              accurate.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close country status dialog"
            className="shrink-0 text-neutral-400"
          >
            ×
          </Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={onChooseVisited}
            className="h-auto flex-col items-start gap-1 p-4 text-left"
          >
            <span className="text-white">I visited it</span>
            <span className="text-xs font-normal text-neutral-400">
              Add to your visited countries.
            </span>
          </Button>
          <Button
            type="button"
            onClick={onChoosePlanned}
            className="h-auto flex-col items-start gap-1 p-4 text-left"
          >
            <span> I want to visit it</span>
            <span className="text-xs font-normal text-neutral-600">
              Add to your next destinations.
            </span>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="mt-3 w-full text-neutral-400"
        >
          Cancel
        </Button>
      </section>
    </div>
  );
}
