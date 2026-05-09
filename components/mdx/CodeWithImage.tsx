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
  const imageBlock = (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-center justify-center min-w-0">
      <img 
        src={image} 
        alt={imageAlt}
        className="max-w-full h-auto rounded"
      />
    </div>
  );

  const codeBlock = (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden min-w-0">
      <CodeBlock lang={lang}>{code}</CodeBlock>
    </div>
  );

  return (
    <div className="my-6 flex flex-col gap-4">
      {codeFirst ? (
        <>
          {codeBlock}
          {imageBlock}
        </>
      ) : (
        <>
          {imageBlock}
          {codeBlock}
        </>
      )}
    </div>
  );
}
