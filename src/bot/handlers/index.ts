/**
 * Bot handlers exports
 *
 * Following proper agentic pattern:
 * - All messages go to the agent (no separate command handlers)
 * - Agent decides how to respond based on message content
 */

export * from './message.handler.js';
export * from './photo.handler.js';
export * from './document.handler.js';
