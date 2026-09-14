import type { Metadata } from 'next';
import { FutureReadinessFixture } from '@/components/docs/future/FutureReadinessFixture';

export const metadata: Metadata = {
  title: 'DOC-10 Future Readiness Fixture | TEST-ONLY',
  description: 'Internal DOC-10 architecture fixture. Not current Apexify.js product documentation.',
  robots: { index: false, follow: false, nocache: true },
};

export default function FutureReadinessFixturePage() {
  return <FutureReadinessFixture />;
}
