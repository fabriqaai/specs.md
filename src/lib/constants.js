
// Theme Colors (dark red)
const THEME_COLORS = {
    primary: '#A83232',      // Dark brick red
    secondary: '#C04545',    // Medium red
    accent: '#D85858',       // Coral red
    success: '#22c55e',      // Green
    error: '#ef4444',        // Red
    warning: '#f59e0b',      // Amber
    info: '#3b82f6',         // Blue
    dim: '#666666'           // Gray shadow (visible on dark/light terminals)
};

const FLOWS = {
    aidlc: {
        name: 'AI-DLC',
        description: 'AI-Driven Development Life Cycle - Best for greenfield projects with AI-native development',
        path: 'aidlc'
    },
    fire: {
        name: 'FIRE',
        description: 'Fast Intent-Run Engineering - Lightweight flow for quick iterations with minimal overhead',
        path: 'fire'
    },
    simple: {
        name: 'Simple',
        description: 'Spec-driven development - Best for quick feature specs without full methodology overhead',
        path: 'simple'
    }
};

module.exports = {
    THEME_COLORS,
    FLOWS
};
