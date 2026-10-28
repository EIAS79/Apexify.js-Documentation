import "server-only";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import {
  ApexPainter,
  type ImageProperties,
  type CanvasConfig,
} from "apexify.js";
import { validateDocument } from "../model";
import {textArguments} from '../domain/text';
import {makeAssetCanvasConfig,verifyCanvasAssets} from './assets';
import {resolveImageReference,ASSET_REFERENCE} from '../asset-store';
import {imageArguments,groupArguments} from '../image-runtime';

/** Data-only execution. This renderer never evaluates submitted JavaScript or loads arbitrary paths/URLs. */
export async function renderWorkspaceDocument(
  input: unknown,
  signal?: AbortSignal,
): Promise<Buffer> {
  const document = validateDocument(input);
  const checkCancelled = () => {
    if (signal?.aborted)
      throw new Error("Rendering was cancelled or exceeded its time budget.");
  };
  checkCancelled();
  await verifyCanvasAssets(document,signal);
  checkCancelled();
  const painter = new ApexPainter({ type: "buffer" });
  // Literal read gives Next's file tracer the bundled artwork dependency.
  const artwork = await readFile(
    resolve(process.cwd(), "public/workspace/assets/crystal-lake.webp"),
  );
  const localSource = (source: string) =>
    source === "/workspace/assets/crystal-lake.webp"
      ? artwork
      : ASSET_REFERENCE.test(source)
        ? Buffer.from(resolveImageReference(source,document.assets??[]).split(',')[1],'base64')
        : Buffer.from(source.slice(source.indexOf(",") + 1), "base64");
  const bg = document.background;
  const config: CanvasConfig = makeAssetCanvasConfig(document,artwork);
  const canvas = await painter.createCanvas(config);
  let output = canvas.buffer;
  if (bg.mode === "image" && !document.canvasExtras?.customBg &&
    !document.canvasExtras?.gradientBg && !document.canvasExtras?.patternBg && !document.canvasExtras?.noiseBg)
    output = await painter.createImage(
      {
        source: localSource(bg.image),
        x: 0,
        y: 0,
        width: document.width,
        height: document.height,
        fit: bg.fit ?? "cover",
        ...(bg.align===undefined?{}:{align:bg.align}),
        ...(bg.opacity===undefined?{}:{opacity:bg.opacity}),
        ...(bg.blur===undefined?{}:{blur:bg.blur}),
      },
      output,
    );
  const visibleLayers=document.layers.filter(l=>l.visible);
  for(let index=0; index<visibleLayers.length; index++){
    const layer=visibleLayers[index];
    checkCancelled();
    if (layer.kind === "text") {
      const {texts,options}=textArguments(layer);
      output = options ? await painter.createText(texts,output,options) : await painter.createText(texts,output);
    } else if (layer.kind === "chart") {
      const chart = await painter.createChart(
        layer.chartType,
        layer.values.map((value, i) => ({
          value,
          label: layer.labels[i],
          color: layer.colors[i],
          ...(layer.chartType === "bar" ? { xStart: i, xEnd: i + 1 } : {}),
        })),
        { dimensions: { width: layer.width, height: layer.height } },
      );
      output = await painter.createImage(
        {
          source: chart,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          rotation: layer.rotation,
          opacity: layer.opacity,
        },
        output,
      );
    } else {
      const group=layer.imageGroupId?document.imageGroups?.find(g=>g.id===layer.imageGroupId):undefined;
      const members:[typeof layer,...typeof layer[]]=[layer];
      if(group){
        while(index+1<visibleLayers.length && visibleLayers[index+1].imageGroupId===group.id &&
          (visibleLayers[index+1].kind==='image'||visibleLayers[index+1].kind==='shape')){
          members.push(visibleLayers[++index] as typeof layer);
        }
      }
      const images=members.map(item=>imageArguments(item,document,artwork));
      output=group
        ?await painter.createImage(images,output,{isGrouped:true,groupTransform:groupArguments(group.transform,document,artwork)})
        :await painter.createImage(images[0],output);
    }
  }
  checkCancelled();
  return output;
}
