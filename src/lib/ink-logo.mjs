#!/usr/bin/env node
/**
 * specs.md Logo Component
 *
 * Red ASCII logo with dark gray shadows
 */

import React from 'react';
import { render, Text, Box } from 'ink';

const { createElement: h } = React;

// Colors
const LOGO_COLOR = '#CC0000';
const SHADOW_COLOR = '#333333';
const VERSION_COLOR = '#FF3333';

// ASCII Logo (exact from specs.md branding)
const asciiLogo = `
                                                                    █████
                                                                   ░░███
  █████  ████████   ██████   ██████   █████     █████████████    ███████
 ███░░  ░░███░░███ ███░░███ ███░░███ ███░░     ░░███░░███░░███  ███░░███
░░█████  ░███ ░███░███████ ░███ ░░░ ░░█████     ░███ ░███ ░███ ░███ ░███
 ░░░░███ ░███ ░███░███░░░  ░███  ███ ░░░░███    ░███ ░███ ░███ ░███ ░███
 ██████  ░███████ ░░██████ ░░██████  ██████  ██ █████░███ █████░░████████
░░░░░░   ░███░░░   ░░░░░░   ░░░░░░  ░░░░░░  ░░ ░░░░░ ░░░ ░░░░░  ░░░░░░░░
         ░███
         █████
        ░░░░░
`;

// Render logo with colored characters
const ColoredLogo = () => {
    const lines = asciiLogo.split('\n');

    return h(Box, { flexDirection: 'column' },
        lines.map((line, lineIndex) => {
            // Parse each line into segments of same-colored characters
            const segments = [];
            let currentType = null;
            let currentText = '';

            for (const char of line) {
                let charType;
                if (char === '█') {
                    charType = 'fill';
                } else if (char === '░') {
                    charType = 'shadow';
                } else {
                    charType = 'space';
                }

                if (charType !== currentType && currentText) {
                    segments.push({ type: currentType, text: currentText });
                    currentText = '';
                }
                currentType = charType;
                currentText += char;
            }
            if (currentText) {
                segments.push({ type: currentType, text: currentText });
            }

            return h(Text, { key: lineIndex },
                segments.map((seg, segIndex) => {
                    if (seg.type === 'fill') {
                        return h(Text, { key: segIndex, color: LOGO_COLOR }, seg.text);
                    } else if (seg.type === 'shadow') {
                        return h(Text, { key: segIndex, color: SHADOW_COLOR }, seg.text);
                    } else {
                        return h(Text, { key: segIndex }, seg.text);
                    }
                })
            );
        })
    );
};

// Header component
const Header = ({ version = '0.0.3' }) => {
    return h(Box, { flexDirection: 'column' },
        h(ColoredLogo),
        h(Box, { marginTop: 0 },
            h(Text, { color: LOGO_COLOR },
                ' AI-native development orchestration ',
                h(Text, { bold: true, color: VERSION_COLOR }, `v${version}`)
            )
        )
    );
};

// Exports for use in other modules
export { Header, asciiLogo, LOGO_COLOR, SHADOW_COLOR, VERSION_COLOR };

// App component for standalone testing
const App = () => {
    const args = process.argv.slice(2);
    const version = args[0] || '0.0.3';
    return h(Header, { version });
};

console.clear();
render(h(App));
