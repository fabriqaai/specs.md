
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
    fire: {
        name: 'FIRE',
        description: 'Rapid execution - Solo devs or small teams, brownfield/monorepo, 0-2 adaptive checkpoints',
        path: 'fire'
    },
    aidlc: {
        name: 'AI-DLC',
        description: 'Full methodology with DDD - Teams, complex domains, 10-26 checkpoints',
        path: 'aidlc'
    },
    simple: {
        name: 'Simple',
        description: 'Spec generation only (Kiro style) - Creates requirement/design/task docs, no execution tracking',
        path: 'simple'
    }
};

const LINKS = {
    website: 'https://specs.md',
    flows: 'https://specs.md/flows'
};

module.exports = {
    THEME_COLORS,
    FLOWS,
    LINKS
};
