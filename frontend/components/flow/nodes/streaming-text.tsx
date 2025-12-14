"use client";

/**
 * Streaming Text Component
 * Displays text with character-by-character typing effect during streaming
 */

import { memo, useState, useEffect, useRef } from "react";

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  charsPerFrame?: number; // Characters to reveal per animation frame
  className?: string;
}

export const StreamingText = memo(function StreamingText({
  content,
  isStreaming,
  charsPerFrame = 3,
  className,
}: StreamingTextProps) {
  const [visibleLength, setVisibleLength] = useState(0);
  const rafRef = useRef<number | null>(null);
  const prevContentLength = useRef(0);

  useEffect(() => {
    // When content grows, animate the new characters
    if (content.length > visibleLength) {
      const animate = () => {
        setVisibleLength((prev) => {
          const next = Math.min(prev + charsPerFrame, content.length);
          if (next < content.length && isStreaming) {
            rafRef.current = requestAnimationFrame(animate);
          }
          return next;
        });
      };

      // Cancel any existing animation
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [content, isStreaming, charsPerFrame, visibleLength]);

  // When streaming ends, show all content immediately
  useEffect(() => {
    if (!isStreaming && visibleLength < content.length) {
      setVisibleLength(content.length);
    }
  }, [isStreaming, content.length, visibleLength]);

  // Reset when content is cleared (new node)
  useEffect(() => {
    if (content.length < prevContentLength.current) {
      setVisibleLength(0);
    }
    prevContentLength.current = content.length;
  }, [content.length]);

  const visibleContent = content.slice(0, visibleLength);
  const showCursor = isStreaming && visibleLength < content.length;

  return (
    <span className={className}>
      {visibleContent}
      {showCursor && <span className="animate-blink">|</span>}
    </span>
  );
});
