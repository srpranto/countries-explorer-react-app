import type { CountryType } from "../type";

// Unwrap API fields.
export function unwrap<T>(
  value: T | { [key: string]: T } | undefined,
  key: string,
): T | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "object" && key in value)
    return (value as { [key: string]: T })[key];
  return value as T;
}

// Return a stable country code.
export function countryCode(country: CountryType) {
  return unwrap(country.ccn3, "ccn3") ?? country.name.common;
}
// Return readable country fallbacks.
export function capital(country: CountryType) {
  return unwrap(country.capital, "capital")?.[0] ?? "No capital listed";
}
export function region(country: CountryType) {
  return unwrap(country.region, "region") ?? "Unknown";
}
// Return SVG and PNG flag URLs.
export function flag(country: CountryType) {
  const image = unwrap<{ png: string; svg: string }>(country.flags, "flags");
  return image
    ? { png: image.svg || image.png, svg: image.svg || image.png }
    : { png: "", svg: "" };
}

// Validate stored country data.
export function isCountry(value: unknown): value is CountryType {
  if (!value || typeof value !== "object") return false;
  const country = value as Partial<CountryType>;
  const images = unwrap<{ png?: string; svg?: string }>(country.flags, "flags");
  return (
    typeof country.name?.common === "string" &&
    typeof country.name?.official === "string" &&
    typeof country.ccn3 === "object" &&
    typeof unwrap(country.ccn3, "ccn3") === "string" &&
    Boolean(images?.png || images?.svg)
  );
}
