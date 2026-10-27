/** Shared descriptions for Visual and Graph inspectors. Keep runtime keys intact. */
const descriptions: Record<string, string> = {
  x: 'Horizontal position in pixels. Larger values move right.',
  y: 'Vertical position in pixels. Larger values move down.',
  width: 'Horizontal size in output pixels. Canvas width sets the exported image size; layer width sets its selection box.',
  height: 'Vertical size in output pixels. Canvas height sets the exported image size; layer height sets its selection box.',
  name: 'A readable name used to identify this item in the layer list and saved project.',
  text: 'The text to draw. Line breaks create multiple lines. Additional text items use their own positions and styles.',
  font: 'Overrides the base font for this text. Enable only the properties you want to override.',
  family: 'Font family requested from the renderer. Use an installed font such as DejaVu Sans for predictable output.',
  size: 'Size of this effect or geometry in its native units. Font size is measured in pixels.',
  weight: 'Font thickness. 400 is regular, 700 is bold. The selected font must support the weight.',
  style: 'Selects the drawing style. Font styles choose normal, italic, or oblique text.',
  color: 'Paint color. Hex values select an exact color; text paint also accepts supported CSS color strings.',
  opacity: 'Transparency from 0 (invisible) to 1 (fully opaque).',
  rotation: 'Rotation in degrees. 0 keeps the original orientation.',
  blur: 'Softens edges. 0 disables blur; larger values spread pixels farther.',
  fit: 'Cover fills the box and may crop. Contain preserves the whole image and may leave space. Fill stretches to the box.',
  alignment: 'Positions the image inside its box after fitting. Visible when the image and box have different proportions.',
  align: 'Positions the image inside its box after fitting.',
  inherit: 'Uses the source image’s original pixel dimensions. Fit and alignment are ignored while enabled.',
  blendMode: 'Controls how this paint combines with pixels beneath it. Root canvas blends may have no visible effect without a destination.',
  borderRadius: 'Rounds corners in pixels. Circular uses the renderer’s circular radius mode.',
  borderPosition: 'Chooses which edges or corners receive the border treatment.',
  gradient: 'Blends colors across linear, radial, or conic geometry. Each stop places a color between 0 and 1.',
  type: 'Chooses the variant. Available controls change to match that variant.',
  colors: 'Ordered gradient color stops. Keep positions ascending from 0 to 1.',
  stop: 'Position along the gradient: 0 is the beginning and 1 is the end.',
  start: 'Color at the beginning of the background gradient.',
  end: 'Color at the end of the background gradient.',
  startX: 'Horizontal start position of the gradient in pixels.',
  startY: 'Vertical start position of the gradient in pixels.',
  endX: 'Horizontal end position of the gradient in pixels.',
  endY: 'Vertical end position of the gradient in pixels.',
  centerX: 'Horizontal center of this effect in pixels.',
  centerY: 'Vertical center of this effect in pixels.',
  startRadius: 'Radius of the gradient’s inner circle in pixels.',
  endRadius: 'Radius of the gradient’s outer circle in pixels.',
  pivotX: 'Horizontal pivot used for rotation or scaling.',
  pivotY: 'Vertical pivot used for rotation or scaling.',
  rotate: 'Rotates gradient geometry in degrees around its pivot.',
  repeat: 'Controls how the pattern or gradient repeats beyond its initial bounds.',
  scale: 'Zoom multiplier. 1 keeps the original size; 2 doubles it.',
  scaleX: 'Horizontal scale multiplier. 1 keeps the width; negative values mirror horizontally.',
  scaleY: 'Vertical scale multiplier. 1 keeps the height; negative values mirror vertically.',
  translateX: 'Moves the group horizontally in pixels after its local geometry is assembled.',
  translateY: 'Moves the group vertically in pixels after its local geometry is assembled.',
  skewX: 'Slants the text horizontally in degrees.',
  skewY: 'Slants the text vertically in degrees.',
  layout: 'Controls text spacing and wrapping constraints.',
  lineHeight: 'Distance between text baselines in pixels. Increase it to separate lines.',
  letterSpacing: 'Extra spacing between characters in pixels. Negative values tighten the text.',
  wordSpacing: 'Extra spacing between words in pixels.',
  maxWidth: 'Maximum text layout width in pixels, used for wrapping.',
  maxHeight: 'Maximum text layout height in pixels.',
  placement: 'Text alignment, baseline, rotation, scale, skew, and perspective overrides.',
  textAlign: 'Aligns text relative to its X anchor. Center and right shift the drawn text around that anchor.',
  textBaseline: 'Chooses which vertical part of the text is anchored at Y.',
  decorations: 'Adds bold, italic, underline, overline, or strikethrough styling.',
  underline: 'Draws a line beneath the text. Styled mode exposes color, gradient, and width.',
  overline: 'Draws a line above the text. Styled mode exposes its paint.',
  strikethrough: 'Draws a line through the text. Styled mode exposes its paint.',
  bold: 'Enables bold text using the available font face.',
  italic: 'Enables italic text using the available font face.',
  fill: 'Paints the interior of the text or shape. Gradient paint overrides a flat color where supported.',
  stroke: 'Draws an outline. Increase width to make the outline thicker.',
  shadow: 'Draws a shadow behind the item. Offset moves it; blur softens it.',
  offsetX: 'Horizontal shadow displacement in pixels.',
  offsetY: 'Vertical shadow displacement in pixels.',
  effects: 'Optional appearance effects. Enable an effect, then adjust its controls and inspect the rendered output.',
  highlight: 'Paints a highlight behind the text.',
  glow: 'Adds a soft halo around the text.',
  intensity: 'Strength of the selected effect. Larger values make its contribution stronger.',
  textOnCurve: 'Lays text along an arc. Sweep angle must be greater than 0 and less than 360 degrees.',
  sweepAngle: 'Angular span of the text arc in degrees; strictly between 0 and 360.',
  radius: 'Radius of the arc, rounded corner, or effect region in pixels.',
  up: 'Changes the direction of the text arc.',
  layoutMode: 'Chooses how curved text fits the arc: clamp, fit, or override.',
  baselineOffset: 'Moves text away from the curve baseline in pixels.',
  startAngleDeg: 'Starting angle of the text arc in degrees.',
  startAngle: 'Starting angle for the selected geometry in degrees.',
  endAngle: 'Ending angle for the selected geometry in degrees.',
  includeCharMetrics: 'Includes per-character positions in the measurement result. Use Measure text to inspect them.',
  measurementCanvas: 'Canvas dimensions used by native text measurement.',
  perspective: 'Maps the item to four destination corners: top-left, top-right, bottom-right, bottom-left.',
  points: 'Editable geometry points in pixels. Their order determines the outline or corner mapping.',
  interpolation: 'Resampling method. Nearest gives hard pixels; bilinear and bicubic smooth the result.',
  edgeMode: 'How pixels outside the source are sampled: transparent, clamp, wrap, or mirror.',
  isGrouped: 'Combines the text array before applying group transforms.',
  groupTransform: 'Transforms the combined group. Enable grouping before setting this option.',
  filters: 'Filters run in list order. Reordering can change the result.',
  filterOrder: 'Applies filters before (pre) or after (post) the image composition stage.',
  filterIntensity: 'Multiplier for the image filter pipeline.',
  mask: 'Uses an imported image to control visibility. Alpha reads transparency; luminance reads brightness; inverse reverses the mask.',
  clipPath: 'Keeps only pixels inside an ordered polygon.',
  distortion: 'Deforms image pixels with bulge, pinch, twirl, wave, perspective, or warp geometry.',
  meshWarp: 'Deforms the image through a grid of editable vertices in layer-local coordinates.',
  gridX: 'Number of horizontal mesh cells. Changing the grid rebuilds its vertices.',
  gridY: 'Number of vertical mesh cells. Changing the grid rebuilds its vertices.',
  strength: 'Amount of displacement applied by the warp handle.',
  falloff: 'How a warp handle’s influence fades toward its radius.',
  boxBackground: 'Adds background paint behind the item’s box.',
  vignette: 'Darkens the image edges around a central region.',
  lensFlare: 'Adds a light flare at the chosen X and Y position.',
  chromaticAberration: 'Offsets color channels to create colored edge fringing.',
  filmGrain: 'Adds grain texture to the image.',
  pattern: 'Repeats procedural geometry or an imported tile across the canvas.',
  noise: 'Adds a noise texture to the canvas.',
  spacing: 'Distance between repeated pattern elements in pixels.',
  transparentBase: 'Removes the solid base color. Available for color backgrounds; use PNG to preserve transparency.',
};

export function readableLabel(label: string): string {
  return label.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
}

const descriptionEntries = Object.entries(descriptions).sort(([a], [b]) => b.length - a.length);
export function controlHelp(label: string): string {
  if (descriptions[label]) return descriptions[label];
  const normalized = label.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (/stroke.*width/.test(normalized)) return 'Outline thickness in pixels. 0 removes the visible outline.';
  if (/(underline|overline|strikethrough).*width/.test(normalized)) return 'Thickness of the decoration line in pixels.';
  if (/stroke.*style/.test(normalized)) return 'Chooses a solid, dashed, dotted, groove, ridge, or double outline.';
  if (/stroke.*position$/.test(normalized)) return 'Offsets the outline relative to the shape boundary in pixels.';
  if (/font.*size/.test(normalized)) return 'Font size in output pixels. Larger values make the text taller and wider.';
  if (/roundedcorners/.test(normalized)) return 'Chooses which corners are rounded. A positive or circular border radius is needed for visible rounding.';
  if (/radiusmode/.test(normalized)) return 'Choose a numeric radius in pixels, a circular radius, or the owning item’s radius where inheritance is available.';
  if (/filterorder(ing)?$/.test(normalized)) return descriptions.filterOrder;
  if (/font.*style/.test(normalized)) return 'Selects normal, italic, or oblique text from the available font face.';
  if (/pattern.*spacing/.test(normalized)) return descriptions.spacing;
  const match = descriptionEntries.find(([key]) => normalized.endsWith(key.toLowerCase()) && key.length > 2);
  if (match) return match[1];
  if (/\b(x|y)\b/i.test(label)) return /\bx\b/i.test(label) ? descriptions.x : descriptions.y;
  if (/import|source|asset/i.test(label)) return 'Choose an imported PNG, JPEG, or WebP image. Uploaded images are included in the saved project.';
  if (/composit|blend/i.test(label)) return descriptions.blendMode;
  if (/intrinsic/i.test(label)) return descriptions.inherit;
  if (/filter/i.test(label)) return descriptions.filters;
  if (/clip/i.test(label)) return descriptions.clipPath;
  if (/warp|mesh/i.test(label)) return descriptions.meshWarp;
  if (/gradient/i.test(label)) return descriptions.gradient;
  if (/font/i.test(label)) return descriptions.font;
  if (/text array/i.test(label)) return 'Adds independently positioned text runs. Each run can override font, paint, and layout. Grouping applies a shared transform.';
  if (/group/i.test(label)) return descriptions.groupTransform;
  return `Sets ${readableLabel(label).toLowerCase()} for the selected item. Changes update the generated code; render to inspect the output.`;
}
