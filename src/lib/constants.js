
// Theme Colors (extracted from specs.md pixel logo)
const THEME_COLORS = {
    primary: '#C45050',      // Brick red fill
    secondary: '#D86565',    // Coral red highlight
    accent: '#EC8080',       // Light coral
    success: '#22c55e',      // Green
    error: '#ef4444',        // Red
    warning: '#f59e0b',      // Amber
    info: '#3b82f6',         // Blue
    dim: '#2D2D32'           // Dark charcoal outline
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
