/** Locale hints for common outlet currencies */
const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
  SGD: "en-SG",
  AUD: "en-AU",
  CAD: "en-CA",
  JPY: "ja-JP",
};

export function normalizeCurrency(currency?: string | null): string {
  return (currency || "USD").trim().toUpperCase();
}

export function formatCurrency(
  amount: number,
  currency?: string | null,
  options?: { maximumFractionDigits?: number }
): string {
  const code = normalizeCurrency(currency);
  const locale = CURRENCY_LOCALES[code] ?? "en-US";
  const maxDigits = options?.maximumFractionDigits ?? (Number.isInteger(amount) ? 0 : 2);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(maxDigits)}`;
  }
}

export function formatSignedCurrency(
  amount: number,
  currency: string | null | undefined,
  sign: "+" | "-"
): string {
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`;
}
