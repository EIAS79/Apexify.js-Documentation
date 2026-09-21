export class ImportRegistry {
  private readonly imports = new Map<string, Set<string>>();

  add(moduleName: string, symbol: string): void {
    const symbols = this.imports.get(moduleName) ?? new Set<string>();
    symbols.add(symbol);
    this.imports.set(moduleName, symbols);
  }

  emit(): string {
    return [...this.imports.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([moduleName, symbols]) => {
        const names = [...symbols].sort();
        return `import { ${names.join(', ')} } from '${moduleName}';`;
      })
      .join('\n');
  }
}
