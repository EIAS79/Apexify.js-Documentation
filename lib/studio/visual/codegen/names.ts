const RESERVED = new Set([
  'break','case','catch','class','const','continue','debugger','default','delete','do','else',
  'export','extends','false','finally','for','function','if','import','in','instanceof','let',
  'new','null','return','super','switch','this','throw','true','try','typeof','var','void',
  'while','with','yield','await','enum','implements','interface','package','private','protected',
  'public','static',
]);

export function toIdentifier(value: string, fallback = 'value'): string {
  const words = value.trim().replace(/[^A-Za-z0-9_$]+/g, ' ').trim().split(/\s+/).filter(Boolean);
  let result = words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
  result = result.replace(/^[^A-Za-z_$]+/, '');
  if (!result) result = fallback;
  if (RESERVED.has(result)) result = `${result}Value`;
  return result;
}

export class StableNameRegistry {
  private readonly used = new Set<string>();

  allocate(preferred: string, fallback = 'value'): string {
    const base = toIdentifier(preferred, fallback);
    let candidate = base;
    let suffix = 2;
    while (this.used.has(candidate)) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }
    this.used.add(candidate);
    return candidate;
  }
}
