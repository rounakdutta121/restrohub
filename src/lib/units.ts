const KNOWN_UNITS = new Set([
  "kg",
  "g",
  "l",
  "litre",
  "litres",
  "liter",
  "liters",
  "ml",
  "piece",
  "pieces",
  "pcs",
  "pc",
  "unit",
  "units",
  "bag",
  "bags",
  "box",
  "boxes",
]);

/** Strip digits accidentally typed into the unit field (e.g. "5kg" → "kg"). */
export function normalizeUnit(unit: string): string {
  const trimmed = unit.trim().toLowerCase();
  if (!trimmed) return "kg";

  const withPrefix = trimmed.match(/^[\d.]+(.+)$/);
  if (withPrefix) {
    const suffix = withPrefix[1].trim();
    if (KNOWN_UNITS.has(suffix)) return suffix;
  }

  if (KNOWN_UNITS.has(trimmed)) return trimmed;
  return trimmed.replace(/^[\d.]+/, "").trim() || "kg";
}

/**
 * Recover quantity when decimals were typed into the unit field
 * (e.g. qty 1 + unit "5kg" → 1.5 kg, qty 10 + unit "205kg" → 10.205 kg).
 */
export function repairQuantityFromUnit(quantity: number, unit: string): number {
  const match = unit.trim().match(/^([\d.]+)\s*([a-z]+)$/i);
  if (!match) return quantity;

  const prefix = match[1];
  if (prefix.includes(".")) return quantity;

  const combined = parseFloat(`${quantity}.${prefix}`);
  return Number.isFinite(combined) ? combined : quantity;
}

/**
 * Recover reorder level when decimal was lost (e.g. 52 + unit "5kg" → 5.2).
 * Applies when the unit field has a numeric prefix from mistyped decimals.
 */
export function repairReorderLevel(reorderLevel: number, unit: string): number {
  const match = unit.trim().match(/^([\d.]+)\s*([a-z]+)$/i);
  if (!match || match[1].includes(".")) return reorderLevel;

  const prefix = match[1];
  const str = String(reorderLevel);

  // 52 with prefix "5" → 5.2 (digits after prefix become decimal part)
  if (str.startsWith(prefix) && str.length > prefix.length) {
    const decimalPart = str.slice(prefix.length);
    const candidate = parseFloat(`${prefix}.${decimalPart}`);
    if (Number.isFinite(candidate) && candidate < reorderLevel) return candidate;
  }

  return reorderLevel;
}

/** Format a stock amount for display with clean spacing. */
export function formatQuantity(value: number, unit: string): string {
  const cleanUnit = normalizeUnit(unit);
  const formatted =
    Number.isInteger(value) || Math.abs(value) >= 100
      ? String(value)
      : parseFloat(value.toFixed(3)).toString();
  return `${formatted} ${cleanUnit}`;
}

/** Sanitize unit input on create. */
export function sanitizeUnitInput(unit: string): string {
  return normalizeUnit(unit);
}

/** Parse and validate a numeric stock input. */
export function parseStockNumber(value: string | number): number {
  const n = typeof value === "number" ? value : parseFloat(String(value).trim());
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid quantity");
  }
  return n;
}

/** Repair corrupted stock row from bad unit field. */
export function repairStockRow(quantity: number, reorderLevel: number, unit: string) {
  const hasCorruptUnit = /^[\d.]+[a-z]/i.test(unit.trim());
  if (!hasCorruptUnit) {
    return { quantity, reorderLevel, unit: normalizeUnit(unit) };
  }
  return {
    quantity: repairQuantityFromUnit(quantity, unit),
    reorderLevel: repairReorderLevel(reorderLevel, unit),
    unit: normalizeUnit(unit),
  };
}
