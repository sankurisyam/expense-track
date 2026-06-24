const BASE_URL = "http://localhost:3001";

async function request(endpoint, { method = "GET", body } = {}) {
  const config = { method, headers: {} };

  if (body) {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function fetchMonths() {
  return request("/months");
}

export function createMonth(body) {
  return request("/months", { method: "POST", body });
}

export function updateMonth(id, body) {
  return request(`/months/${id}`, { method: "PATCH", body });
}

export function deleteMonth(id) {
  return request(`/months/${id}`, { method: "DELETE" });
}

export function fetchReceipts(monthId) {
  const query = monthId ? `?monthId=${monthId}` : "";
  return request(`/receipts${query}`);
}

export function createReceipt(body) {
  return request("/receipts", { method: "POST", body });
}

export function updateReceipt(id, body) {
  return request(`/receipts/${id}`, { method: "PATCH", body });
}

export function deleteReceipt(id) {
  return request(`/receipts/${id}`, { method: "DELETE" });
}

export function fetchPreferences() {
  return request("/preferences");
}

export function updatePreferences(body) {
  return request("/preferences", { method: "PATCH", body });
}
