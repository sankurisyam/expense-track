import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import App from "./App";

function mockApi() {
  vi.stubGlobal("fetch", vi.fn((url) => {
    if (url.includes("/preferences")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ theme: "light" }),
      });
    }

    if (url.includes("/months")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, month: "2026-01" },
            { id: 2, month: "2026-02" },
          ]),
      });
    }

    if (url.includes("/receipts")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              monthId: 1,
              description: "Groceries",
              amount: 1500,
              category: "Food",
            },
          ]),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  }));
}

function renderApp(route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
}

describe("Expense Tracker simple tests", () => {
  test("shows dashboard title", async () => {
    mockApi();
    renderApp("/");

    expect(await screen.findByText("Expense Dashboard")).toBeInTheDocument();
  });

  test("shows mocked month cards", async () => {
    mockApi();
    renderApp("/");

    expect(await screen.findByText("January 2026")).toBeInTheDocument();
    expect(screen.getByText("February 2026")).toBeInTheDocument();
  });

  test("shows settings page", async () => {
    mockApi();
    renderApp("/settings");

    expect(await screen.findByText("Settings")).toBeInTheDocument();
    expect(screen.getByText(/Current theme/i)).toBeInTheDocument();
  });

  test("shows receipt details page", async () => {
    mockApi();
    renderApp("/expenses/1");

    expect(await screen.findByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("$1500.00")).toBeInTheDocument();
  });
});