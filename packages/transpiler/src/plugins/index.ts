import type { TranspilerPlugin } from '../types';

/**
 * Plugin registry — validates and stores plugins.
 * Plugins are merged into the emitter in `emitter/index.ts`.
 */
export class PluginRegistry {
  private plugins: Map<string, TranspilerPlugin> = new Map();

  register(plugin: TranspilerPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[md-latex] Plugin "${plugin.name}" is already registered. Overwriting.`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): void {
    this.plugins.delete(name);
  }

  getAll(): TranspilerPlugin[] {
    return Array.from(this.plugins.values());
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }
}

/** Singleton global registry for convenience */
export const globalRegistry = new PluginRegistry();
