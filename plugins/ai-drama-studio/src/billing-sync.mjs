import { createHash, createHmac } from "node:crypto";
import { z } from "zod";
import { readState, mutateState } from "./store.mjs";
import { readProviderKey, hasProviderKey } from "./secrets.mjs";
import { shutdownSignal } from "./background-jobs.mjs";

export const billingSettingsSchema = z.object({ enabled: z.boolean(), period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() }).strict();
const endpoint = "https://billing.volcengineapi.com/?Action=ListBillDetail&Version=2022-01-01";
const sha = value => createHash("sha256").update(value).digest("hex");
const hmac = (key, value) => createHmac("sha256", key).update(value).digest();
// Volcengine Signature V4; fixed read-only action/host, never a caller-supplied URL.
export function billHeaders(body, ak, sk, now = new Date()) {
  const date = now.toISOString().replace(/[:-]|\.\d{3}/g, ""), scope = `${date.slice(0, 8)}/cn-beijing/billing/request`;
  const headers = { "content-type": "application/json", host: "billing.volcengineapi.com", "x-content-sha256": sha(body), "x-date": date };
  const names = Object.keys(headers).sort(), signed = names.map(n => `${n}:${headers[n]}\n`).join("");
  const canonical = ["POST", "/", "Action=ListBillDetail&Version=2022-01-01", signed, names.join(";"), sha(body)].join("\n");
  const key = hmac(hmac(hmac(hmac(sk, date.slice(0, 8)), "cn-beijing"), "billing"), "request");
  headers.authorization = `HMAC-SHA256 Credential=${ak}/${scope}, SignedHeaders=${names.join(";")}, Signature=${hmac(key, ["HMAC-SHA256", date, scope, sha(canonical)].join("\n")).toString("hex")}`;
  return headers;
}
export async function fetchAccountBill(period, ak, sk, fetcher = fetch) {
  billingSettingsSchema.parse({ enabled: false, period });
  const rows = [], requests = [], ids = new Set(); let complete = false;
  for (let offset = 0; offset < 10000; offset += 100) {
    const body = JSON.stringify({ BillPeriod: period, Limit: 100, Offset: offset, NeedRecordNum: 1 });
    const response = await fetcher(endpoint, { method: "POST", body, headers: billHeaders(body, ak, sk), redirect: "error", signal: AbortSignal.any([shutdownSignal, AbortSignal.timeout(30000)]) });
    if (!response.ok) throw new Error(`BILLING_HTTP_${response.status}`);
    const data = await response.json();
    if (data.ResponseMetadata?.Error) throw new Error("BILLING_PROVIDER_ERROR_CHECK_READ_ONLY_PERMISSION");
    const result = data.Result;
    if (!Array.isArray(result?.List) || !Number.isInteger(result.Total) || result.Total < 0) throw new Error("BILLING_RESPONSE_INVALID");
    requests.push(data.ResponseMetadata?.RequestId || null);
    for (const row of result.List) {
      const amount = Number(row.PayableAmount);
      if (!/^-?\d+(\.\d+)?$/.test(String(row.PayableAmount)) || !Number.isFinite(amount) || !/^[A-Z]{3}$/.test(row.Currency || "")) throw new Error("BILLING_AMOUNT_OR_CURRENCY_UNKNOWN");
      // Retain financial evidence, not names/account IDs, resource IDs or arbitrary provider fields.
      const id = row.BillDetailId;
      if (id && id !== "-") { if (ids.has(id)) throw new Error("BILLING_PAGINATION_CHANGED_RETRY_READ_ONLY"); ids.add(id); }
      rows.push({ billDetailId: id || null, product: String(row.Product || ""), date: String(row.ExpenseDate || ""), currency: row.Currency, payableAmount: amount });
    }
    if (offset + result.List.length >= result.Total) { complete = true; break; }
    if (!result.List.length) throw new Error("BILLING_PAGINATION_INCOMPLETE");
  }
  if (!complete) throw new Error("BILLING_PAGE_LIMIT_EXCEEDED_NO_PARTIAL_TOTAL");
  const totals = {};
  for (const row of rows) totals[row.currency] = Number(((totals[row.currency] || 0) + row.payableAmount).toFixed(8));
  return { provider: "volcengine-account", period, at: new Date().toISOString(), totals, rows, requests, complete,
    attribution: "account-level-not-shot-level", amountField: "PayableAmount", boundary: "Delayed provider account bill; may cover other cloud products. Never added to per-call estimates or assigned to shots by guessing." };
}
export async function billingStatus() {
  const state = await readState();
  return { settings: state.settings.billingSync || { enabled: false }, configured: await hasProviderKey("volc-billing-ak") && await hasProviderKey("volc-billing-sk"), lastAttempt: state.billingSyncStatus || null, bills: (state.accountBills || []).map(({ rows, requests, ...bill }) => ({ ...bill, rowCount: rows.length })) };
}
export async function syncBilling(period, { scheduled = false } = {}) {
  const state = await readState(), config = state.settings.billingSync || { enabled: false };
  const month = period || config.period || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit" }).slice(0, 7);
  billingSettingsSchema.parse({ enabled: false, period: month });
  const claim = await mutateState(s => {
    if (scheduled && (!s.settings.billingSync?.enabled || Date.now() - Date.parse(s.billingSyncStatus?.at || 0) < 6 * 3600000)) return false;
    if (s.billingSyncStatus?.running && Date.now() - Date.parse(s.billingSyncStatus.at) < 10 * 60000) throw new Error("BILLING_SYNC_ALREADY_RUNNING");
    s.billingSyncStatus = { at: new Date().toISOString(), running: true, status: "syncing" }; return true;
  });
  if (!claim) return { skipped: true };
  try {
    const bill = await fetchAccountBill(month, await readProviderKey("volc-billing-ak"), await readProviderKey("volc-billing-sk"));
    await mutateState(s => { s.accountBills = [...(s.accountBills || []).filter(b => b.period !== month), bill]; s.billingSyncStatus = { at: new Date().toISOString(), running: false, status: "synced", period: month }; });
    return { period: month, totals: bill.totals, rows: bill.rows.length, attribution: bill.attribution };
  } catch (error) {
    await mutateState(s => { s.billingSyncStatus = { at: new Date().toISOString(), running: false, status: "failed", error: String(error.message).slice(0, 160) }; }); throw error;
  }
}
export function startBillingTimer() {
  const timer = setInterval(async () => {
    try { if ((await readState()).settings.billingSync?.enabled) await syncBilling(undefined, { scheduled: true }); } catch { /* status persisted; never leak credentials */ }
  }, 60000);
  timer.unref(); return () => clearInterval(timer);
}
