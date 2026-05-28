import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownContent.module.css";

type MarkdownContentProps = {
  content: string;
};

function cleanMarkdown(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const XIcon = () => (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px', marginTop: '-2px' }}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => {
            const isX = props.href?.includes("x.com") || props.href?.includes("twitter.com");
            return (
              <a {...props} target="_blank" rel="noopener noreferrer">
                {isX && <XIcon />}
                {props.children}
              </a>
            );
          }
        }}
      >
        {cleanMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
