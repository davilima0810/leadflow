export const DEFAULT_PRIMARY_COLOR = "#2F6FED";
export const DEFAULT_BACKGROUND_COLOR = "#F7F8FA";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export function isHexColor(value: string) {
  return HEX_COLOR_PATTERN.test(value);
}

export function normalizeHexColor(value: string) {
  const trimmed = value.trim();

  if (!isHexColor(trimmed)) {
    return trimmed;
  }

  return trimmed.toUpperCase();
}

export function getContrastTextColor(hexColor: string) {
  const normalized = normalizeHexColor(hexColor);

  if (!isHexColor(normalized)) {
    return "#FFFFFF";
  }

  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= 145 ? "#111827" : "#FFFFFF";
}
