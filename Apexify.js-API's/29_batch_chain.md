# Batch, chain and bounded operation orchestration — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.batch(operations, opts?) / painter.chain(operations, opts?)`

Parallel batch creation and sequential chained operations. Batch outputs preserve input order; chain passes the latest buffer between selected operations.

## Verified feature coverage

- Parallel bounded tasks
- Sequential method chaining
- Buffer hand-off to later tasks
- Asset ref resolution
- Cancellation and fail-fast semantics

## Public types, nested properties and options

### `BatchOperation`

| Property / member | Type, accepted values or signature |
|---|---|
| `canvas` | `{type:"canvas";config:CanvasConfig}` |
| `image` | `{type:"image";config:ImageProperties\|ImageProperties[]}` |
| `text` | `{type:"text";config:TextProperties\|TextProperties[]}` |

### `ChainOperation`

| Property / member | Type, accepted values or signature |
|---|---|
| `method` | `string` |
| `args` | `unknown[]` |

### `BatchChainAssetOpts`

| Property / member | Type, accepted values or signature |
|---|---|
| `resolveAssetRefs?` | `boolean` |
| `resolve?` | `AssetResolveFn` |
| `concurrency?` | `number` |
| `signal?` | `AbortSignal` |

### `Batch execution`

| Property / member | Type, accepted values or signature |
|---|---|
| `operations` | `BatchOperation[]` |
| `opts?` | `BatchChainAssetOpts` |
| `return` | `Promise<Buffer[]>` |
| `error policy` | `stop scheduling work after first failure, allow in-flight tasks to settle` |
| `order` | `output indexes preserve input order` |

### `Chain execution`

| Property / member | Type, accepted values or signature |
|---|---|
| `operations` | `ChainOperation[]` |
| `opts?` | `BatchChainAssetOpts` |
| `return` | `Promise<Buffer>` |
| `current placeholder` | `literal "current" or {__isCurrentBuffer:true}` |
| `method` | `dot-separated method path (unsafe general traversal on audited commit)` |

## Execution behavior, defaults and constraints

`batch` supports exactly canvas/image/text kinds. The chain method resolver traverses arbitrary object properties from a string, including inherited keys, which is a **confirmed unsafe design for untrusted payloads**. Use an explicit method allowlist and reject prototype-path segments before exposing chain to hosted user workflows.

## Source-of-truth files

- [`lib-next/types/batch.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/batch.ts)
- [`lib-next/batch/batch-operations.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/batch/batch-operations.ts)
- [`lib-next/apex-painter/creates/batch-create.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/creates/batch-create.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
