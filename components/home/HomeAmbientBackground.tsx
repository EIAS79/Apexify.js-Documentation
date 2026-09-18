export default function HomeAmbientBackground() {
  return (
    <div aria-hidden className="apx-home-backdrop">
      <div className="apx-home-backdrop__grid" />
      <div className="apx-home-backdrop__frame" />
      <div className="apx-home-backdrop__axis apx-home-backdrop__axis--x" />
      <div className="apx-home-backdrop__axis apx-home-backdrop__axis--y" />
    </div>
  );
}
