'use client';

import { CodeBlock } from './CodeBlock';

interface CodeWithImageProps {
  code: string;
  image: string;
  imageAlt?: string;
  lang?: string;
  codeFirst?: boolean;
}

export function CodeWithImage({ 
  code, 
  image, 
  imageAlt = 'Code example result', 
  lang = 'typescript',
  codeFirst = true 
}: CodeWithImageProps) {
  return (
    <div className="my-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      {codeFirst ? (
        <>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <CodeBlock lang={lang}>{code}</CodeBlock>
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-center justify-center">
            <img 
              src={image} 
              alt={imageAlt}
              className="max-w-full h-auto rounded"
            />
          </div>
        </>
      ) : (
        <>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-center justify-center">
            <img 
              src={image} 
              alt={imageAlt}
              className="max-w-full h-auto rounded"
            />
          </div>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <CodeBlock lang={lang}>{code}</CodeBlock>
          </div>
        </>
      )}
    </div>
  );
}


