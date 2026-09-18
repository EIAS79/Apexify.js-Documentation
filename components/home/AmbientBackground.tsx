export default function AmbientBackground() {
  return (
    <div aria-hidden className="apx-engine-backdrop">
      <div className="apx-engine-backdrop__grid" />
      <div className="apx-engine-backdrop__frame" />
      <div className="apx-engine-backdrop__axis apx-engine-backdrop__axis--x" />
      <div className="apx-engine-backdrop__axis apx-engine-backdrop__axis--y" />
    </div>
  );
}
