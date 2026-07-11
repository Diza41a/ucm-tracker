export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  const match = /^#?([0-9A-Fa-f]{6})$/.exec(trimmed);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

export function isValidHexColor(value: string): boolean {
  return normalizeHexColor(value) !== null;
}
