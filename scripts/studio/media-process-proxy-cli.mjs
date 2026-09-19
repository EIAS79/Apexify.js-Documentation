import { runStudioMediaProxy } from './media-process-proxy.mjs';

const mode = process.argv[2];
runStudioMediaProxy(mode, process.argv.slice(3));
