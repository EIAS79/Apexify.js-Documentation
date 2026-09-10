import type { ApiStability, RuntimeTarget } from './schema';

export const CURRENT_NODE_RUNTIME: RuntimeTarget[] = ['node22','node24','node26'];

export interface Doc4SemanticMetadata {
  symbols: Record<string, {
    summary?: string;
    stability?: ApiStability;
    since?: string;
    related?: string[];
    examples?: Array<{ id: string; href: string; label: string }>;
  }>;
  options: Record<string, {
    description: string;
    defaultState?: 'none' | 'explicit' | 'runtime' | 'derived';
    defaultValue?: unknown;
    animatable?: boolean;
  }>;
  memberSemantics: Record<string, {
    errors?: Array<{ className: string; code?: string; condition: string; resolution: string; recoverability?: string }>;
    limits?: Array<{ name: string; value: string | number; unit?: string; context: string; sourcePath: string }>;
    related?: string[];
    examples?: Array<{ id: string; href: string; label: string }>;
  }>;
}

export const DOC4_METADATA: Doc4SemanticMetadata = {
  symbols: {
    'apexify.js::ApexPainter': {
      summary: 'Primary server-side rendering and media façade for the current Apexify.js package.',
    },
    'apexify.js::ApexPainter#createImage': {
      summary: 'Draw one or more image/shape layers onto an existing canvas buffer.',
      related: ['apexify.js::ApexPainter#createCanvas','apexify.js::ApexPainter#createText','apexify.js::ApexPainter#prepareForRender'],
      examples: [{id:'image-basic',href:'/docs/node/images-shapes',label:'Images & Shapes guide'}],
    },
  },
  options: {
    'apexify.js::ApexPainter#createImage::images.source': {description:'Image source, Buffer, or declared shape kind to draw.'},
    'apexify.js::ApexPainter#createImage::images.x': {description:'Destination x coordinate in canvas pixels.'},
    'apexify.js::ApexPainter#createImage::images.y': {description:'Destination y coordinate in canvas pixels.'},
    'apexify.js::ApexPainter#createImage::images.width': {description:'Optional destination width; validated against runtime canvas limits.'},
    'apexify.js::ApexPainter#createImage::images.height': {description:'Optional destination height; validated against runtime canvas limits.'},
    'apexify.js::ApexPainter#createImage::images.inherit': {description:'Preserve source sizing behavior when supported by image composition.'},
    'apexify.js::ApexPainter#createImage::images.fit': {description:'How source content fits the destination box.',defaultState:'explicit',defaultValue:'fill'},
    'apexify.js::ApexPainter#createImage::images.align': {description:'Alignment used when fitted source dimensions do not exactly match the destination box.',defaultState:'explicit',defaultValue:'center'},
    'apexify.js::ApexPainter#createImage::images.rotation': {description:'Rotation applied to the layer.'},
    'apexify.js::ApexPainter#createImage::images.opacity': {description:'Layer opacity.'},
    'apexify.js::ApexPainter#createImage::images.blur': {description:'Layer blur amount.'},
    'apexify.js::ApexPainter#createImage::images.blendMode': {description:'Canvas composite operation used for the layer.'},
    'apexify.js::ApexPainter#createImage::images.borderRadius': {description:'Layer clipping radius or circular clipping mode.'},
    'apexify.js::ApexPainter#createImage::images.borderPosition': {description:'Border/corner positioning hint used by rounded rendering helpers.'},
    'apexify.js::ApexPainter#createImage::images.filters': {description:'Ordered image-filter operations applied to the layer.'},
    'apexify.js::ApexPainter#createImage::images.filterIntensity': {description:'Shared filter intensity value where supported by the selected filter.'},
    'apexify.js::ApexPainter#createImage::images.filterOrder': {description:'Whether filters are applied before or after other image processing stages.'},
    'apexify.js::ApexPainter#createImage::images.mask': {description:'Optional alpha/luminance mask configuration.'},
    'apexify.js::ApexPainter#createImage::images.mask.source': {description:'Image source used as the mask.'},
    'apexify.js::ApexPainter#createImage::images.mask.mode': {description:'Mask interpretation mode.',defaultState:'explicit',defaultValue:'alpha'},
    'apexify.js::ApexPainter#createImage::images.clipPath': {description:'Polygon points used to clip the layer.'},
    'apexify.js::ApexPainter#createImage::images.distortion': {description:'Optional perspective/warp/bulge/pinch distortion configuration.'},
    'apexify.js::ApexPainter#createImage::images.distortion.type': {description:'Distortion algorithm.'},
    'apexify.js::ApexPainter#createImage::images.distortion.points': {description:'Control points used by distortion modes that require them.'},
    'apexify.js::ApexPainter#createImage::images.distortion.intensity': {description:'Distortion strength where supported.'},
    'apexify.js::ApexPainter#createImage::images.meshWarp': {description:'Mesh-warp grid and control-point configuration.'},
    'apexify.js::ApexPainter#createImage::images.meshWarp.gridX': {description:'Horizontal mesh grid subdivision count.'},
    'apexify.js::ApexPainter#createImage::images.meshWarp.gridY': {description:'Vertical mesh grid subdivision count.'},
    'apexify.js::ApexPainter#createImage::images.meshWarp.controlPoints': {description:'Nested mesh control-point grid.'},
    'apexify.js::ApexPainter#createImage::images.effects': {description:'Optional post-processing visual effects.'},
    'apexify.js::ApexPainter#createImage::images.effects.vignette': {description:'Vignette effect settings.'},
    'apexify.js::ApexPainter#createImage::images.effects.vignette.intensity': {description:'Vignette intensity.'},
    'apexify.js::ApexPainter#createImage::images.effects.vignette.size': {description:'Vignette size.'},
    'apexify.js::ApexPainter#createImage::images.effects.lensFlare': {description:'Lens-flare effect settings.'},
    'apexify.js::ApexPainter#createImage::images.effects.lensFlare.x': {description:'Lens-flare x coordinate.'},
    'apexify.js::ApexPainter#createImage::images.effects.lensFlare.y': {description:'Lens-flare y coordinate.'},
    'apexify.js::ApexPainter#createImage::images.effects.lensFlare.intensity': {description:'Lens-flare intensity.'},
    'apexify.js::ApexPainter#createImage::images.effects.chromaticAberration': {description:'Chromatic-aberration effect settings.'},
    'apexify.js::ApexPainter#createImage::images.effects.chromaticAberration.intensity': {description:'Chromatic-aberration intensity.'},
    'apexify.js::ApexPainter#createImage::images.effects.filmGrain': {description:'Film-grain effect settings.'},
    'apexify.js::ApexPainter#createImage::images.effects.filmGrain.intensity': {description:'Film-grain intensity.'},
    'apexify.js::ApexPainter#createImage::images.shape': {description:'Shape-specific fill/geometry configuration when source is a declared ShapeType.'},
    'apexify.js::ApexPainter#createImage::images.shadow': {description:'Shadow configuration for the image or shape layer.'},
    'apexify.js::ApexPainter#createImage::images.stroke': {description:'Stroke configuration for the image or shape layer.'},
    'apexify.js::ApexPainter#createImage::images.boxBackground': {description:'Optional background fill behind the layer box.'},
    'apexify.js::ApexPainter#createImage::options.isGrouped': {description:'Treat multiple image layers as a transformable group.'},
    'apexify.js::ApexPainter#createImage::options.groupTransform': {description:'Transform/effect configuration applied to a grouped image set.'},
    'apexify.js::ApexPainter#createImage::painterOpts.resolveAssetRefs': {description:'Resolve named Apexify asset references before rendering.',defaultState:'explicit',defaultValue:false},
  },
  memberSemantics: {
    'apexify.js::ApexPainter#createImage': {
      errors: [
        {className:'ApexifyInputError',condition:'Required source/x/y data is absent, the image list is empty, or validated image options are invalid.',resolution:'Provide the required fields and values accepted by the published declaration/validators.',recoverability:'Correct input and retry.'},
        {className:'ApexifyDecodeError',condition:'A supplied image source cannot be decoded as supported image data.',resolution:'Use a supported, decodable image source within configured limits.',recoverability:'Replace/fix source and retry.'},
        {className:'ApexifyResourceLimitError',condition:'Image dimensions, source bytes, decoded pixels/frames, filters, or collection work exceed active RenderLimits.',resolution:'Reduce the workload or explicitly configure safe process-wide RenderLimits.',recoverability:'Reduce input or adjust policy, then retry.'},
      ],
      limits: [
        {name:'maxCanvasDimension',value:16384,unit:'px',context:'Bounds configured image width/height and decoded image dimensions.',sourcePath:'lib-next/runtime/config.ts'},
        {name:'maxCollectionItems',value:2048,unit:'items',context:'Bounds image/shape collection work.',sourcePath:'lib-next/runtime/config.ts'},
        {name:'maxFiltersPerOperation',value:64,unit:'filters',context:'Bounds filters applied in one image operation.',sourcePath:'lib-next/runtime/config.ts'},
        {name:'maxImageSourceBytes',value:67108864,unit:'bytes',context:'Bounds accepted image source bytes.',sourcePath:'lib-next/runtime/config.ts'},
        {name:'maxDecodedImagePixels',value:67108864,unit:'pixels',context:'Bounds decoded image pixel count.',sourcePath:'lib-next/runtime/config.ts'},
        {name:'maxDecodedImageFrames',value:128,unit:'frames',context:'Bounds decoded image frame count.',sourcePath:'lib-next/runtime/config.ts'},
      ],
      related:['apexify.js::ApexPainter#createCanvas','apexify.js::ApexPainter#createText','apexify.js::ApexPainter#prepareForRender'],
      examples:[{id:'image-basic',href:'/docs/node/images-shapes',label:'Images & Shapes guide'}],
    },
  },
};
