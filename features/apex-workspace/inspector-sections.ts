export type LayerInspectorSection = 'primary' | 'layout' | 'appearance' | 'advanced';
export const TEXT_INSPECTOR_SECTIONS = [
  ['primary','Content','Write text and choose the base font. Font overrides take priority over the base controls.'],
  ['layout','Layout','Position the layer, then adjust text alignment, spacing, wrapping and transforms.'],
  ['appearance','Appearance','Style text with fill, outlines, decorations, highlights, glow and shadows.'],
  ['advanced','Advanced','Curve text, arrange multiple runs, apply group transforms and measure native text bounds.'],
] as const;
export const IMAGE_INSPECTOR_SECTIONS = [
  ['primary','Source','Choose an image and control how it fits and aligns inside its layer.'],
  ['layout','Layout','Position and resize the layer, rotate it, set opacity and round selected corners.'],
  ['appearance','Effects','Adjust compositing, blur, outlines, shadows, ordered filters and photographic effects.'],
  ['advanced','Advanced','Mask and clip an image, edit distortion or mesh geometry, and manage image groups.'],
] as const;
/** Every supported text-property family belongs to exactly one inspector section. */
export const TEXT_PROPERTY_SECTIONS:Record<string,LayerInspectorSection> = {
  font:'primary',layout:'layout',placement:'layout',decorations:'appearance',effects:'appearance',
  fill:'appearance',stroke:'appearance',textOnCurve:'advanced',includeCharMetrics:'advanced',measurementCanvas:'advanced',
};
export const TEXT_PROPERTY_LABELS:Record<string,string> = {
  font:'Font overrides',layout:'Spacing & wrapping',placement:'Alignment & transforms',decorations:'Text decorations',
  effects:'Highlight, glow & shadow',fill:'Text fill',stroke:'Text outline',textOnCurve:'Text on a curve',
  includeCharMetrics:'Character measurements',measurementCanvas:'Measurement area',
};
