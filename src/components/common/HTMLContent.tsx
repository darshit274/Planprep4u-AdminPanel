import React from 'react';
import DOMPurify from 'dompurify';

interface HTMLContentProps {
  content: string | null | undefined;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'blockquote', 'code', 'pre',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'class', 'style',
  'title',
];

const HTMLContent: React.FC<HTMLContentProps> = ({ content, className = '', as: Tag = 'div' }) => {
  const sanitized = DOMPurify.sanitize(content ?? '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  return (
    <Tag
      className={`html-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export default HTMLContent;
