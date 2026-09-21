import { z } from "zod";
import { costReport, effectivePrices } from "./cost-ledger.mjs";

export const usageFilterSchema = z.object({ provider: z.string().max(100).optional(), model: z.string().max(160).optional(), projectId: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20)
}).strict();
export function usageDashboard(state, input = {}) {
  const filters = usageFilterSchema.parse(input), report = costReport(state, filters), all = report.records;
  const records = all.filter(r => (!filters.provider || r.provider === filters.provider) && (!filters.model || r.model === filters.model) && (!filters.from || r.at?.slice(0, 10) >= filters.from) && (!filters.to || r.at?.slice(0, 10) <= filters.to)).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const summarize = rows => {
    const currencies = {};
    for (const row of rows) for (const [key, entry] of [["estimated", row.estimate], ["actual", row.actual]]) if (entry) {
      currencies[entry.currency] ||= { estimated: 0, actual: 0, estimatedRecords: 0, actualRecords: 0 };
      currencies[entry.currency][key] = Number((currencies[entry.currency][key] + entry.amount).toFixed(8));
      currencies[entry.currency][`${key}Records`]++;
    }
    return { calls: rows.length, unpriced: rows.filter(r => !r.estimate).length, unreconciled: rows.filter(r => !r.actual).length, currencies,
      estimateGaps: { historical: rows.filter(r => r.estimateStatus === "historical-unknown").length,
        quantity: rows.filter(r => r.estimateStatus === "quantity-unknown").length,
        price: rows.filter(r => r.estimateStatus === "price-not-configured").length } };
  };
  const grouped = key => [...new Set(records.map(key))].sort().map(value => ({ key: value, ...summarize(records.filter(r => key(r) === value)) }));
  return { summary: summarize(records), trend: grouped(r => r.at?.slice(0, 10) || "unknown"), byProvider: grouped(r => r.provider), byModel: grouped(r => `${r.provider} / ${r.model || "unknown"}`),
    records: records.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize), page: filters.page, pages: Math.max(1, Math.ceil(records.length / filters.pageSize)),
    options: { providers: [...new Set(all.map(r => r.provider))], models: [...new Set(all.filter(r => !filters.provider || r.provider === filters.provider).map(r => r.model).filter(Boolean))] }, prices: effectivePrices(state),
    boundary: report.boundary, timezone: "UTC", accountBills: state.accountBills || [] };
}
