#!/usr/bin/env node
/**
 * specs.md Logo Component
 *
 * Red ASCII logo with black shadows
 */

import React from 'react';
import { render, Text, Box } from 'ink';

const { createElement: h } = React;

// Colors (red)
const LOGO_COLOR = '#CC0000';
const VERSION_COLOR = '#FF3333';

// ASCII Logo (exact from specs.md branding)
const asciiLogoRaw = `
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

// Process to remove shadow characters (░ becomes space for black background)
const asciiLogo = asciiLogoRaw.replace(/░/g, ' ');

// Header component
const Header = ({ version = '0.0.3' }) => {
    return h(Box, { flexDirection: 'column' },
        h(Text, { color: LOGO_COLOR }, asciiLogo),
        h(Box, { marginTop: 0 },
            h(Text, { color: LOGO_COLOR },
                ' AI-native development orchestration ',
                h(Text, { bold: true, color: VERSION_COLOR }, `v${version}`)
            )
        )
    );
};

// Exports for use in other modules
export { Header, asciiLogo, LOGO_COLOR, VERSION_COLOR };

// App component for standalone testing
const App = () => {
    const args = process.argv.slice(2);
    const version = args[0] || '0.0.3';
    return h(Header, { version });
};

console.clear();
render(h(App));
