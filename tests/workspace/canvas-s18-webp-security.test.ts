import test from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import sharp from 'sharp';
import {validateImageAsset,validateImageAssets} from '../../features/apex-workspace/asset-store';
const sha=(x:Buffer)=>createHash('sha256').update(x).digest('hex');
test('S18 valid pinned-compatible WebP immutable asset admits correct RIFF and WEBP magic',async()=>{
 const rgba=Buffer.alloc(24*16*4);for(let i=0;i<rgba.length;i+=4){rgba[i]=i%253;rgba[i+1]=130;rgba[i+2]=60;rgba[i+3]=255;}
 const bytes=await sharp(rgba,{raw:{width:24,height:16,channels:4}}).webp().toBuffer();
 const key=sha(bytes),base={id:'asset:'+key,sha256:key,mime:'image/webp' as const,bytes:bytes.length,width:24,height:16,dataUri:'data:image/webp;base64,'+bytes.toString('base64')};
 assert.equal(validateImageAsset(base).id,base.id);assert.equal(validateImageAssets([base]).length,1);
 const fake=Buffer.from(bytes);fake[9]=0x00;const key2=sha(fake);
 assert.throws(()=>validateImageAsset({...base,id:'asset:'+key2,sha256:key2,bytes:fake.length,dataUri:'data:image/webp;base64,'+fake.toString('base64')}),/magic bytes/i);
 assert.throws(()=>validateImageAsset({...base,mime:'image/jpeg',dataUri:'data:image/jpeg;base64,'+bytes.toString('base64')}),/magic bytes/i);
 assert.throws(()=>validateImageAsset({...base,mime:'image/webp',dataUri:'https://example.com/a.webp'}),/MIME|base64/i);
 console.log('S18_WEBP_RIFF_VALIDATION=PASS');
});