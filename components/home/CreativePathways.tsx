import Link from 'next/link';

export default function CreativePathways() {
  return (
    <section className="creative-pathways" aria-labelledby="creative-pathways-title">
      <div className="apx-home-shell">
        <div className="creative-pathways__intro"><p className="apx-kicker">LESS FRICTION. MORE MAKING.</p><h2 id="creative-pathways-title">Find your<br /><em>way in.</em></h2><p>Some ideas start with a line of code.<br />Others need room to play.</p></div>
        <div className="creative-pathways__links">
          <Link href="/studio" className="creative-pathway"><span className="creative-pathway__number">01 / THE WORKSHOP</span><h3>Think with your eyes.<span aria-hidden>↗</span></h3><p>Arrange a composition in Studio. Explore the visual tools and inspect the code behind your canvas.</p><span className="creative-pathway__cta">Enter Studio <span aria-hidden>→</span></span></Link>
          <Link href="/docs/getting-started" className="creative-pathway"><span className="creative-pathway__number">02 / THE FIELD GUIDE</span><h3>Make your first mark.<span aria-hidden>↗</span></h3><p>Install the package, meet the primitives, and turn a small script into your first rendered image.</p><span className="creative-pathway__cta">Start learning <span aria-hidden>→</span></span></Link>
          <Link href="/gallery" className="creative-pathway"><span className="creative-pathway__number">03 / THE COLLECTION</span><h3>Borrow a spark.<span aria-hidden>↗</span></h3><p>Discover finished output, explore the recipes, and find a starting point for something entirely yours.</p><span className="creative-pathway__cta">Explore the Gallery <span aria-hidden>→</span></span></Link>
        </div>
      </div>
    </section>
  );
}
