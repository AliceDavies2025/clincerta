'use client';

import { useState, useEffect, useRef } from 'react';

export interface StreamingTextDisplayProps {
  text: string;
  isStreaming: boolean;
  maxHeight?: number;
  showWordCount?: boolean;
  showCharacterCount?: boolean;
}

export const StreamingTextDisplay = ({ 
  text, 
  isStreaming, 
  maxHeight = 300, 
  showWordCount = true, 
  showCharacterCount = true 
}: StreamingTextDisplayProps) => {
  const [displayText, setDisplayText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef<NodeJS.Timeout>();

  // Simulate streaming effect when text is being processed
  useEffect(() => {
    if (isStreaming && text) {
      // Clear any existing streaming
      if (streamingRef.current) {
        clearTimeout(streamingRef.current);
      }

      // Stream text character by character for effect
      let currentIndex = 0;
      const streamText = () => {
        if (currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1));
          currentIndex++;
          
          // Adjust streaming speed based on text length
          const delay = text.length > 10000 ? 0 : text.length > 5000 ? 1 : 5;
          streamingRef.current = setTimeout(streamText, delay);
        }
      };
      
      streamText();
    } else if (text) {
      // Show full text immediately when not streaming
      setDisplayText(text);
    }

    return () => {
      if (streamingRef.current) {
        clearTimeout(streamingRef.current);
      }
    };
  }, [text, isStreaming]);

  // Auto-scroll to bottom when new text arrives
  useEffect(() => {
    if (textRef.current && isStreaming) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [displayText, isStreaming]);

  const wordCount = displayText.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = displayText.length;
  const hasOverflow = textRef.current && textRef.current.scrollHeight > maxHeight;

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header with counts and controls */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            {showWordCount && (
              <div className="flex items-center">
                <span className="font-medium">Words:</span>
                <span className="ml-1 font-mono">{formatCount(wordCount)}</span>
              </div>
            )}
            {showCharacterCount && (
              <div className="flex items-center">
                <span className="font-medium">Chars:</span>
                <span className="ml-1 font-mono">{formatCount(characterCount)}</span>
              </div>
            )}
            {isStreaming && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-green-600 dark:text-green-400">Streaming...</span>
              </div>
            )}
          </div>
          
          {hasOverflow && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
      </div>

      {/* Text content */}
      <div 
        ref={textRef}
        className={`px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto ${
          isExpanded ? '' : `max-h-[${maxHeight}px]`
        }`}
        style={{ 
          maxHeight: isExpanded ? 'none' : `${maxHeight}px`,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(156 163 175) transparent'
        }}
      >
        {displayText || (
          <div className="text-gray-400 dark:text-gray-500 italic">
            {isStreaming ? 'Processing document...' : 'No text content'}
          </div>
        )}
        
        {/* Streaming cursor */}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
        )}
      </div>

      {/* Footer with additional info */}
      {text && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>
              {isStreaming ? 'Text extraction in progress...' : 'Text extraction complete'}
            </span>
            <span>
              {isStreaming ? 'Live preview' : 'Ready for analysis'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
