// ============================================================================
// Chat Store - Manages chat messages and AI interactions
// ============================================================================

import { createSignal, createMemo } from 'solid-js';
import type { ChatMessage, ChatSuggestion, ParsedIntent } from '../types';
import {
  parseIntent,
  generateResponse,
  createMessage,
  getSuggestions,
  getWelcomeMessage,
} from '../utils/chatEngine';
import { previewStore } from './preview';
import { historyStore } from './history';
import { aiStore } from './ai';
import { generateId } from '../utils/helpers';

// State
const [messages, setMessages] = createSignal<ChatMessage[]>([getWelcomeMessage()]);
const [isProcessing, setIsProcessing] = createSignal(false);
const [inputValue, setInputValue] = createSignal('');
const [suggestions, setSuggestions] = createSignal<ChatSuggestion[]>(getSuggestions());
const [awaitingConfirmation, setAwaitingConfirmation] = createSignal(false);
const [pendingAction, setPendingAction] = createSignal<ParsedIntent | null>(null);

// Computed
const lastMessage = createMemo(() => {
  const msgs = messages();
  return msgs[msgs.length - 1] || null;
});

const messageCount = createMemo(() => messages().length);

/**
 * Send a user message and get AI response
 */
async function sendMessage(content: string): Promise<void> {
  if (!content.trim() || isProcessing()) return;

  // Add user message
  const userMessage = createMessage('user', content);
  setMessages((prev) => [...prev, userMessage]);
  setInputValue('');
  setIsProcessing(true);

  try {
    // Parse the intent
    const intent = parseIntent(content);

    // Handle based on intent
    await handleIntent(intent);
  } catch (error) {
    console.error('Error processing message:', error);
    addAssistantMessage(
      "Sorry, something went wrong. Please try again.",
      undefined
    );
  } finally {
    setIsProcessing(false);
  }
}

/**
 * Handle parsed intent
 */
async function handleIntent(intent: ParsedIntent): Promise<void> {
  switch (intent.type) {
    case 'organize':
      await handleOrganizeIntent(intent);
      break;

    case 'apply':
      await handleApplyIntent();
      break;

    case 'cancel':
      handleCancelIntent();
      break;

    case 'undo':
      await handleUndoIntent();
      break;

    case 'search':
      await handleSearchIntent(intent);
      break;

    case 'analyze':
      await handleAnalyzeIntent();
      break;

    case 'help':
      addAssistantMessage(generateResponse(intent));
      break;

    case 'preview':
      handlePreviewIntent();
      break;

    default:
      // For unknown intents, use real AI if available
      await handleUnknownIntent(intent);
  }
}

/**
 * Handle unknown intent using real AI
 */
async function handleUnknownIntent(intent: ParsedIntent): Promise<void> {
  // If AI is ready, use it for natural conversation
  if (aiStore.isReady()) {
    try {
      const response = await aiStore.generateResponse(intent.rawText);
      addAssistantMessage(response);
    } catch (error) {
      console.error('AI response error:', error);
      // Fallback to pattern-based response
      addAssistantMessage(generateResponse(intent));
    }
  } else {
    // Use pattern-based fallback
    addAssistantMessage(generateResponse(intent));
  }
}

/**
 * Handle organize intent
 */
async function handleOrganizeIntent(intent: ParsedIntent): Promise<void> {
  const rule = intent.entities.rule || 'byType';

  // Generate preview
  previewStore.generatePreview(rule);

  const plan = previewStore.currentPlan();
  if (!plan || plan.operations.length === 0) {
    addAssistantMessage(
      "I analyzed your files but didn't find any that need to be moved. Everything looks organized already!"
    );
    return;
  }

  // Build response with preview info
  const stats = previewStore.planStats();
  const groupedOps = previewStore.groupedOperations();

  let response = `I've analyzed your files and created an organization plan.\n\n`;
  response += `**Summary:**\n`;
  response += `- ${plan.affectedFiles} files will be organized\n`;
  response += `- ${plan.newFolders.length} folders will be created\n\n`;
  response += `**New structure:**\n`;

  for (const [folder, ops] of Object.entries(groupedOps)) {
    response += `- **${folder}/** (${ops.length} files)\n`;
  }

  response += `\nType "apply" to proceed or "cancel" to abort.`;

  addAssistantMessage(response, intent);
  setAwaitingConfirmation(true);
  setPendingAction(intent);
}

/**
 * Handle apply intent
 */
async function handleApplyIntent(): Promise<void> {
  if (!previewStore.hasChanges()) {
    addAssistantMessage(
      "There's no pending organization plan to apply. Try saying 'organize by type' first."
    );
    return;
  }

  addAssistantMessage("Applying changes...");

  const success = await previewStore.applyPlan();

  if (success) {
    addAssistantMessage(
      "Done! Your files have been organized. You can undo this change anytime by saying 'undo'."
    );
  } else {
    addAssistantMessage(
      "Something went wrong while applying the changes. Please try again."
    );
  }

  setAwaitingConfirmation(false);
  setPendingAction(null);
}

/**
 * Handle cancel intent
 */
function handleCancelIntent(): void {
  if (awaitingConfirmation()) {
    previewStore.cancelPreview();
    addAssistantMessage(
      "No problem, I've cancelled the organization plan. What else can I help you with?"
    );
    setAwaitingConfirmation(false);
    setPendingAction(null);
  } else {
    addAssistantMessage(
      "There's nothing to cancel right now. How can I help you?"
    );
  }
}

/**
 * Handle undo intent
 */
async function handleUndoIntent(): Promise<void> {
  if (!historyStore.canUndo()) {
    addAssistantMessage(
      "There's nothing to undo. Your file history is empty."
    );
    return;
  }

  const lastBatch = historyStore.lastBatch();
  if (!lastBatch) {
    addAssistantMessage("No recent changes to undo.");
    return;
  }

  addAssistantMessage(
    `Undoing "${lastBatch.name}"...`
  );

  const success = await historyStore.undoLast();

  if (success) {
    addAssistantMessage(
      `Done! I've reverted "${lastBatch.name}". Your files are back to their original locations.`
    );
  } else {
    addAssistantMessage(
      "Something went wrong while undoing. Please try again."
    );
  }
}

/**
 * Handle search intent
 */
async function handleSearchIntent(intent: ParsedIntent): Promise<void> {
  const { fileStore } = await import('./files');
  const query = intent.entities.query || '';

  if (query) {
    fileStore.setSearchQuery(query);
  }

  const response = generateResponse(intent);
  addAssistantMessage(response);

  // Add note about results
  setTimeout(() => {
    const visibleFiles = fileStore.visibleFiles();
    const count = countFiles(visibleFiles);

    addAssistantMessage(
      `Found ${count} matching items. Check the file browser on the left to see the results.`
    );
  }, 500);
}

function countFiles(nodes: any[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countFiles(node.children);
    }
  }
  return count;
}

/**
 * Handle analyze intent
 */
async function handleAnalyzeIntent(): Promise<void> {
  const { fileStore } = await import('./files');
  const stats = fileStore.stats();

  let response = `**Storage Analysis:**\n\n`;
  response += `- **Total files:** ${stats.totalFiles}\n`;
  response += `- **Total folders:** ${stats.totalFolders}\n`;
  response += `- **Total size:** ${formatSize(stats.totalSize)}\n\n`;
  response += `**By file type:**\n`;

  const sortedTypes = Object.entries(stats.byType)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  for (const [type, count] of sortedTypes) {
    response += `- ${capitalize(type)}: ${count} files\n`;
  }

  addAssistantMessage(response);
}

/**
 * Handle preview intent
 */
function handlePreviewIntent(): void {
  addAssistantMessage(
    "Which organization rule would you like to preview?\n\n" +
    "- **By type**: Group files into Documents, Images, Videos, etc.\n" +
    "- **By date**: Organize into Year/Month folders\n" +
    "- **By size**: Sort into Small, Medium, Large folders\n\n" +
    "Just say something like 'organize by type' to see a preview."
  );
}

/**
 * Add an assistant message
 */
function addAssistantMessage(content: string, intent?: ParsedIntent): void {
  const message = createMessage('assistant', content, intent);
  setMessages((prev) => [...prev, message]);
}

/**
 * Use a suggestion
 */
function useSuggestion(suggestion: ChatSuggestion): void {
  sendMessage(suggestion.text);
}

/**
 * Clear chat history
 */
function clearChat(): void {
  setMessages([getWelcomeMessage()]);
  setAwaitingConfirmation(false);
  setPendingAction(null);
}

// Helper functions
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Export store
export const chatStore = {
  // State
  messages,
  isProcessing,
  inputValue,
  suggestions,
  awaitingConfirmation,

  // Computed
  lastMessage,
  messageCount,

  // Actions
  setInputValue,
  sendMessage,
  useSuggestion,
  clearChat,
  addAssistantMessage,
};
