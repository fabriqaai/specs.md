
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
        description: 'Adaptive execution - Brownfield/monorepo ready, right-sizes rigor to complexity',
        path: 'fire'
    },
    aidlc: {
        name: 'AI-DLC',
        description: 'Full methodology - Comprehensive traceability, DDD or Simple bolt types',
        path: 'aidlc'
    },
    simple: {
        name: 'Simple',
        description: 'Spec generation only (Kiro style) - Creates requirement/design/task docs, no execution tracking',
        path: 'simple'
    },
    ideation: {
        name: 'Ideation',
        description: 'Creative ideation - Spark → Flame → Forge idea generation and shaping',
        path: 'ideation'
    }
};

const LINKS = {
    website: 'https://specs.md',
    flows: 'https://specs.md/architecture/flows',
    ideExtension: 'https://specs.md/getting-started/ide-extension',
    vscodeMarketplace: 'https://marketplace.visualstudio.com/items?itemName=fabriqaai.specsmd',
    openVsx: 'https://open-vsx.org/extension/fabriqaai/specsmd'
};

module.exports = {
    THEME_COLORS,
    FLOWS,
    LINKS
};
