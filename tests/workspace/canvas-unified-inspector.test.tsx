import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateCanvasExtras,validateCanvasGradient} from "../../features/apex-workspace/canvas-options";
import {createHeroDocument,validateDocument} from "../../features/apex-workspace/model";
import {generateSource,parseSource} from "../../features/apex-workspace/codegen";

const inspector=readFileSync("features/apex-workspace/components/Inspector.tsx","utf8");
const canvas=readFileSync("features/apex-workspace/components/CanvasOptionsEditor.tsx","utf8");
const gradients=readFileSync("features/apex-workspace/components/CanvasNestedControls.tsx","utf8");
const styles=readFileSync("features/apex-workspace/workspace.css","utf8");

test("Canvas has one gradient editor and no duplicate legacy Start/End form",()=>{
  assert.match(inspector,/baseMode === "gradient"/);
  assert.match(inspector,/Edit the gradient below/);
  assert.doesNotMatch(inspector,/label="Start"/);
  assert.doesNotMatch(inspector,/label="End"/);
  assert.doesNotMatch(canvas,/Advanced gradients/);
  assert.match(canvas,/Unified gradient editor/);
  assert.match(canvas,/Gradient editor sections/);
  assert.match(canvas,/section=\{focus==="all"\?"all":gradientView\}/);
});
test("Canvas tab and icon navigation assigns options to single editing scopes",()=>{
  for(const name of ["layout","background","effects","advanced"])assert.match(inspector,new RegExp('\\["'+name+'","'));
  for(const name of ["base","layers","overlays"])assert.match(inspector,new RegExp('id:"'+name+'"'));
  for(const name of ["stops","geometry","tiling","details"])assert.match(canvas,new RegExp('id:"'+name+'"'));
  assert.match(canvas,/focus==="effects"/);
  assert.match(canvas,/focus==="advanced"/);
  assert.doesNotMatch(inspector,/canvasCategory==="effects" && <div className="aw-field-row"/);
  assert.doesNotMatch(canvas,/Reset canvas effects and advanced options/);
  assert.match(inspector,/const baseMode=imageBg/);
  assert.match(canvas,/Reset all Canvas overrides/);
  assert.match(canvas,/Enable Canvas pattern/);
  assert.doesNotMatch(canvas,/<Field label="Pattern">/);
  assert.match(canvas,/<PatternControls id="Root"/);
});
test("focused gradient views still have all native controls",()=>{
  for(const name of ["stops","geometry","tiling","details"])assert.match(gradients,new RegExp('show\\("'+name+'"\\)'));
  for(const name of ["startX","endX","startRadius","endRadius","centerX","centerY","startAngle","pivotX","pivotY","rotate","repeat"])assert.match(gradients,new RegExp(name));
  assert.match(gradients,/gradient\.colors\.length>=12/);
});
test("legacy CSS cannot hide the reorganized Effects and Advanced tabs",()=>{
  assert.doesNotMatch(styles,/data-canvas-focus="effects"\\] > \\.aw-canvas-section:not/);
  assert.doesNotMatch(styles,/data-canvas-focus="advanced"\\] > \\.aw-canvas-section:not/);
  assert.match(canvas,/aria-label="Canvas-wide effects"/);
  assert.match(canvas,/Resolved Canvas options/);
});
test("advanced native gradient survives validation and Visual/Code round-trip",()=>{
  const base=createHeroDocument();
  const value=validateCanvasGradient({type:"linear",startX:4,endX:base.width,rotate:18,pivotX:30,pivotY:12,
    repeat:"reflect",colors:[{stop:0,color:"#221160"},{stop:0.5,color:"#f7d5ff"},{stop:1,color:"#006ca8"}]});
  const extras=validateCanvasExtras({...base.canvasExtras,gradientBg:value,customBg:undefined});
  const next=validateDocument({...base,background:{...base.background,mode:"gradient"},canvasExtras:extras});
  assert.deepEqual(parseSource(generateSource(next)),next);
  assert.deepEqual(next.canvasExtras?.gradientBg,value);
});
