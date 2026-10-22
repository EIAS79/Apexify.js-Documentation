# PluginHost and ApexPainter.use plugin integration — Apexify.js 6.0.0

**Status:** Source-confirmed public Node API unless explicitly qualified.  **Audit baseline:** `cbeea053c2a973d4e867f8ca96e79546060dd62d`.
**API:** `painter.use(plugin) / painter.plugins.*`

Named custom APIs installed transactionally through a serialized asynchronous plugin installation queue.

## Verified feature coverage

- Named plugin registry
- Serialized async plugin installation
- Duplicate name guard
- Rollback of registry changes on plugin failure
- AsyncLocalStorage transaction context

## Public types, nested properties and options

### `ApexifyPlugin<T>`

| Property / member | Type, accepted values or signature |
|---|---|
| `name` | `string` |
| `install` | `(host:T)=>void\|Promise<void>` |

### `PluginHost API`

| Property / member | Type, accepted values or signature |
|---|---|
| `use(name:string,api:object)` | `registers named API/get existing type` |
| `get(name)` | `T\|undefined` |
| `has(name)` | `boolean` |
| `remove(name)` | `boolean` |
| `list()` | `string[]` |
| `isInstalled(name)` | `boolean` |
| `listInstalled()` | `string[]` |
| `install(plugin,host)` | `Promise<void>` |

### `ApexPainter.use`

| Property / member | Type, accepted values or signature |
|---|---|
| `plugin` | `ApexifyPlugin<ApexPainter>` |
| `result` | `Promise<ApexPainter>` |
| `await required` | `yes (installation can be async)` |

## Execution behavior, defaults and constraints

`PluginHost` is a code extension mechanism, **not** a sandbox for untrusted plugins. Plugin installation executes JavaScript in the host process. Use an isolated worker/process and strict permissions for community plugins in a hosted workspace. A failed installation rolls back plugin-registration changes, not arbitrary external side effects.

## Source-of-truth files

- [`lib-next/types/plugins.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/types/plugins.ts)
- [`lib-next/plugins/plugin-host.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/plugins/plugin-host.ts)
- [`lib-next/apex-painter/main.ts`](https://github.com/EIAS79/Apexify.js/blob/cbeea053c2a973d4e867f8ca96e79546060dd62d/lib-next/apex-painter/main.ts)

> Scope: Types reflect the checked repository declarations. Optional properties are marked `?`; an optional property does not imply that every combination is valid. Runtime validation may impose additional constraints. This reference is not a successful-execution certificate for every enumerated option. Planned Phase 15–43 interfaces are not represented as implemented APIs.
