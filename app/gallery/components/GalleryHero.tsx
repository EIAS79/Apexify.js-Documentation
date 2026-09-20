import {
  CheckBadgeIcon,
  FilmIcon,
  RectangleGroupIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';

type Counts = {
  total: number;
  featured: number;
  videos: number;
  gifs: number;
  verified: number;
};

export default function GalleryHero({ counts, version }: { counts: Counts; version: string | null }) {
  return (
    <section className="apx-gallery-hero">
      <div className="apx-gallery-shell">
        <div className="apx-gallery-hero__copy">
          <div className="apx-gallery-hero__eyebrow">
            <span>OUTPUT LIBRARY</span>
            <span>{version ? `APEXIFY.JS ${version}` : 'CURRENT PACKAGE'}</span>
          </div>

          <h1>
            Browse the <em>visual system.</em>
          </h1>

          <p>
            Real Apexify.js output across composition, imagery, typography, data, motion,
            surfaces, and advanced rendering. Peak Lab pieces pair generated artifacts with
            their exact recipe source; the two cinematic Peak Showcases are finished work.
          </p>

          <div className="apx-gallery-hero__signals">
            <span><CheckBadgeIcon /> {counts.total - counts.verified} peak showcases</span>
            <span><RectangleGroupIcon /> {counts.total} total pieces</span>
            <span><ServerStackIcon /> Node runtime</span>
            <span><FilmIcon /> {counts.gifs + counts.videos} motion pieces</span>
          </div>
        </div>

        <div className="apx-gallery-hero__index" aria-label="Gallery index">
          <div className="apx-gallery-hero__index-head">
            <span>LIBRARY INDEX</span>
            <span>CURATED / SEARCHABLE</span>
          </div>
          <div className="apx-gallery-hero__index-grid">
            <div><strong>{counts.total}</strong><span>pieces</span></div>
            <div><strong>{counts.total - counts.verified}</strong><span>curated</span></div>
            <div><strong>{counts.featured}</strong><span>featured</span></div>
            <div><strong>{counts.gifs + counts.videos}</strong><span>motion</span></div>
          </div>
          <div className="apx-gallery-hero__index-note">
            <span>01</span>
            <p>Use visual lenses to browse by what the output <em>does</em>, not by internal implementation buckets.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
