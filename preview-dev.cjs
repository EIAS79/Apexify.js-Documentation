const args=process.argv.slice(2); const port=args[args.indexOf('--port')+1]||'4173';
process.argv=[process.execPath,require.resolve('next/dist/bin/next'),'start','--hostname','0.0.0.0','--port',port];
require('next/dist/bin/next');
