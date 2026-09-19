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
  codeFirst = true,
}: CodeWithImageProps) {
  const imageBlock = (
    <figure className="apx-code-with-image__media">
      <img src={image} alt={imageAlt} />
      <figcaption>Rendered output</figcaption>
    </figure>
  );

  const codeBlock = (
    <div className="apx-code-with-image__source">
      <CodeBlock lang={lang} docsStudio>{code}</CodeBlock>
    </div>
  );

  return (
    <div className="apx-code-with-image" data-doc3-component="CodeWithImage">
      {codeFirst ? <>{codeBlock}{imageBlock}</> : <>{imageBlock}{codeBlock}</>}
    </div>
  );
}
