import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CountryType } from "../../type";
import Country from "./Country";

const country: CountryType = {
  name: { common: "Åland Islands", official: "Åland Islands" },
  ccn3: { ccn3: "248" },
  flags: { flags: { png: "/aland.png", svg: "/aland.svg" } },
  population: { population: 29_458 },
  capital: { capital: ["Mariehamn"] },
  region: { region: "Europe" },
};

describe("Country", () => {
  it("renders country details and sends the visited action", () => {
    const handleVisitedCountry = vi.fn();

    render(
      <Country
        country={country}
        visited={false}
        handleVisitedCountry={handleVisitedCountry}
        onSelect={vi.fn()}
        favorite={false}
        onToggleFavorite={vi.fn()}
      />,
    );

    expect(screen.getByText("Population: 29,458")).toBeInTheDocument();
    expect(screen.getByText("Capital: Mariehamn")).toBeInTheDocument();
    expect(screen.getByText("Region: Europe")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark as Visited" }));

    expect(handleVisitedCountry).toHaveBeenCalledWith(country);
  });
});
