import { expect, test, type APIResponse, type Page } from "@playwright/test";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value.replace(/\/$/, "");
}

const frontendUrl = required("E2E_FRONTEND_URL");
const apiBase = required("E2E_API_URL");
const email = required("E2E_USER_EMAIL");
const password = required("E2E_USER_PASSWORD");
const frontendBypass = required("E2E_FRONTEND_BYPASS");
const backendBypass = required("E2E_BACKEND_BYPASS");
const supabaseUrl = required("E2E_SUPABASE_URL");
const supabaseServiceKey = required("E2E_SUPABASE_SERVICE_ROLE_KEY");
const backendOrigin = new URL(apiBase).origin;

type JsonRecord = Record<string, unknown>;

async function responseJson(response: APIResponse): Promise<unknown> {
  const text = await response.text();
  if (!response.ok()) {
    throw new Error(`${response.request().method()} ${response.url()} returned ${response.status()}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function stagingDelete(table: string, query: string): Promise<void> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      Prefer: "return=minimal",
    },
  });
  if (!response.ok) {
    throw new Error(`Staging cleanup failed for ${table}: ${response.status} ${await response.text()}`);
  }
}

async function stagingRows(table: string, query: string): Promise<JsonRecord[]> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Staging lookup failed for ${table}: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<JsonRecord[]>;
}

async function cleanupItem(partNumber: string): Promise<void> {
  const items = await stagingRows("item", `select=id&item_id=eq.${encodeURIComponent(partNumber)}`);
  for (const item of items) {
    const itemId = Number(item.id);
    const stocks = await stagingRows("stock", `select=id&item_id=eq.${itemId}`);
    const stockIds = stocks.map((stock) => Number(stock.id)).filter(Number.isFinite);
    const stockFilter = stockIds.length ? `(${stockIds.join(",")})` : "";
    const saleLines = stockFilter
      ? await stagingRows("sale_stock", `select=sale_id&stock_id=in.${stockFilter}`)
      : [];
    const receiptLines = stockFilter
      ? await stagingRows("receipt_stock", `select=receipt_id&stock_id=in.${stockFilter}`)
      : [];
    const saleIds = [...new Set(saleLines.map((line) => Number(line.sale_id)).filter(Number.isFinite))];
    const receiptIds = [...new Set(receiptLines.map((line) => Number(line.receipt_id)).filter(Number.isFinite))];

    await stagingDelete(
      "transfer",
      `or=${encodeURIComponent(`(from_item_id.eq.${itemId},to_item_id.eq.${itemId})`)}`,
    );
    if (stockFilter) {
      await stagingDelete("sale_stock", `stock_id=in.${stockFilter}`);
      await stagingDelete("receipt_stock", `stock_id=in.${stockFilter}`);
    }
    if (saleIds.length) {
      await stagingDelete("sale", `id=in.(${saleIds.join(",")})`);
    }
    if (receiptIds.length) {
      await stagingDelete("receipt", `id=in.(${receiptIds.join(",")})`);
    }
    await stagingDelete("item_supplier", `item_id=eq.${itemId}`);
    await stagingDelete("stock", `item_id=eq.${itemId}`);
    await stagingDelete("item", `id=eq.${itemId}`);
  }
}

function pageDiagnostics(page: Page) {
  const pageErrors: string[] = [];
  const applicationConsoleErrors: string[] = [];
  const failedApiRequests: string[] = [];
  const apiResponses: Array<{ url: string; status: number }> = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    const text = message.text();
    if (
      message.type() === "error"
      && /Uncaught|TypeError|ReferenceError|Cannot read properties|Failed to fetch/i.test(text)
    ) {
      applicationConsoleErrors.push(text);
    }
  });
  page.on("requestfailed", (request) => {
    if (request.url().startsWith(apiBase)) {
      const errorText = request.failure()?.errorText ?? "unknown error";
      // React Query requests that are superseded by route changes or explicit
      // invalidation are intentionally cancelled by the browser.
      if (errorText !== "net::ERR_ABORTED") {
        failedApiRequests.push(`${request.method()} ${request.url()}: ${errorText}`);
      }
    }
  });
  page.on("response", (response) => {
    if (response.url().startsWith(apiBase)) {
      apiResponses.push({ url: response.url(), status: response.status() });
    }
  });

  return { pageErrors, applicationConsoleErrors, failedApiRequests, apiResponses };
}

test("deployed frontend uses the deployed backend for auth, item rendering, and stock lifecycle", async ({
  page,
}) => {
  const diagnostics = pageDiagnostics(page);
  const partNumber = `__E2E_${Date.now()}`;
  let accessToken = "";

  await page.route(`${backendOrigin}/**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-vercel-protection-bypass": backendBypass,
      },
    });
  });

  try {
    const loginUrl = new URL("/login", frontendUrl);
    loginUrl.searchParams.set("x-vercel-protection-bypass", frontendBypass);
    loginUrl.searchParams.set("x-vercel-set-bypass-cookie", "true");
    await page.goto(loginUrl.toString(), { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/items(?:\?.*)?$/);
    await expect(page.getByRole("heading", { name: "Items" })).toBeVisible();

    accessToken = await page.evaluate(() => localStorage.getItem("nikkoe_access_token") ?? "");
    const refreshToken = await page.evaluate(() => localStorage.getItem("nikkoe_refresh_token") ?? "");
    expect(accessToken).not.toBe("");
    expect(refreshToken).not.toBe("");

    const api = async (path: string, options: { method?: string; data?: unknown } = {}) => {
      const response = await page.request.fetch(`${apiBase}${path}`, {
        method: options.method ?? "GET",
        data: options.data,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "x-vercel-protection-bypass": backendBypass,
        },
      });
      return responseJson(response);
    };

    const me = await api("/auth/me") as JsonRecord;
    expect((me.user as JsonRecord).email).toBe(email);
    const refreshed = await api("/auth/refresh", {
      method: "POST",
      data: { refresh_token: refreshToken },
    }) as JsonRecord;
    expect((refreshed.session as JsonRecord).access_token).toBeTruthy();

    for (const fixture of [
      { part: "TOBU3", price: "2.100" },
      { part: "NORPS-12", price: "1.700" },
    ]) {
      await page.goto(new URL("/items", frontendUrl).toString());
      const search = page.getByPlaceholder("Search part numbers...");
      await search.fill(fixture.part);
      await expect(page.getByText(fixture.part, { exact: true })).toBeVisible();
      await page.getByText(fixture.part, { exact: true }).click();
      await expect(page.getByRole("heading", { name: fixture.part })).toBeVisible();
      await expect(page.getByText(fixture.price, { exact: true })).toBeVisible();
      await expect(page.getByText("E2E-A", { exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "New Sale" })).toBeVisible();
      await expect(page.getByRole("button", { name: "New Receipt" })).toBeVisible();
    }

    await page.goto(new URL("/items", frontendUrl).toString());
    await page.getByRole("button", { name: "Add Item" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Part Number").fill(partNumber);
    await dialog.getByLabel("Description").fill("Created through deployed frontend");
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: "E2E Components" }).click();
    await dialog.getByRole("button", { name: "Add Item" }).click();

    const search = page.getByPlaceholder("Search part numbers...");
    await search.fill(partNumber);
    await expect(page.getByText(partNumber, { exact: true })).toBeVisible();
    await page.getByText(partNumber, { exact: true }).click();
    await expect(page.getByRole("heading", { name: partNumber })).toBeVisible();
    const itemId = Number(new URL(page.url()).pathname.split("/").pop());
    expect(itemId).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Edit Item" }).click();
    await page.locator("textarea:visible").fill("Persisted through deployed backend");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Persisted through deployed backend", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Persisted through deployed backend", { exact: true })).toBeVisible();

    const listData = async (path: string): Promise<JsonRecord[]> => {
      const result = await api(path) as JsonRecord;
      return result.data as JsonRecord[];
    };
    const [supplier] = (await listData("/suppliers/?limit=100&offset=0"))
      .filter((row) => row.name === "E2E Priced Supplier");
    const [currency] = (await listData("/currencies/"))
      .filter((row) => row.name === "GBP");
    const [customer] = (await listData("/customers/?limit=100&offset=0"))
      .filter((row) => row.name === "E2E Customer");
    const [channel] = (await listData("/channels/"))
      .filter((row) => row.name === "E2E Direct");
    const locations = await listData("/locations/?limit=100&offset=0");
    const locationA = locations.find((row) => row.code === "E2E-A")!;
    const locationB = locations.find((row) => row.code === "E2E-B")!;

    const receipt = await api("/receipts/", {
      method: "POST",
      data: {
        receipt: {
          supplier_id: Number(supplier.id),
          reference: partNumber,
          note: "deployed E2E receipt",
        },
        lines: [{
          item_id: itemId,
          location_id: Number(locationA.id),
          quantity: 3,
          unit_price: 2.5,
          currency_id: Number(currency.id),
          supplier_id: Number(supplier.id),
        }],
      },
    }) as JsonRecord;

    await page.reload();
    const quantityPanel = page.getByText("Total Quantity").locator("..");
    await expect(quantityPanel.getByText("3", { exact: true })).toBeVisible();

    let inventory = await api(`/items/${itemId}/inventory`) as JsonRecord[];
    const stockA = inventory.find((row) => (row.location as JsonRecord)?.code === "E2E-A")!;
    await api("/inventory/transfer", {
      method: "POST",
      data: {
        from_stock_id: Number(stockA.id),
        to_location_id: Number(locationB.id),
        quantity: 1,
        notes: "deployed E2E transfer",
      },
    });
    await page.reload();
    await expect(page.getByText("E2E-A", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E-B", { exact: true })).toBeVisible();

    inventory = await api(`/items/${itemId}/inventory`) as JsonRecord[];
    const stockB = inventory.find((row) => (row.location as JsonRecord)?.code === "E2E-B")!;
    await api("/inventory/transfer", {
      method: "POST",
      data: {
        from_stock_id: Number(stockB.id),
        to_location_id: Number(locationA.id),
        quantity: 1,
        notes: "deployed E2E transfer reset",
      },
    });

    const sale = await api("/sales/", {
      method: "POST",
      data: {
        sale: {
          customer_id: Number(customer.id),
          channel_id: Number(channel.id),
          channel_ref: partNumber,
          note: "deployed E2E sale",
        },
        lines: [{
          item_id: itemId,
          location_id: Number(locationA.id),
          quantity: 1,
          unit_price: 4.5,
          currency_id: Number(currency.id),
        }],
      },
    }) as JsonRecord;
    await page.reload();
    await expect(quantityPanel.getByText("2", { exact: true })).toBeVisible();

    await api(`/sales/${Number(sale.id)}/void`, {
      method: "POST",
      data: { reason: "deployed E2E cleanup" },
    });
    await page.reload();
    await expect(quantityPanel.getByText("3", { exact: true })).toBeVisible();

    await api(`/receipts/${Number(receipt.id)}/void`, {
      method: "POST",
      data: { reason: "deployed E2E cleanup" },
    });
    await page.reload();
    await expect(quantityPanel.getByText("0", { exact: true })).toBeVisible();

    expect(diagnostics.pageErrors).toEqual([]);
    expect(diagnostics.applicationConsoleErrors).toEqual([]);
    expect(diagnostics.failedApiRequests).toEqual([]);
    expect(diagnostics.apiResponses.length).toBeGreaterThan(10);
    expect(diagnostics.apiResponses.filter((response) => response.status >= 400)).toEqual([]);
    expect(diagnostics.apiResponses.every((response) => response.url.startsWith(apiBase))).toBe(true);
  } finally {
    await cleanupItem(partNumber);
  }
});
