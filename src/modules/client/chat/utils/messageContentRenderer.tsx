import React from 'react';
import type { Message } from '@/modules/client/chat/types/chat.types';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

export const parseCodeBlocks = (text: string): { type: 'text' | 'code'; content: string; lang?: string }[] => {
  const tripleParts = text.split(/```/g);
  const blocks: { type: 'text' | 'code'; content: string; lang?: string }[] = [];

  tripleParts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      const lines = part.split('\n');
      const firstLine = lines[0].trim();
      const hasLang = firstLine && !firstLine.includes(' ') && firstLine.length < 15;
      const lang = hasLang ? firstLine : undefined;
      
      let content = '';
      if (hasLang) {
        content = lines.slice(1).join('\n');
      } else {
        if (lines[0] === '') {
          content = lines.slice(1).join('\n');
        } else {
          content = part;
        }
      }

      if (content.endsWith('\n')) {
        content = content.slice(0, -1);
      }

      blocks.push({ type: 'code', content, lang });
    } else {
      const singleParts = part.split(/`/g);
      singleParts.forEach((subPart, subIdx) => {
        if (subIdx % 2 === 1) {
          if (subPart.includes('\n')) {
            let cleanContent = subPart;
            if (cleanContent.startsWith('\n')) {
              cleanContent = cleanContent.substring(1);
            }
            if (cleanContent.endsWith('\n')) {
              cleanContent = cleanContent.substring(0, cleanContent.length - 1);
            }
            blocks.push({ type: 'code', content: cleanContent });
          } else {
            blocks.push({ type: 'text', content: '`' + subPart + '`' });
          }
        } else {
          blocks.push({ type: 'text', content: subPart });
        }
      });
    }
  });

  return blocks;
};

export const restoreTokensAsText = (text: string, mentions: React.ReactNode[]): string => {
  let result = text;
  result = result.replace(/@@@MENTIONTOKEN(\d+)@@@/g, (match, idxStr) => {
    const idx = parseInt(idxStr);
    const mentionNode = mentions[idx] as React.ReactElement<{ children?: string }>;
    if (mentionNode && mentionNode.props && mentionNode.props.children) {
      const child = mentionNode.props.children;
      return typeof child === 'string' ? child : match;
    }
    return match;
  });
  return result;
};

export const parseTagsAndRestoreTokens = (
  text: string, 
  mentions: React.ReactNode[], 
  links: React.ReactNode[], 
  urls: React.ReactNode[], 
  inlineCodes: React.ReactNode[]
): React.ReactNode[] => {
  const tokenRegex = /(<\/?[a-z]+>|@@@(?:MENTION|LINK|URL|INLINECODE)TOKEN\d+@@@)/g;
  const parts = text.split(tokenRegex);
  const result: React.ReactNode[] = [];
  const tagStack: string[] = [];
  
  parts.forEach((part, idx) => {
    if (!part) return;
    
    if (part.startsWith('<') && part.endsWith('>')) {
      if (part.startsWith('</')) {
        tagStack.pop();
      } else {
        const tagName = part.substring(1, part.length - 1);
        tagStack.push(tagName);
      }
      return;
    }
    
    let element: React.ReactNode = part;
    
    if (part.startsWith('@@@') && part.endsWith('@@@')) {
      const match = part.match(/@@@(MENTION|LINK|URL|INLINECODE)TOKEN(\d+)@@@/);
      if (match) {
        const tokenType = match[1];
        const tokenIdx = parseInt(match[2]);
        
        if (tokenType === 'MENTION') {
          element = mentions[tokenIdx];
        } else if (tokenType === 'LINK') {
          element = links[tokenIdx];
        } else if (tokenType === 'URL') {
          element = urls[tokenIdx];
        } else if (tokenType === 'INLINECODE') {
          element = inlineCodes[tokenIdx];
        }
      }
    }
    
    if (tagStack.length > 0) {
      let styledNode: React.ReactNode = element;
      for (let i = tagStack.length - 1; i >= 0; i--) {
        const tag = tagStack[i];
        if (tag === 'strong') {
          styledNode = <strong key={`bold-${idx}-${i}`}>{styledNode}</strong>;
        } else if (tag === 'em') {
          styledNode = <em key={`italic-${idx}-${i}`}>{styledNode}</em>;
        } else if (tag === 'del') {
          styledNode = <del key={`strikethrough-${idx}-${i}`}>{styledNode}</del>;
        }
      }
      result.push(styledNode);
    } else {
      result.push(element);
    }
  });
  
  return result;
};

export const preprocessInlineMarkdown = (text: string) => {
  const links: React.ReactNode[] = [];
  let linkCount = 0;
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let substituted = text.replace(linkRegex, (match, label, url) => {
    const token = `@@@LINKTOKEN${linkCount}@@@`;
    links.push(
      <a
        key={`link-${linkCount}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#2563EB] dark:text-[#3B82F6] hover:underline font-semibold"
      >
        {label}
      </a>
    );
    linkCount++;
    return token;
  });

  const urls: React.ReactNode[] = [];
  let urlCount = 0;
  const urlRegex = /(https?:\/\/[^\s<]+?)(?=[*~_.,;)]*(\s|$|<))/g;
  substituted = substituted.replace(urlRegex, (match) => {
    if (match.startsWith('@@@LINKTOKEN') || match.startsWith('@@@MENTIONTOKEN')) return match;
    const token = `@@@URLTOKEN${urlCount}@@@`;
    urls.push(
      <a
        key={`url-${urlCount}`}
        href={match}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#2563EB] dark:text-[#3B82F6] hover:underline break-all"
      >
        {match}
      </a>
    );
    urlCount++;
    return token;
  });

  const inlineCodes: React.ReactNode[] = [];
  let codeCount = 0;
  substituted = substituted.replace(/`([^`]+)`/g, (match, codeText) => {
    const token = `@@@INLINECODETOKEN${codeCount}@@@`;
    inlineCodes.push(
      <code 
        key={`inline-code-${codeCount}`} 
        className="px-1.5 py-0.5 bg-[#F0F0EE] dark:bg-white/10 rounded font-mono text-[0.8125rem] text-[#D03E3E] dark:text-[#F87171] font-semibold"
      >
        {codeText}
      </code>
    );
    codeCount++;
    return token;
  });

  substituted = substituted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  substituted = substituted.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  substituted = substituted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  substituted = substituted.replace(/_([^_]+)_/g, '<em>$1</em>');
  substituted = substituted.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return { substitutedText: substituted, links, urls, inlineCodes };
};

export const renderMessageContent = (
  content?: string, 
  currentUserId?: string,
  onMentionClick?: (userId: string, displayName: string, pos: { x: number; y: number }) => void
) => {
  if (!content) return '';

  const mentions: React.ReactNode[] = [];
  const mentionRegex = /(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g;
  let mentionCount = 0;
  const substituted = content.replace(mentionRegex, (match, displayName, userId) => {
    const isMe = String(userId) === String(currentUserId) || userId === 'All' || userId === 'all';
    const isAll = userId === 'All' || userId === 'all';
    const token = `@@@MENTIONTOKEN${mentionCount}@@@`;
    mentions.push(
      <span
        key={`mention-${mentionCount}`}
        onClick={(e) => {
          if (isAll || !onMentionClick) return;
          e.preventDefault();
          e.stopPropagation();
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          onMentionClick(userId, displayName, { x: rect.left, y: rect.bottom });
        }}
        className={cn(
          "px-1 py-0.5 rounded-[3px] font-medium text-[0.875rem] inline-block select-none",
          !isAll && onMentionClick ? "cursor-pointer hover:underline" : "",
          isMe 
            ? "text-[#F59E0B] dark:text-[#FBBF24] bg-[#FFF9E6] dark:bg-[#F59E0B]/20" 
            : "text-[#2563EB] dark:text-[#3B82F6] bg-[#EFF6FF] dark:bg-[rgba(37,99,235,0.12)]"
        )}
      >
        @{displayName}
      </span>
    );
    mentionCount++;
    return token;
  });

  const blockParts = parseCodeBlocks(substituted);

  return blockParts.map((block, blockIdx) => {
    if (block.type === 'code') {
      return (
        <pre 
          key={`code-block-${blockIdx}`} 
          className="p-3 bg-[#F7F6F3] dark:bg-[#1E1E1E] rounded-md overflow-x-auto font-mono text-[0.8125rem] my-2 border border-[#EAEAEA] dark:border-white/[0.06]"
        >
          {block.lang && (
            <div className="text-[10px] text-[#ABABAB] font-bold uppercase mb-1.5 border-b border-[#EAEAEA]/50 dark:border-white/5 pb-1 select-none">
              {block.lang}
            </div>
          )}
          <code className="block whitespace-pre text-[#111111] dark:text-[#E8E8E7]">
            {restoreTokensAsText(block.content, mentions)}
          </code>
        </pre>
      );
    }

    const { substitutedText, links, urls, inlineCodes } = preprocessInlineMarkdown(block.content);
    const lines = substitutedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    return (
      <div key={`text-block-${blockIdx}`} className="space-y-1 my-1 break-words [overflow-wrap:anywhere] [word-break:break-word] w-full text-justify">
        {lines.map((line, lineIdx) => {
          if (!line.trim()) return <div key={lineIdx} className="h-1" />;

          let prefixTags = '';
          let suffixTags = '';
          let strippedLine = line.trim();

          const tagMatch = strippedLine.match(/^((?:<(?:strong|em|del)>)+)/);
          if (tagMatch) {
            prefixTags = tagMatch[1];
            strippedLine = strippedLine.substring(tagMatch[0].length).trim();
          }
          
          const suffixMatch = strippedLine.match(/((?:<\/(?:strong|em|del)>)+)$/);
          if (suffixMatch) {
            suffixTags = suffixMatch[1];
            strippedLine = strippedLine.substring(0, strippedLine.length - suffixMatch[0].length).trim();
          }

          if (strippedLine.startsWith('> ')) {
            const quoteContent = prefixTags + strippedLine.substring(2) + suffixTags;
            return (
              <blockquote 
                key={lineIdx} 
                className="border-l-4 border-[#2563EB] dark:border-[#3B82F6] pl-3 py-0.5 italic text-[#787774] dark:text-[#9B9A97] bg-[#F7F6F3] dark:bg-white/5 rounded-r my-1 break-words [overflow-wrap:anywhere] text-justify"
              >
                {parseTagsAndRestoreTokens(quoteContent, mentions, links, urls, inlineCodes)}
              </blockquote>
            );
          }

          let markerClasses = '';
          if (prefixTags.includes('strong')) markerClasses += ' font-bold';
          if (prefixTags.includes('em')) markerClasses += ' italic';
          if (prefixTags.includes('del')) markerClasses += ' line-through';

          if (strippedLine.startsWith('- ') || strippedLine.startsWith('* ') || strippedLine.startsWith('+ ')) {
            const listItemContent = prefixTags + strippedLine.substring(2) + suffixTags;
            return (
              <ul key={lineIdx} className={`list-disc pl-5 my-0.5 break-words [overflow-wrap:anywhere] text-justify${markerClasses}`}>
                <li>{parseTagsAndRestoreTokens(listItemContent, mentions, links, urls, inlineCodes)}</li>
              </ul>
            );
          }

          const numMatch = strippedLine.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            const listNum = numMatch[1];
            const listItemContent = prefixTags + numMatch[2] + suffixTags;
            return (
              <ol key={lineIdx} className={`list-decimal pl-5 my-0.5 break-words [overflow-wrap:anywhere] text-justify${markerClasses}`} start={parseInt(listNum)}>
                <li>{parseTagsAndRestoreTokens(listItemContent, mentions, links, urls, inlineCodes)}</li>
              </ol>
            );
          }

          return (
            <p key={lineIdx} className="min-h-[1.25rem] break-words [overflow-wrap:anywhere] [word-break:break-word] w-full text-justify">
              {parseTagsAndRestoreTokens(line, mentions, links, urls, inlineCodes)}
            </p>
          );
        })}
      </div>
    );
  });
};

export const getMessagePreviewText = (msg?: Message | null): string => {
  if (!msg) return '';
  if (msg.deletedAt) return '[Message deleted]';
  if (msg.type === 'sticker') return '[Sticker]';

  if (msg.content && msg.content.trim()) {
    const cleanText = msg.content.replace(/(?:\[@|@\[)([^\]]+)\]\(([^)]+)\)/g, '@$1');
    if (msg.attachments && msg.attachments.length > 0) {
      const firstAtt = msg.attachments[0];
      const isImg = firstAtt.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(firstAtt.url || firstAtt.name || '');
      return `${isImg ? '[Image]' : '[File]'} ${cleanText}`;
    }
    return cleanText;
  }

  if (msg.attachments && msg.attachments.length > 0) {
    const firstAtt = msg.attachments[0];
    const isImg = firstAtt.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(firstAtt.url || firstAtt.name || '');
    return isImg ? '[Image]' : '[File]';
  }

  if ((msg.type as string) === 'image') return '[Image]';
  if ((msg.type as string) === 'file') return '[File]';

  return '[Attachment]';
};
