export function togglePageSelection(
  selected: string[],
  pageIds: string[],
  checked: boolean,
): string[] {
  return checked
    ? Array.from(new Set([...selected, ...pageIds]))
    : selected.filter((id) => !pageIds.includes(id));
}
export function pageNumbers(totalPages: number, current: number): number[] {
  const total = Math.max(1, Math.floor(totalPages));
  const start = Math.min(Math.max(1, current - 2), Math.max(1, total - 4));
  return Array.from({ length: Math.min(total, 5) }, (_, i) => start + i);
}
export function date(value: string): string {
  if (!value) return "—";
  const normalized = /Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : value + "Z";
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}
