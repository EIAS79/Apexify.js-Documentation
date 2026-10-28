/** The native v6 API accepts comma-separated edge/corner names, not arrays. */
export const BORDER_EDGES = ['top', 'right', 'bottom', 'left'] as const;
export const BORDER_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
export const BORDER_TOKENS = [...BORDER_EDGES, ...BORDER_CORNERS] as const;
export type BorderToken = typeof BORDER_TOKENS[number];
export type BorderSelection = 'all' | BorderToken | `${BorderToken},${string}`;

export function validateBorderSelection(value: unknown, label = 'border selection'): BorderSelection {
  if (typeof value !== 'string' || !value || value.length > 128)
    throw new Error('unsupported ' + label);
  const parts = value.split(',').map(part => part.trim());
  if (parts.length === 1 && parts[0] === 'all') return 'all';
  if (parts.length > 8 || parts.some(part => !BORDER_TOKENS.includes(part as BorderToken)))
    throw new Error('unsupported ' + label);
  const unique = new Set(parts);
  return BORDER_TOKENS.filter(token => unique.has(token)).join(',') as BorderSelection;
}

/** Expand the legacy side/corner aliases exactly as the pinned native geometry does. */
export function selectedBorderParts(value: string | undefined, kind: 'edges' | 'corners'): string[] {
  const choices = kind === 'edges' ? BORDER_EDGES : BORDER_CORNERS;
  const parts = new Set((value ?? 'all').split(',').map(part => part.trim()));
  if (parts.has('all')) return [...choices];
  return choices.filter(choice => kind === 'edges'
    ? parts.has(choice) || [...parts].some(part => part.split('-').includes(choice))
    : parts.has(choice) || choice.split('-').some(side => parts.has(side)));
}

export function toggleBorderPart(value: string | undefined, token: string, kind: 'edges' | 'corners'): BorderSelection {
  const choices = kind === 'edges' ? BORDER_EDGES : BORDER_CORNERS;
  if (!(choices as readonly string[]).includes(token)) throw new Error('Unsupported border choice');
  const selected = new Set(selectedBorderParts(value, kind));
  if (selected.has(token)) {
    if (selected.size === 1) return validateBorderSelection(value ?? 'all');
    selected.delete(token);
  } else selected.add(token);
  return selected.size === choices.length ? 'all'
    : choices.filter(choice => selected.has(choice)).join(',') as BorderSelection;
}
