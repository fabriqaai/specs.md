/**
 * BaseElement - Base class for all SpecsMD Lit components.
 * Provides shared styles and utilities.
 */

import { LitElement, css } from 'lit';
import { themeStyles, resetStyles } from '../../styles/theme.js';

/**
 * Base element class that all SpecsMD components should extend.
 * Provides consistent theming and reset styles.
 */
export class BaseElement extends LitElement {
    /**
     * Shared base styles included in all components.
     */
    static baseStyles = [
        themeStyles,
        resetStyles,
        css`
            :host {
                display: block;
                font-family: var(--font-family);
                font-size: var(--font-size);
                color: var(--foreground);
            }
        `
    ];
}
