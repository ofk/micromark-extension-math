/**
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('./math-text.js').Options} Options
 */

import { mathFlow } from './math-flow.js';
import { mathText } from './math-text.js';
import { mathTexFlow } from './math-tex-flow.js';
import { mathTexText } from './math-tex-text.js';

/**
 * Create an extension for `micromark` to enable math syntax.
 *
 * @param {Options | null | undefined} [options={}]
 *   Configuration (default: `{}`).
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable math syntax.
 */
export function math(options) {
  return {
    flow: {
      [36]: mathFlow,
      [92]: mathTexFlow
    },
    text: {
      [36]: mathText(options),
      [92]: mathTexText
    }
  };
}