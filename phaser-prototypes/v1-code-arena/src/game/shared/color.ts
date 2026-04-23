export function hexColorToNumber(color: string): number {
  const normalized = color.trim().replace(/^#/, "");
  return Number.parseInt(normalized, 16);
}
