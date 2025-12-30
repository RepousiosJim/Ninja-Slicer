// Markdown to Notion Blocks Parser
// Converts markdown content to Notion block format

const { richText } = require('./utils.cjs');

// Parse markdown string into Notion blocks
function markdownToBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Headers (H1-H6)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      blocks.push(createHeadingBlock(level, text));
      i++;
      continue;
    }

    // Code blocks
    if (line.trim().startsWith('```')) {
      const { block, nextIndex } = parseCodeBlock(lines, i);
      blocks.push(block);
      i = nextIndex;
      continue;
    }

    // Unordered lists
    if (line.match(/^[\s]*[-*+]\s+/)) {
      const { items, nextIndex } = parseList(lines, i, 'bulleted');
      blocks.push(...items);
      i = nextIndex;
      continue;
    }

    // Ordered lists
    if (line.match(/^[\s]*\d+\.\s+/)) {
      const { items, nextIndex } = parseList(lines, i, 'numbered');
      blocks.push(...items);
      i = nextIndex;
      continue;
    }

    // Blockquotes
    if (line.trim().startsWith('>')) {
      const text = line.replace(/^>\s*/, '');
      blocks.push(createQuoteBlock(text));
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      blocks.push(createDividerBlock());
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push(createParagraphBlock(line));
    i++;
  }

  return blocks;
}

// Create heading block (H1-H6)
function createHeadingBlock(level, text) {
  const headingType = level === 1 ? 'heading_1' :
                      level === 2 ? 'heading_2' :
                      'heading_3';

  return {
    object: 'block',
    type: headingType,
    [headingType]: {
      rich_text: parseRichText(text)
    }
  };
}

// Create paragraph block
function createParagraphBlock(text) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: parseRichText(text)
    }
  };
}

// Create code block
function parseCodeBlock(lines, startIndex) {
  const firstLine = lines[startIndex];
  const language = firstLine.replace(/^```/, '').trim() || 'plain text';

  let i = startIndex + 1;
  const codeLines = [];

  while (i < lines.length && !lines[i].trim().startsWith('```')) {
    codeLines.push(lines[i]);
    i++;
  }

  const code = codeLines.join('\n');

  return {
    block: {
      object: 'block',
      type: 'code',
      code: {
        rich_text: [{ type: 'text', text: { content: code } }],
        language: mapLanguage(language)
      }
    },
    nextIndex: i + 1
  };
}

// Map markdown language names to Notion language names
function mapLanguage(lang) {
  const languageMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'shell',
    'bash': 'shell',
    'yml': 'yaml'
  };
  return languageMap[lang.toLowerCase()] || lang.toLowerCase();
}

// Parse list (bulleted or numbered)
function parseList(lines, startIndex, listType) {
  const items = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];

    // Check if line is part of the list
    const bulletMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
    const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);

    if ((listType === 'bulleted' && bulletMatch) ||
        (listType === 'numbered' && numberedMatch)) {
      const text = bulletMatch ? bulletMatch[1] : numberedMatch[1];

      items.push({
        object: 'block',
        type: listType === 'bulleted' ? 'bulleted_list_item' : 'numbered_list_item',
        [listType === 'bulleted' ? 'bulleted_list_item' : 'numbered_list_item']: {
          rich_text: parseRichText(text)
        }
      });
      i++;
    } else {
      break;
    }
  }

  return { items, nextIndex: i };
}

// Create quote block
function createQuoteBlock(text) {
  return {
    object: 'block',
    type: 'quote',
    quote: {
      rich_text: parseRichText(text)
    }
  };
}

// Create divider block
function createDividerBlock() {
  return {
    object: 'block',
    type: 'divider',
    divider: {}
  };
}

// Parse rich text with formatting (bold, italic, code, links)
function parseRichText(text) {
  const richTextArray = [];
  let currentIndex = 0;
  const regex = /(\*\*|__|\*|_|`|\[)/g;

  // Simple implementation - can be enhanced for nested formatting
  // For now, handle basic bold, italic, code, and links

  // Split by formatting markers and create rich text objects
  const parts = [];
  let lastIndex = 0;

  // Look for bold (**text** or __text__)
  text = text.replace(/\*\*(.+?)\*\*/g, (match, p1) => {
    parts.push({ text: p1, bold: true });
    return `\x00${parts.length - 1}\x00`;
  });

  text = text.replace(/__(.+?)__/g, (match, p1) => {
    parts.push({ text: p1, bold: true });
    return `\x00${parts.length - 1}\x00`;
  });

  // Look for italic (*text* or _text_)
  text = text.replace(/\*(.+?)\*/g, (match, p1) => {
    parts.push({ text: p1, italic: true });
    return `\x00${parts.length - 1}\x00`;
  });

  text = text.replace(/_(.+?)_/g, (match, p1) => {
    parts.push({ text: p1, italic: true });
    return `\x00${parts.length - 1}\x00`;
  });

  // Look for code (`text`)
  text = text.replace(/`(.+?)`/g, (match, p1) => {
    parts.push({ text: p1, code: true });
    return `\x00${parts.length - 1}\x00`;
  });

  // Look for links ([text](url))
  text = text.replace(/\[(.+?)\]\((.+?)\)/g, (match, p1, p2) => {
    parts.push({ text: p1, link: p2 });
    return `\x00${parts.length - 1}\x00`;
  });

  // Build rich text array
  const segments = text.split(/\x00/);

  for (const segment of segments) {
    if (segment.match(/^\d+$/)) {
      const part = parts[parseInt(segment)];
      const annotations = {
        bold: part.bold || false,
        italic: part.italic || false,
        code: part.code || false
      };

      if (part.link) {
        richTextArray.push({
          type: 'text',
          text: { content: part.text, link: { url: part.link } },
          annotations
        });
      } else {
        richTextArray.push({
          type: 'text',
          text: { content: part.text },
          annotations
        });
      }
    } else if (segment) {
      richTextArray.push({
        type: 'text',
        text: { content: segment },
        annotations: {
          bold: false,
          italic: false,
          code: false
        }
      });
    }
  }

  // If no formatting found, return simple text
  if (richTextArray.length === 0) {
    richTextArray.push({
      type: 'text',
      text: { content: text },
      annotations: {
        bold: false,
        italic: false,
        code: false
      }
    });
  }

  return richTextArray;
}

// Helper: Split blocks into chunks (Notion has 100 block limit per request)
function chunkBlocks(blocks, chunkSize = 100) {
  const chunks = [];
  for (let i = 0; i < blocks.length; i += chunkSize) {
    chunks.push(blocks.slice(i, i + chunkSize));
  }
  return chunks;
}

module.exports = {
  markdownToBlocks,
  chunkBlocks,
  createParagraphBlock,
  createHeadingBlock,
  parseRichText
};
