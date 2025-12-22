'use client';

import { useState } from 'react';
import { CodeBlock } from './CodeBlock';

interface CodeSwitcherProps {
  ts?: string;
  js?: string;
  tsLabel?: string;
  jsLabel?: string;
  children?: React.ReactNode;
}

export function CodeSwitcher({ 
  ts, 
  js, 
  tsLabel = 'TypeScript', 
  jsLabel = 'JavaScript',
  children 
}: CodeSwitcherProps) {
  let tsCode = ts;
  let jsCode = js;

  if (children && !ts && !js) {
    const childrenStr = typeof children === 'string' ? children : String(children);
    const tsMatch = childrenStr.match(/<ts>([\s\S]*?)<\/ts>/);
    const jsMatch = childrenStr.match(/<js>([\s\S]*?)<\/js>/);
    tsCode = tsMatch ? tsMatch[1].trim() : undefined;
    jsCode = jsMatch ? jsMatch[1].trim() : undefined;
  }

  const defaultActive = tsCode ? 'ts' : (jsCode ? 'js' : 'ts');
  const [active, setActive] = useState<'ts' | 'js'>(defaultActive);

  return (
    <div className="my-4">
      {/* Language switcher tabs */}
      <div className="flex gap-0 mb-0 bg-gray-800 dark:bg-gray-800 border border-gray-700 dark:border-gray-700 border-b-0 rounded-t-lg p-1 transition-colors duration-300">
        <button
          onClick={() => setActive('ts')}
          disabled={!tsCode}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            active === 'ts'
              ? 'bg-gray-700 dark:bg-gray-700 text-green-400 shadow-sm'
              : tsCode
              ? 'text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-gray-700/50 dark:hover:bg-gray-700/50'
              : 'text-gray-600 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {tsLabel}
        </button>
        <button
          onClick={() => setActive('js')}
          disabled={!jsCode}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            active === 'js'
              ? 'bg-gray-700 dark:bg-gray-700 text-green-400 shadow-sm'
              : jsCode
              ? 'text-gray-400 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-gray-700/50 dark:hover:bg-gray-700/50'
              : 'text-gray-600 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          {jsLabel}
        </button>
      </div>
      
      {/* Code block - hide header since we have tabs */}
      <div className="mt-0">
        {active === 'ts' && tsCode && (
          <CodeBlock lang="typescript" hideHeader={true}>{tsCode}</CodeBlock>
        )}
        {active === 'js' && jsCode && (
          <CodeBlock lang="javascript" hideHeader={true}>{jsCode}</CodeBlock>
        )}
      </div>
    </div>
  );
}
