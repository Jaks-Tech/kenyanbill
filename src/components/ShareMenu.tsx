"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./ShareMenu.module.css";

type ShareMenuProps = {
  title: string;
  text?: string;
  urlPath: string; // The relative path, e.g. "/public-participation/analysis/slug" or poll anchor
};

export function ShareMenu({ title, text = "", urlPath }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFullUrl(window.location.origin + urlPath);
  }, [urlPath]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedText = encodeURIComponent(title + (text ? ` - ${text}` : ""));

  return (
    <div className={styles.shareContainer} ref={menuRef}>
      <button 
        className={styles.shareButton} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Share"
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Share</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button onClick={copyLink} className={styles.dropdownItem} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {copied ? "Copied!" : "Copy Link"}
          </button>
          
          <a 
            href={`https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.dropdownItem}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </a>
          
          <a 
            href={`https://api.whatsapp.com/send?text=${encodedText} ${encodedUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.dropdownItem}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
