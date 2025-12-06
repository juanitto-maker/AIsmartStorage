// ============================================================================
// Chat Engine - Intent parsing and response generation
// For Phase 1, this uses rule-based pattern matching
// Phase 2 will integrate SmolLM for AI-powered understanding
// ============================================================================

import type {
  ChatMessage,
  ParsedIntent,
  IntentType,
  OrganizationRule,
  FileType,
  ChatSuggestion,
} from '../types';
import { generateId } from './helpers';

// Pattern matching rules for intent detection
const INTENT_PATTERNS: Array<{
  pattern: RegExp;
  intent: IntentType;
  extractors?: {
    rule?: (match: RegExpMatchArray) => OrganizationRule;
    fileType?: (match: RegExpMatchArray) => FileType;
    query?: (match: RegExpMatchArray) => string;
  };
}> = [
  // Organize intents
  {
    pattern: /\b(organize|sort|arrange|group|categorize)\b.*\b(by\s+)?(type|file\s*type|category)/i,
    intent: 'organize',
    extractors: { rule: () => 'byType' },
  },
  {
    pattern: /\b(organize|sort|arrange|group)\b.*\b(by\s+)?(date|time|when|year|month)/i,
    intent: 'organize',
    extractors: { rule: () => 'byDate' },
  },
  {
    pattern: /\b(organize|sort|arrange|group)\b.*\b(by\s+)?(size|big|small|large)/i,
    intent: 'organize',
    extractors: { rule: () => 'bySize' },
  },
  {
    pattern: /\b(organize|sort|arrange|group)\b.*\b(by\s+)?(extension|ext)/i,
    intent: 'organize',
    extractors: { rule: () => 'byExtension' },
  },
  {
    pattern: /\b(organize|sort|clean\s*up|tidy|arrange)\b/i,
    intent: 'organize',
  },

  // Search intents
  {
    pattern: /\b(find|search|look\s*for|where\s*(is|are)|locate)\b\s*(all\s+)?(the\s+)?(.+)/i,
    intent: 'search',
    extractors: { query: (m) => m[5]?.trim() || '' },
  },
  {
    pattern: /\b(show\s*me|list)\b\s*(all\s+)?(the\s+)?(.+)/i,
    intent: 'search',
    extractors: { query: (m) => m[4]?.trim() || '' },
  },

  // Analyze intents
  {
    pattern: /\b(what('s|\s+is)\s+(taking|using)\s+(up\s+)?(space|storage|room))/i,
    intent: 'analyze',
  },
  {
    pattern: /\b(analyze|analysis|statistics|stats|summary|overview)\b/i,
    intent: 'analyze',
  },
  {
    pattern: /\b(how\s+(much|many)|size|space|storage)\b/i,
    intent: 'analyze',
  },

  // Undo intents
  {
    pattern: /\b(undo|revert|rollback|go\s*back|restore)\b/i,
    intent: 'undo',
  },

  // Preview intents
  {
    pattern: /\b(preview|show|what\s+would|how\s+would|simulate)\b/i,
    intent: 'preview',
  },

  // Apply/confirm intents
  {
    pattern: /\b(yes|apply|confirm|do\s+it|go\s+ahead|proceed|ok|okay|sure)\b/i,
    intent: 'apply',
  },

  // Cancel intents
  {
    pattern: /\b(no|cancel|stop|never\s*mind|forget\s*it|don't|abort)\b/i,
    intent: 'cancel',
  },

  // Help intents
  {
    pattern: /\b(help|what\s+can\s+you|how\s+do\s+(i|you)|commands?|options?|features?)\b/i,
    intent: 'help',
  },
];

// File type detection in queries
const FILE_TYPE_PATTERNS: Array<{ pattern: RegExp; type: FileType }> = [
  { pattern: /\b(image|images|photo|photos|picture|pictures|jpg|jpeg|png|gif)\b/i, type: 'image' },
  { pattern: /\b(video|videos|movie|movies|mp4|mov|avi)\b/i, type: 'video' },
  { pattern: /\b(audio|music|song|songs|mp3|wav|flac)\b/i, type: 'audio' },
  { pattern: /\b(document|documents|doc|docx|word)\b/i, type: 'document' },
  { pattern: /\b(pdf|pdfs)\b/i, type: 'pdf' },
  { pattern: /\b(spreadsheet|spreadsheets|excel|xlsx|xls|csv)\b/i, type: 'spreadsheet' },
  { pattern: /\b(presentation|presentations|powerpoint|pptx|ppt|slides)\b/i, type: 'presentation' },
  { pattern: /\b(archive|archives|zip|rar|compressed)\b/i, type: 'archive' },
  { pattern: /\b(code|source|script|program|js|ts|py|java)\b/i, type: 'code' },
];

/**
 * Parse user message to extract intent
 */
export function parseIntent(message: string): ParsedIntent {
  const normalizedMessage = message.toLowerCase().trim();

  // Try to match against patterns
  for (const rule of INTENT_PATTERNS) {
    const match = normalizedMessage.match(rule.pattern);
    if (match) {
      const intent: ParsedIntent = {
        type: rule.intent,
        confidence: 0.8,
        entities: {},
        rawText: message,
      };

      // Extract entities using extractors
      if (rule.extractors) {
        if (rule.extractors.rule) {
          intent.entities.rule = rule.extractors.rule(match);
        }
        if (rule.extractors.query) {
          intent.entities.query = rule.extractors.query(match);
        }
      }

      // Try to detect file type in the message
      for (const ftPattern of FILE_TYPE_PATTERNS) {
        if (ftPattern.pattern.test(normalizedMessage)) {
          intent.entities.fileType = ftPattern.type;
          break;
        }
      }

      return intent;
    }
  }

  // Unknown intent
  return {
    type: 'unknown',
    confidence: 0.2,
    entities: {},
    rawText: message,
  };
}

/**
 * Generate response based on intent
 */
export function generateResponse(intent: ParsedIntent): string {
  switch (intent.type) {
    case 'organize':
      return generateOrganizeResponse(intent);
    case 'search':
      return generateSearchResponse(intent);
    case 'analyze':
      return generateAnalyzeResponse();
    case 'undo':
      return "I'll undo the last change. Ready to revert?";
    case 'preview':
      return "I'll show you a preview of the proposed changes. Which organization rule would you like to try? (by type, date, or size)";
    case 'apply':
      return "Applying the changes now...";
    case 'cancel':
      return "No problem, I've cancelled the operation. What else can I help you with?";
    case 'help':
      return generateHelpResponse();
    case 'unknown':
    default:
      return generateUnknownResponse();
  }
}

function generateOrganizeResponse(intent: ParsedIntent): string {
  const rule = intent.entities.rule || 'byType';

  const ruleDescriptions: Record<OrganizationRule, string> = {
    byType: "by file type (Documents, Images, Videos, etc.)",
    byDate: "by date (Year/Month folders)",
    bySize: "by size (Small, Medium, Large)",
    byExtension: "by file extension",
    flatten: "into a flat structure",
    custom: "using custom rules",
  };

  return `I'll organize your files ${ruleDescriptions[rule]}. Let me analyze your files and show you a preview of the proposed changes.`;
}

function generateSearchResponse(intent: ParsedIntent): string {
  const query = intent.entities.query || 'files';
  const fileType = intent.entities.fileType;

  if (fileType) {
    return `Searching for ${fileType} files matching "${query}"...`;
  }

  return `Searching for "${query}"...`;
}

function generateAnalyzeResponse(): string {
  return "I'll analyze your storage usage and show you what's taking up the most space.";
}

function generateHelpResponse(): string {
  return `Here's what I can help you with:

**Organize files:**
- "Organize my downloads by type"
- "Sort files by date"
- "Group files by size"

**Search files:**
- "Find all PDFs"
- "Show me large videos"
- "Where are my documents?"

**Analyze storage:**
- "What's taking up space?"
- "Show storage statistics"

**Manage changes:**
- "Undo the last change"
- "Show history"

Just type your request and I'll help you organize your files!`;
}

function generateUnknownResponse(): string {
  const responses = [
    "I'm not sure I understand. Could you try rephrasing that? You can ask me to organize files, search for specific types, or analyze your storage.",
    "I didn't quite catch that. Try saying something like 'organize by type' or 'find all images'.",
    "Hmm, I'm not sure what you mean. Type 'help' to see what I can do!",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Create a chat message
 */
export function createMessage(
  role: 'user' | 'assistant',
  content: string,
  intent?: ParsedIntent
): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date(),
    intent,
  };
}

/**
 * Get suggested prompts based on context
 */
export function getSuggestions(): ChatSuggestion[] {
  return [
    {
      id: '1',
      text: 'Organize by file type',
      intent: 'organize',
      icon: '📁',
    },
    {
      id: '2',
      text: 'Sort by date',
      intent: 'organize',
      icon: '📅',
    },
    {
      id: '3',
      text: 'Find large files',
      intent: 'search',
      icon: '🔍',
    },
    {
      id: '4',
      text: "What's taking up space?",
      intent: 'analyze',
      icon: '📊',
    },
  ];
}

/**
 * Get welcome message
 */
export function getWelcomeMessage(): ChatMessage {
  return createMessage(
    'assistant',
    `Welcome to Smart Storage AI! I'm your privacy-first file organizer.

I run 100% locally on your device - no internet required, your files stay private.

**Quick actions:**
- "Organize my downloads by type"
- "Find all large files"
- "What's using the most space?"

How can I help you organize your files today?`
  );
}
