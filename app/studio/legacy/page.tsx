import { redirect } from 'next/navigation';

export default function LegacyStudioIndex() {
  redirect('/studio/legacy/code');
}
