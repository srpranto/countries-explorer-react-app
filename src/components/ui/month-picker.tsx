import * as PopoverPrimitive from "@radix-ui/react-popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "./button";

interface MonthPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDateValue(value: string) {
  return /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
}

// Render the styled date picker.
export default function MonthPicker({
  value,
  onChange,
  label,
}: MonthPickerProps) {
  const today = new Date();
  const normalizedValue = getDateValue(value);
  const parsedDate = normalizedValue
    ? new Date(`${normalizedValue}T00:00:00`)
    : null;
  const validDate =
    parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  const [viewYear, setViewYear] = useState(
    validDate?.getFullYear() ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    validDate?.getMonth() ?? today.getMonth(),
  );
  const [showYears, setShowYears] = useState(false);
  const selectedDate = validDate
    ? formatDate(
        validDate.getFullYear(),
        validDate.getMonth(),
        validDate.getDate(),
      )
    : "";
  const days = useMemo(() => {
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const leadingDays = new Date(viewYear, viewMonth, 1).getDay();
    return [
      ...Array.from({ length: leadingDays }, () => null),
      ...Array.from({ length: totalDays }, (_, index) => index + 1),
    ];
  }, [viewMonth, viewYear]);
  const years = Array.from(
    { length: 12 },
    (_, index) => today.getFullYear() + index,
  );
  const displayValue = validDate
    ? validDate.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Choose date";

  // Move between calendar months.
  const moveMonth = (amount: number) => {
    const nextMonth = new Date(viewYear, viewMonth + amount, 1);
    setViewYear(nextMonth.getFullYear());
    setViewMonth(nextMonth.getMonth());
  };

  // Reset the view when opened.
  const handleOpenChange = (open: boolean) => {
    if (!open) return;
    setShowYears(false);
    setViewYear(validDate?.getFullYear() ?? today.getFullYear());
    setViewMonth(validDate?.getMonth() ?? today.getMonth());
  };

  return (
    <PopoverPrimitive.Root onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className="mt-2 h-9 w-full justify-start gap-2 px-3 text-xs text-neutral-300"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {displayValue}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          align="start"
          className="z-80 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-white/15 bg-neutral-900 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-neutral-400">{label}</p>
            <Button
              type="button"
              variant={showYears ? "default" : "ghost"}
              onClick={() => setShowYears((open) => !open)}
              className="h-8 px-2 text-xs"
            >
              {viewYear}
            </Button>
          </div>
          {showYears ? (
            <div className="mt-3 grid max-h-60 grid-cols-2 gap-1.5 overflow-y-auto rounded-lg bg-white/3 p-1">
              {years.map((year) => (
                <Button
                  key={year}
                  type="button"
                  variant={year === viewYear ? "default" : "ghost"}
                  onClick={() => {
                    setViewYear(year);
                    setShowYears(false);
                  }}
                  className="h-9 text-xs"
                >
                  {year}
                </Button>
              ))}
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Previous month"
                  onClick={() => moveMonth(-1)}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">
                  {months[viewMonth]} {viewYear}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Next month"
                  onClick={() => moveMonth(1)}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-500">
                {weekdays.map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((day, index) =>
                  day ? (
                    <Button
                      key={`${viewYear}-${viewMonth}-${day}`}
                      type="button"
                      variant={
                        selectedDate === formatDate(viewYear, viewMonth, day)
                          ? "default"
                          : "ghost"
                      }
                      onClick={() =>
                        onChange(formatDate(viewYear, viewMonth, day))
                      }
                      className="h-8 w-8 p-0 text-xs"
                    >
                      {day}
                    </Button>
                  ) : (
                    <span key={`empty-${index}`} />
                  ),
                )}
              </div>
            </>
          )}
          <p className="mt-3 border-t border-white/10 pt-2 text-center text-[11px] text-neutral-500">
            Select a date for your travel plan
          </p>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
