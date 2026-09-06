# Countries Explorer

Countries Explorer is a focused travel-planning tool for discovering countries, tracking places you have visited, and organizing the destinations you want to visit next.

It is designed to make country research simple and enjoyable. Instead of browsing disconnected lists, you can search, compare, save, and review your travel progress in one calm, responsive interface.

## Why it exists

Planning travel often starts with small questions: What is the capital of this country? Which region is it in? Have I already saved it? Where do I want to go next?

Countries Explorer brings those answers together in a single personal workspace. It helps you turn curiosity into a clear travel list while keeping the interface lightweight, readable, and easy to use on phones, tablets, and desktops.

## What you can do

- Search countries by common name or capital.
- Filter countries by region, visited status, planned status, or favorites.
- Sort the country collection by name, population, or region.
- View population, capital, region, official name, and flag details.
- Open detailed country information about geography, languages, currencies, borders, and time zones.
- Mark countries as visited and review them in a table and flag gallery.
- Add up to three countries to your next destinations list.
- Add a travel date and personal notes to planned destinations.
- Save favorite countries separately from visited and planned countries.
- Review recently opened country details.
- View exploration progress with a visual completion ring.
- Show country summaries only when you choose to display them.
- Discover a random country for inspiration.
- Export visited and planned countries through the browser's Save as PDF flow.
- Use keyboard shortcuts such as `/` to focus the main search and `Escape` to close dialogs.
- Continue using previously loaded country data during short connection problems.

## Privacy and storage

Countries Explorer does not require an account. Visited countries, planned destinations, favorites, notes, dates, and recently viewed countries are stored in your browser's local storage.

This means your saved information stays on the device and browser where you created it. It is not automatically synchronized between devices or browsers. Country data is loaded from the Programming Hero countries API, while optional country summaries come from Wikipedia's REST API.

## Technology

- React 19
- TypeScript with strict checking
- Vite 8
- Tailwind CSS v4
- Radix UI primitives with shadcn-style components
- Vitest and React Testing Library
- Oxlint

## Run locally

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app will be available at the local URL shown by Vite, usually `http://localhost:5173`.

## Verify the project

Run the automated tests:

```bash
npm run test
```

Create a production build:

```bash
npm run build
```

Check the code with Oxlint:

```bash
npm run lint
```

Run Vitest in watch mode while developing:

```bash
npm run test:watch
```
