const explicit = process.argv.find((arg) => arg.startsWith('--branch='));
const branch = explicit?.slice('--branch='.length) || process.env.VERCEL_GIT_COMMIT_REF || '';

if (!branch) {
  console.log('[studio-visual] branch metadata unavailable; continuing Vercel build');
  process.exit(1);
}

if (branch.startsWith('studio-visual/')) {
  console.log('[studio-visual] skipping Vercel deployment for ' + branch);
  process.exit(0);
}

console.log('[studio-visual] allowing Vercel deployment for ' + branch);
process.exit(1);
