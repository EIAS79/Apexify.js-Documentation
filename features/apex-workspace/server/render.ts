import "server-only";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import {
  ApexPainter,
  type ImageProperties,
  type CanvasConfig,
} from "apexify.js";
import { validateDocument, orderedLayers } from "../model";

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
  const painter = new ApexPainter({ type: "buffer" });
  // Literal read gives Next's file tracer the bundled artwork dependency.
  const artwork = await readFile(
    resolve(process.cwd(), "public/workspace/assets/crystal-lake.webp"),
  );
  const localSource = (source: string) =>
    source === "/workspace/assets/crystal-lake.webp"
      ? artwork
      : Buffer.from(source.slice(source.indexOf(",") + 1), "base64");
  const bg = document.background;
  const config: CanvasConfig = {
    width: document.width,
    height: document.height,
    ...(bg.mode === "image"
      ? { transparentBase: true }
      : bg.mode === "gradient"
        ? {
            gradientBg: {
              type: "linear" as const,
              endX: document.width,
              colors: [
                { stop: 0, color: bg.startColor },
                { stop: 1, color: bg.endColor },
              ],
            },
          }
        : bg.transparent
          ? { transparentBase: true }
          : { colorBg: bg.color }),
  };
  const canvas = await painter.createCanvas(config);
  let output = canvas.buffer;
  if (bg.mode === "image")
    output = await painter.createImage(
      {
        source: localSource(bg.image),
        x: 0,
        y: 0,
        width: document.width,
        height: document.height,
        fit: "cover",
      },
      output,
    );
  for (const layer of orderedLayers(document).filter((l) => l.visible)) {
    checkCancelled();
    if (layer.kind === "text") {
      output = await painter.createText(
        {
          text: layer.text,
          x: layer.x,
          y: layer.y,
          font: {
            family: "DejaVu Sans",
            size: layer.fontSize,
            weight: layer.weight,
          },
          fill: { color: layer.color, opacity: layer.opacity },
          placement: { textBaseline: "top", rotation: layer.rotation },
        },
        output,
      );
    } else if (layer.kind === "path") {
      const commands: import("apexify.js").PathCommand[] = layer.points.map((p,i)=>({ type: i ? "lineTo" : "moveTo", x:p.x*layer.width/100, y:p.y*layer.height/100 }));
      if(layer.closed) commands.push({type:"closePath"});
      output = await painter.path2d.draw(output, commands, { opacity: layer.opacity, transform: {translateX:layer.x,translateY:layer.y,rotate:layer.rotation}, stroke: {color:layer.strokeColor,width:layer.strokeWidth}, ...(layer.closed ? {fill:{color:layer.color}} : {}) });
    } else if (layer.kind === "component") {
      const parts = layer.component === "badge" ? painter.components.badge.toLayers({text:layer.text,x:0,y:0,color:layer.color,background:layer.background})
        : layer.component === "progressBar" ? painter.components.progressBar.toLayers({x:0,y:0,width:layer.width,height:layer.height,value:layer.value,fill:layer.color,background:layer.background,showLabel:true})
        : layer.component === "avatar" ? painter.components.avatar.toLayers({x:0,y:0,size:Math.min(layer.width,layer.height),source:localSource(layer.source)})
        : layer.component === "watermark" ? painter.components.watermark.toLayers({text:layer.text,canvasWidth:layer.width,canvasHeight:layer.height,position:"center",color:layer.color,margin:0,fontSize:20})
        : painter.components.card.toLayers({x:0,y:0,width:layer.width,height:layer.height,title:layer.text,body:layer.body,titleColor:layer.color,background:layer.background});
      const component = await painter.renderScene({width:layer.width,height:layer.height,background:{transparentBase:true},layers:parts});
      output = await painter.createImage({source:component,x:layer.x,y:layer.y,width:layer.width,height:layer.height,opacity:layer.opacity,rotation:layer.rotation},output);
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
      const image: ImageProperties = {
        source:
          layer.kind === "image" ? localSource(layer.source) : layer.shape,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        rotation: layer.rotation,
        opacity: layer.opacity,
        ...(layer.kind === "image"
          ? { fit: "cover" as const }
          : {
              shape: { fill: true, color: layer.color },
              borderRadius: layer.radius,
              stroke: {
                color: layer.strokeColor,
                width: layer.strokeWidth,
                borderRadius: layer.radius,
              },
            }),
      };
      output = await painter.createImage(image, output);
    }
  }
  checkCancelled();
  return output;
}
