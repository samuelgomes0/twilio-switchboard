export function sanitizeSpreadsheetCell(value: string | number): string {
  const raw = String(value)
  return /^[=+\-@]/.test(raw) ? `'${raw}` : raw
}

export function escapeCsvCell(value: string | number): string {
  return `"${sanitizeSpreadsheetCell(value).replaceAll('"', '""')}"`
}
