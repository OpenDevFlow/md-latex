import type { NodeEmitter, InlineMathNode, MathNode } from '../types';

/**
 * Inline math emitter: $...$ passthrough
 */
export const inlineMathEmitter: NodeEmitter = (node: InlineMathNode) => {
  return `$${node.value}$`;
};

/**
 * Block math emitter: $$...$$ → \[ ... \]
 */
export const mathEmitter: NodeEmitter = (node: MathNode) => {
  return `\n\\[\n${node.value}\n\\]\n`;
};
