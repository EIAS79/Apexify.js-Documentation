import {
  EXAMPLE_DIFFICULTIES,
  EXAMPLE_ID_PATTERN,
  EXAMPLE_OUTPUT_TYPES,
  EXAMPLE_RUNTIMES,
  EXAMPLE_VERIFICATION_MODES,
  type ExampleDefinition,
} from './schema';

export interface ExampleValidationContext {
  docs: Set<string>;
  apiIds: Set<string>;
  files: Set<string>;
}

function assertAllowed<T extends string>(value: string, allowed: readonly T[], label: string, id: string): asserts value is T {
  if (!(allowed as readonly string[]).includes(value)) throw new Error(`[DOC-5 ${id}] unknown ${label}: ${value}`);
}

export function validateExampleDefinitions(definitions: readonly ExampleDefinition[], context: ExampleValidationContext): void {
  const ids = new Set<string>();
  for (const example of definitions) {
    if (!EXAMPLE_ID_PATTERN.test(example.id)) throw new Error(`[DOC-5 ${example.id}] invalid stable example ID`);
    if (ids.has(example.id)) throw new Error(`[DOC-5 ${example.id}] duplicate example ID`);
    ids.add(example.id);
    if (!example.title.trim()) throw new Error(`[DOC-5 ${example.id}] missing title`);
    if (!example.summary.trim()) throw new Error(`[DOC-5 ${example.id}] missing summary`);
    assertAllowed(example.runtime, EXAMPLE_RUNTIMES, 'runtime', example.id);
    assertAllowed(example.difficulty, EXAMPLE_DIFFICULTIES, 'difficulty', example.id);
    assertAllowed(example.outputType, EXAMPLE_OUTPUT_TYPES, 'output type', example.id);
    if (!example.packages.includes('apexify.js')) throw new Error(`[DOC-5 ${example.id}] apexify.js package requirement is missing`);
    if (!example.sourceFiles.length) throw new Error(`[DOC-5 ${example.id}] sourceFiles is empty`);
    if (!example.sourceFiles.includes(example.entrypoint)) throw new Error(`[DOC-5 ${example.id}] entrypoint must be declared in sourceFiles`);
    for (const file of example.sourceFiles) {
      if (!file.startsWith('examples/node/') || file.includes('..')) throw new Error(`[DOC-5 ${example.id}] source path escapes authoritative example boundary: ${file}`);
      if (!context.files.has(file)) throw new Error(`[DOC-5 ${example.id}] missing source file: ${file}`);
    }
    if (!example.expectedOutput.length) throw new Error(`[DOC-5 ${example.id}] expected output is empty`);
    for (const output of example.expectedOutput) {
      if (!output.path || output.path.includes('..') || output.path.startsWith('/')) throw new Error(`[DOC-5 ${example.id}] invalid output path: ${output.path}`);
      assertAllowed(output.verificationMode, EXAMPLE_VERIFICATION_MODES, 'verification mode', example.id);
    }
    for (const doc of example.relatedDocs) if (!context.docs.has(doc)) throw new Error(`[DOC-5 ${example.id}] unknown relatedDocs route: ${doc}`);
    for (const apiId of example.apiSymbols) if (!context.apiIds.has(apiId)) throw new Error(`[DOC-5 ${example.id}] unknown DOC-4 API ID: ${apiId}`);
    const x = example.explanation;
    if (!x.goal || !x.prerequisites.length || !x.importantOptions.length || !x.whyOptions.length || !x.variants.length || !x.performanceNote || !x.errorNote || !x.nextStep) {
      throw new Error(`[DOC-5 ${example.id}] explanation contract is incomplete`);
    }
  }
  for (const example of definitions) {
    for (const related of example.relatedExamples ?? []) if (!ids.has(related)) throw new Error(`[DOC-5 ${example.id}] unknown related example: ${related}`);
  }
}
