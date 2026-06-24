import { afterEach, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

const BASE = "http://localhost:3001";

function createJsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function createFetchMock({
  preferences = { theme: "light" },
  months = [],
  receipts = [],
  onCreateReceipt,
  onUpdateReceipt,
  onPreferencesPatch,
} = {}) {
  return vi.fn(async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const method = (init.method || "GET").toUpperCase();
    const parsed = new URL(url, BASE);
    const pathname = parsed.pathname;
    const searchParams = parsed.searchParams;

    if (pathname === "/preferences") {
      if (method === "GET") {
        return createJsonResponse(preferences);
      }
      if (method === "PATCH") {
        const body = init.body ? JSON.parse(init.body) : {};
        onPreferencesPatch?.(body);
        return createJsonResponse({ ...preferences, ...body });
      }
    }

    if (pathname === "/months") {
      if (method === "GET") {
        return createJsonResponse(months);
      }
    }

    if (pathname === "/receipts") {
      if (method === "GET") {
        const monthId = searchParams.get("monthId");
        const response = monthId
          ? receipts.filter((receipt) => String(receipt.monthId) === String(monthId))
          : receipts;
        return createJsonResponse(response);
      }
      if (method === "POST") {
        const body = init.body ? JSON.parse(init.body) : {};
        const created = onCreateReceipt ? onCreateReceipt(body) : { id: 100, ...body };
        return createJsonResponse(created, 201);
      }
    }

    const receiptMatch = pathname.match(/^\/receipts\/(\d+)$/);
    if (receiptMatch && method === "PATCH") {
      const id = Number(receiptMatch[1]);
      const body = init.body ? JSON.parse(init.body) : {};
      const updated = onUpdateReceipt ? onUpdateReceipt(id, body) : { id, ...body };
      return createJsonResponse(updated);
    }

    return createJsonResponse({ message: "Not found" }, 404);
  });
}

function renderApp(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.dataset.theme = "light";
});

test("Dashboard renders mocked existing expenses", async () => {
  const fetchMock = createFetchMock({
    preferences: { theme: "light" },
    months: [{ id: 1, month: "2026-06" }],
    receipts: [{ id: 1, description: "Coffee", amount: 15.0, category: "Food", monthId: 1 }],
  });
  vi.stubGlobal("fetch", fetchMock);

  renderApp(["/"]);

  expect(await screen.findByRole("heading", { name: /Expense Dashboard/i })).toBeInTheDocument();
  const monthHeading = await screen.findByRole("heading", { name: /June 2026/i, level: 3 });
  expect(monthHeading).toBeInTheDocument();

  const monthCard = monthHeading.closest(".month-card");
  expect(monthCard).toBeTruthy();
  expect(within(monthCard).getByText(/\$15\.00/)).toBeInTheDocument();
});

test("Adding a receipt updates UI via mocked API", async () => {
  const fetchMock = createFetchMock({
    preferences: { theme: "light" },
    months: [{ id: 1, month: "2026-06" }],
    receipts: [],
    onCreateReceipt: (body) => ({ id: 101, ...body }),
  });
  vi.stubGlobal("fetch", fetchMock);

  renderApp(["/expenses/1"]);

  expect(await screen.findByText(/Manage receipts/i)).toBeInTheDocument();

  const user = userEvent.setup();
  const description = screen.getByLabelText(/Description/i);
  const amount = screen.getByLabelText(/Amount/i);
  const category = screen.getByLabelText(/Category/i);

  await user.type(description, "Lunch");
  await user.type(amount, "12");
  await user.type(category, "Food");

  await user.click(screen.getByRole("button", { name: /Save receipt/i }));

  const receiptRow = await screen.findByText(/Lunch/i);
  const rowElement = receiptRow.closest(".receipt-row");
  expect(rowElement).toBeTruthy();
  expect(within(rowElement).getByText(/\$12\.00/)).toBeInTheDocument();
});

test("Editing receipt amount updates UI via mocked API", async () => {
  const fetchMock = createFetchMock({
    preferences: { theme: "light" },
    months: [{ id: 1, month: "2026-06" }],
    receipts: [{ id: 11, description: "Coffee", amount: 3.5, category: "Drinks", monthId: 1 }],
    onUpdateReceipt: (id, body) => ({ id, description: "Coffee", category: "Drinks", monthId: 1, ...body }),
  });
  vi.stubGlobal("fetch", fetchMock);

  renderApp(["/expenses/1"]);

  const receiptRow = await screen.findByText(/Coffee/i);
  const rowElement = receiptRow.closest(".receipt-row");
  expect(rowElement).toBeTruthy();

  const user = userEvent.setup();
  await user.click(within(rowElement).getByRole("button", { name: /Edit/i }));

  const amountInput = screen.getByLabelText(/Amount/i);
  await user.clear(amountInput);
  await user.type(amountInput, "5.5");

  await user.click(screen.getByRole("button", { name: /Update receipt/i }));

  expect(within(rowElement).getByText(/\$5\.50/)).toBeInTheDocument();
});

test("Settings link navigates to Settings page", async () => {
  const fetchMock = createFetchMock({
    preferences: { theme: "light" },
    months: [],
    receipts: [],
  });
  vi.stubGlobal("fetch", fetchMock);

  renderApp(["/"]);

  expect(await screen.findByText(/Expense Dashboard/i)).toBeInTheDocument();

  const user = userEvent.setup();
  await user.click(screen.getByRole("link", { name: /Settings/i }));

  expect(await screen.findByRole("heading", { name: /Settings/i })).toBeInTheDocument();
  expect(screen.getByText(/Current theme:/i)).toBeInTheDocument();
});

test("/settings/dark changes theme and persists", async () => {
  let patchedPreference = null;
  const fetchMock = createFetchMock({
    preferences: { theme: "light" },
    months: [],
    receipts: [],
    onPreferencesPatch: (body) => {
      patchedPreference = body;
    },
  });
  vi.stubGlobal("fetch", fetchMock);

  renderApp(["/settings/dark"]);

  expect(await screen.findByRole("heading", { name: /Settings/i })).toBeInTheDocument();
  expect(await screen.findByText(/Theme switched to dark\./i)).toBeInTheDocument();
  expect(patchedPreference).toEqual({ theme: "dark" });
  expect(document.documentElement.dataset.theme).toBe("dark");
});

test("invalid theme route redirects to /settings", async () => {
  let patchCalled = false;
  const fetchMock = createFetchMock({
    preferences: { theme: "light" },
    months: [],
    receipts: [],
    onPreferencesPatch: () => {
      patchCalled = true;
    },
  });
  vi.stubGlobal("fetch", fetchMock);

  renderApp(["/settings/blue-red"]);

  expect(await screen.findByRole("heading", { name: /Settings/i })).toBeInTheDocument();
  expect(screen.getByText(/Current theme:/i)).toBeInTheDocument();
  expect(patchCalled).toBe(false);
  expect(document.documentElement.dataset.theme).toBe("light");
});
