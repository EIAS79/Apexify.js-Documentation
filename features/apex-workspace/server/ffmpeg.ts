import "server-only";
import { existsSync } from "node:fs";
import { readFile, writeFile, chmod, mkdir } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { configureApexifyRuntime } from "apexify.js";
let prepared:Promise<void>|undefined;
export function ensureFFmpeg():Promise<void>{
  return prepared ??= (async()=>{
    const dir=join(tmpdir(),"apex-workspace-ffmpeg");await mkdir(dir,{recursive:true});
    const paths:string[]=[];
    for(const binary of ["ffmpeg","ffprobe"]){
      let path=[`/usr/bin/${binary}`,`/usr/local/bin/${binary}`].find(existsSync);
      if(!path){const packed=resolve(process.cwd(),`vendor/workspace-ffmpeg/${binary}.gz`);if(!existsSync(packed))throw new Error("Workspace video encoder is missing. Run npm run workspace:install-media during deployment.");path=join(dir,binary);if(!existsSync(path)){await writeFile(path,gunzipSync(await readFile(packed)));await chmod(path,0o700);}}
      paths.push(path);
    }
    configureApexifyRuntime({ffmpeg:{ffmpegPath:paths[0],ffprobePath:paths[1],processTimeoutMs:20000,probeTimeoutMs:10000}});
  })().catch(e=>{prepared=undefined;throw e;});
}
