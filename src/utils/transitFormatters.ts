/**
 * Transit Formatting Utilities for FlowJeep Display
 */

/**
 * Formats vehicle identifiers for display.
 * Strips common prefix "JEEP-" from long vehicle IDs (length > 7) so they fit comfortably
 * on narrow mobile screens (320px - 380px) without ellipsis truncation.
 *
 * Examples:
 * - "JEEP-NCR-0482" -> "NCR-0482"
 * - "JEEP-NCR-12345" -> "NCR-12345"
 * - "JEEP-82" -> "JEEP-82"
 * - "FJ-82" -> "FJ-82"
 */
export function formatVehicleId(id: string | null | undefined): { display: string; full: string } {
  const full = (id || '').trim();
  if (!full) return { display: '—', full: '' };

  // If very long (> 16 chars) and starts with JEEP- or JEEP_, strip prefix for display
  if (full.length > 16 && /^JEEP[-_]/i.test(full)) {
    const stripped = full.replace(/^JEEP[-_]/i, '');
    return { display: stripped, full };
  }

  return { display: full, full };
}

/**
 * Shortens transit stop / endpoint names for compact mobile headers by stripping
 * word suffixes like "Terminal", "Central Terminal", "Rotonda", "Bayan", etc.
 *
 * Examples:
 * - "Baclaran Terminal" -> "Baclaran"
 * - "Monumento Rotonda" -> "Monumento"
 * - "Malinta Central Terminal" -> "Malinta Central"
 * - "Novaliches Bayan Terminal" -> "Novaliches"
 * - "Cubao Station" -> "Cubao"
 */
export function shortStopName(name: string | null | undefined): string {
  if (!name) return '—';
  const raw = name.split(/[-–—/]/)[0].trim();
  if (!raw) return '—';

  // Strip common transit suffixes
  const cleaned = raw
    .replace(/\s+(Bayan\s+Terminal|Central\s+Terminal|Transport\s+Terminal|Terminal|Rotonda|Bayan|Station|Loop|Depot|Stn|Term)\b/gi, '')
    .trim();

  return cleaned || raw;
}
