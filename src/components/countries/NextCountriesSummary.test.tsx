import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CountryType } from "../../type";
import NextCountriesSummary from "./NextCountriesSummary";

const countries: CountryType[] = [
  {
    name: {
      common: "Bangladesh",
      official: "The People's Republic of Bangladesh",
    },
    ccn3: { ccn3: "050" },
    flags: { flags: { png: "/bangladesh.png", svg: "/bangladesh.svg" } },
    capital: { capital: ["Dhaka"] },
    region: { region: "Asia" },
  },
];

describe("NextCountriesSummary", () => {
  it("suggests a country when its capital is searched", () => {
    const onAdd = vi.fn();

    render(
      <NextCountriesSummary
        allCountries={countries}
        countries={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        notes={{}}
        travelDates={{}}
        savedAt={{}}
        onNoteChange={vi.fn()}
        onDateChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Dhaka" },
    });

    expect(screen.getByRole("option")).toHaveTextContent("Bangladesh");
    fireEvent.click(screen.getByRole("option"));
    expect(onAdd).toHaveBeenCalledWith(countries[0]);
  });
});
