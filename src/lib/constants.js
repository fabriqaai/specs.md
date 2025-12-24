
// Theme Colors (Terracotta/Orange inspired by Claude Code)
const THEME_COLORS = {
    primary: '#D97757',      // Terracotta
    secondary: '#ff9966',    // Light orange
    success: '#22c55e',      // Green
    error: '#ef4444',        // Red
    warning: '#f59e0b',      // Amber
    info: '#3b82f6',         // Blue
    dim: '#6b7280'           // Gray
};

const FLOWS = {
    aidlc: {
        name: 'AI-DLC',
        description: 'AI-Driven Development Life Cycle - Best for greenfield projects with AI-native development',
        path: 'aidlc'
    },
    agile: {
        name: 'Agile',
        description: 'Sprint-based Agile development - Best for iterative development with changing requirements',
        path: 'agile',
        disabled: true, // Not implemented yet
        message: '(Coming soon)'
    }
};

module.exports = {
    THEME_COLORS,
    FLOWS
};
