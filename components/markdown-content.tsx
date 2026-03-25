"use client";

import ReactMarkdown from "react-markdown";

export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="prose-update">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-base font-bold text-text mb-2 mt-3 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-text mb-1.5 mt-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-text mb-1 mt-2 first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="text-sm text-text-secondary leading-relaxed mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="text-text font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-text-secondary italic">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-light hover:text-accent underline underline-offset-2 transition-colors">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="space-y-1 mb-2 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1 mb-2 last:mb-0 list-decimal list-inside">{children}</ol>,
          li: ({ children }) => (
            <li className="text-sm text-text-secondary leading-relaxed flex gap-2">
              <span className="text-accent-light/60 mt-1 shrink-0">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          hr: () => <hr className="border-border my-3" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent/30 pl-3 my-2 text-text-secondary/80 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="text-xs bg-surface-2 text-accent-light px-1.5 py-0.5 rounded-md font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-surface-2 rounded-lg p-3 overflow-x-auto my-2 text-xs">
              {children}
            </pre>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
