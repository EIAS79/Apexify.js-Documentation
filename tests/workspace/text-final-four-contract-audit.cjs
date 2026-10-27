const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),parse=f=>JSON.parse(read(f));
const esm='node_modules/apexify.js/dist/esm/index.js',typ='node_modules/apexify.js/dist/declarations/types/text.d.ts';
const compiled=read(esm),types=read(typ),lock=parse('package-lock.json'),pkg=parse('package.json');
const expected='379a5248f09ed39c1b1734fe104b6bd73a77857f';
assert.ok(pkg.dependencies['apexify.js'].endsWith('#'+expected));
const resolved=lock.packages['node_modules/apexify.js'].resolved;assert.ok(resolved.endsWith('#'+expected));
const requireSource=(needle)=>{const off=compiled.indexOf(needle);assert.ok(off>=0,'Missing pinned engine implementation '+needle);return compiled.slice(0,off).split('\n').length};
const lines={
  resolveTextFontIdentity:requireSource('function resolveTextFontIdentity(textProps)'),
  namePrecedence:requireSource('const explicitName = textProps.font?.name ?? textProps.fontName;'),
  familyPrecedence:requireSource('const family = textProps.font?.family ?? textProps.fontFamily;'),
  nameOverridesFamily:requireSource('return { family: explicitName ?? family ?? "Arial" };'),
  registerTextFontFromPath:requireSource('async function registerTextFontFromPath(fontPath, fontName)'),
  registeredCanvasFont:requireSource('GlobalFonts.registerFromPath(fullPath, fontName)'),
  setupTextFont:requireSource('function setupTextFont(ctx, textProps)'),
  nativeOptionalMetric:requireSource('function optionalMetric(native, key)'),
  finiteMetricGuard:requireSource('return typeof value === "number" && Number.isFinite(value) ? value : void 0;'),
  optionalMetricCopy:requireSource('for (const key of ["alphabeticBaseline", "emHeightAscent", "emHeightDescent", "hangingBaseline", "ideographicBaseline"])')
};
for(const name of ['hangingBaseline','ideographicBaseline'])assert.ok(types.includes(name+'?: number;'),name+' must be optional');
const native=parse('evidence/workspace-text/strict/final-four/font-native-registration-and-optional-metrics.json');
for(const name of ['hangingBaseline','ideographicBaseline'])assert.equal(native.underlyingCanvasOptionalMetrics[name].present,false);
const report={
 pin:expected,packageDependency:pkg.dependencies['apexify.js'],lockResolved:resolved,
 engineSource:{file:esm,sha256:sha(Buffer.from(compiled)),lineNumbers:lines},
 engineDeclaration:{file:typ,sha256:sha(Buffer.from(types)),optionalNumeric:['hangingBaseline','ideographicBaseline']},
 fontContract:'font.name overrides font.family; if neither requested uses Arial; trusted backend may register fonts through GlobalFonts.registerFromPath',
 security:'No browser font.path authoring or arbitrary local filesystem path acceptance introduced',
 metricsContract:'Engine copies each baseline only if underlying @napi-rs/canvas ctx.measureText property is a finite number; otherwise omits it',
 observedPinnedCanvasMetrics:native.underlyingCanvasOptionalMetrics,
 optionalBaselineRecommendation:{hangingBaseline:'PARTIAL - COMPLIANT_OPTIONAL_ABSENCE; upstream only if requirement changes',ideographicBaseline:'PARTIAL - COMPLIANT_OPTIONAL_ABSENCE; upstream only if requirement changes'},
 dependencies:'Arial and Courier New installed or deterministically registered on render host; font availability must be checked on other hosts'
};
fs.writeFileSync(path.join(root,'evidence/workspace-text/strict/final-four/engine-contract-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
