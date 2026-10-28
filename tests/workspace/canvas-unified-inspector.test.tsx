import test from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import CanvasOptionsEditor from "../../features/apex-workspace/components/CanvasOptionsEditor";
import {GradientControls} from "../../features/apex-workspace/components/CanvasNestedControls";
import type {CanvasGradient,CanvasExtras} from "../../features/apex-workspace/canvas-options";

const gradient:CanvasGradient={
  type:"linear",endX:160,colors:[{stop:0,color:"#221160"},{stop:0.5,color:"#ffffff"},{stop:1,color:"#006ca8"}],
};
const props={
  assets:[],
  canvasWidth:160,
  canvasHeight:112,
  onChange:(_value:CanvasExtras)=>{},
  onAsset:()=>{},
  onError:(_error:string)=>{},
};
const show=(focus:"gradient"|"image"|"layout"|"effects"|"advanced"|"layers"|"overlays",value:CanvasExtras={})=>
  renderToStaticMarkup(createElement(CanvasOptionsEditor,{...props,focus,value,legacyGradientColors:{start:"#f7d5ff",end:"#006ca8"}}));

test("root gradient renders one focused Stops surface, not basic and advanced duplicates",()=>{
  const html=show("gradient",{gradientBg:gradient});
  assert.match(html,/Gradient editor sections/);
  assert.match(html,/Colors &amp; stops/);
  assert.match(html,/Root stop 1/);
  assert.match(html,/Root stop 2/);
  assert.match(html,/Root stop 3/);
  assert.doesNotMatch(html,/Advanced gradients/);
  assert.doesNotMatch(html,/Root start X/);
  assert.doesNotMatch(html,/Canvas opacity/);
  assert.doesNotMatch(html,/Background layers/);
});
test("legacy two-color gradient is displayed from fallback without a second editor",()=>{
  const html=show("gradient");
  assert.match(html,/#f7d5ff/);
  assert.match(html,/Root stop 1/);
  assert.doesNotMatch(html,/Root end X/);
});
test("specialized scopes never expose unrelated Canvas fields",()=>{
  assert.match(show("layout"),/Canvas X/);
  assert.doesNotMatch(show("layout"),/Canvas opacity/);
  assert.match(show("effects"),/Canvas opacity/);
  assert.doesNotMatch(show("effects"),/Root stop 1/);
  assert.match(show("advanced",{rotation:11}),/Resolved Canvas options/);
  assert.doesNotMatch(show("advanced",{rotation:11}),/Canvas root blend mode/);
  assert.match(show("overlays"),/Pattern &amp; noise/);
  assert.doesNotMatch(show("overlays"),/Gradient editor sections/);
  assert.match(show("layers"),/Background layers/);
  assert.doesNotMatch(show("layers"),/Canvas opacity/);
});
test("image source section does not duplicate main image fit/align/opacity controls",()=>{
  const html=show("image",{customBg:{source:"asset:"+"a".repeat(64),fit:"cover",align:"center",opacity:0.5}});
  assert.match(html,/Imported image intrinsic dimensions/);
  assert.doesNotMatch(html,/Imported background fit/);
  assert.doesNotMatch(html,/Imported background alignment/);
  assert.doesNotMatch(html,/Canvas opacity/);
});
test("shared gradient primitive remains fully accessible outside the focused root editor",()=>{
  const html=renderToStaticMarkup(createElement(GradientControls,{id:"Layer 1",gradient,onChange:()=>{}}));
  assert.match(html,/Layer 1 stop 1/);
  assert.match(html,/Layer 1 start X/);
  assert.match(html,/Layer 1 gradient repeat/);
});
test("focused gradient Geometry shows variant and coordinates without stop duplication",()=>{
  const html=renderToStaticMarkup(createElement(GradientControls,{id:"Root",gradient,onChange:()=>{},section:"geometry"}));
  assert.match(html,/Root gradient type/);
  assert.match(html,/Root start X/);
  assert.doesNotMatch(html,/Root stop 1/);
});
