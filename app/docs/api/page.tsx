import { redirect } from 'next/navigation';

export default function LegacyApiReferenceRedirect() {
  redirect('/docs#api-reference');
}
