/**
 * CLI Utilities for specsmd
 */

const chalk = require('chalk');
const figlet = require('figlet');
const gradient = require('gradient-string');
const path = require('path');

// Lazy load oh-my-logo (ESM module) via dynamic import
let ohMyLogo = null;
const getOhMyLogo = async () => {
  if (!ohMyLogo) {
    ohMyLogo = await import('oh-my-logo');
  }
  return ohMyLogo;
};

const { THEME_COLORS } = require('./constants');

// Theme Colors (Terracotta/Orange inspired by Claude Code)
const THEME = THEME_COLORS;

// Create gradient for logo
const logoGradient = gradient([THEME.primary, THEME.secondary]);

// Theme chalk instances
const theme = {
  primary: chalk.hex(THEME.primary),
  secondary: chalk.hex(THEME.secondary),
  success: chalk.hex(THEME.success),
  error: chalk.hex(THEME.error),
  warning: chalk.hex(THEME.warning),
  info: chalk.hex(THEME.info),
  dim: chalk.hex(THEME.dim)
};

// Box drawing characters (Unicode)
const BOX = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  heavyHorizontal: '═',
  heavyVertical: '║',
  heavyTopLeft: '╔',
  heavyTopRight: '╗',
  heavyBottomLeft: '╚',
  heavyBottomRight: '╝'
};

/**
 * CLIUtils -
 */
const CLIUtils = {
  /**
   * Get package version
   */
  getVersion() {
    try {
      const packageJson = require(path.join(__dirname, '..', 'package.json'));
      return packageJson.version || 'Unknown';
    } catch {
      return 'Unknown';
    }
  },

  /**
   * Get terminal width (capped at 80)
   */
  getWidth() {
    return Math.min(process.stdout.columns || 80, 80);
  },

  /**
   * Display the specs.md logo with gradient ASCII art (lowercase with shadow)
   * Uses oh-my-logo for beautiful gradient rendering
   * @param {boolean} clearScreen - Whether to clear screen first
   */
  async displayLogo(clearScreen = true) {
    if (clearScreen) {
      console.clear();
    }

    const version = this.getVersion();

    console.log('');

    try {
      // Use oh-my-logo with custom orange palette and Standard font (lowercase)
      const { render } = await getOhMyLogo();
      const logo = await render('specs.md', {
        palette: [THEME.primary, THEME.secondary, '#ffb380'],
        font: 'Standard',
        direction: 'horizontal'
      });

      console.log(logo);
    } catch (err) {
      // Fallback to figlet + gradient-string if oh-my-logo fails
      const figletArt = figlet.textSync('specs.md', {
        font: 'Standard',
        horizontalLayout: 'default'
      });
      console.log(logoGradient(figletArt));
    }

    // Tagline with version
    console.log(theme.primary(' AI-native development orchestration') + theme.primary.bold(` v${version}`) + '\n');
  },

  /**
   * Display the specsmd logo synchronously using figlet (fallback)
   * @param {boolean} clearScreen - Whether to clear screen first
   */
  displayLogoSync(clearScreen = true) {
    if (clearScreen) {
      console.clear();
    }

    const version = this.getVersion();

    // Generate ASCII art with figlet
    const figletArt = figlet.textSync('specs.md', {
      font: 'Big',
      horizontalLayout: 'default'
    });

    console.log('');
    console.log(logoGradient(figletArt));

    // Tagline with version
    console.log(theme.primary(' AI-native development orchestration') + theme.primary.bold(` v${version}`) + '\n');
  },

  /**
   * Display the logo using figlet (alternative style)
   * @param {boolean} clearScreen - Whether to clear screen first
   */
  displayFigletLogo(clearScreen = true) {
    if (clearScreen) {
      console.clear();
    }

    const version = this.getVersion();
    const art = figlet.textSync('specs.md', {
      font: 'Big',
      horizontalLayout: 'full'
    });

    console.log(logoGradient(art));
    console.log(theme.dim(' AI-native development orchestration') + theme.primary.bold(` v${version}`) + '\n');
  },

  /**
   * Display a section header with separator lines
   * @param {string} title - Section title
   * @param {string} subtitle - Optional subtitle
   */
  displaySection(title, subtitle = null) {
    const width = this.getWidth();
    const line = BOX.heavyHorizontal.repeat(width);

    console.log('\n' + theme.primary(line));
    console.log(theme.primary.bold(` ${title}`));
    if (subtitle) {
      console.log(theme.dim(` ${subtitle}`));
    }
    console.log(theme.primary(line) + '\n');
  },

  /**
   * Display a header (lighter than section)
   * @param {string} title - Header title
   * @param {string} icon - Optional icon prefix
   */
  displayHeader(title, icon = '') {
    const prefix = icon ? `${icon}  ` : '';
    console.log('\n' + theme.primary.bold(`${prefix}${title}`));
    console.log(theme.dim(BOX.horizontal.repeat(title.length + prefix.length)) + '\n');
  },

  /**
   * Display a boxed message
   * @param {string} content - Box content
   * @param {object} options - Box options
   */
  displayBox(content, options = {}) {
    const {
      title = null,
      borderColor = 'primary',
      padding = 1,
      width = null
    } = options;

    const boxWidth = width || Math.min(this.getWidth() - 4, 76);
    const innerWidth = boxWidth - 2;
    const colorFn = theme[borderColor] || theme.primary;

    // Top border
    let topBorder;
    if (title) {
      const titleStr = ` ${title} `;
      const remainingWidth = boxWidth - titleStr.length - 2;
      const leftPad = Math.floor(remainingWidth / 2);
      const rightPad = remainingWidth - leftPad;
      topBorder = colorFn(BOX.topLeft + BOX.horizontal.repeat(leftPad) + titleStr + BOX.horizontal.repeat(rightPad) + BOX.topRight);
    } else {
      topBorder = colorFn(BOX.topLeft + BOX.horizontal.repeat(boxWidth - 2) + BOX.topRight);
    }
    console.log(topBorder);

    // Padding top
    for (let i = 0; i < padding; i++) {
      console.log(colorFn(BOX.vertical) + ' '.repeat(innerWidth) + colorFn(BOX.vertical));
    }

    // Content lines
    const lines = content.split('\n');
    for (const line of lines) {
      const stripped = line.replace(/\u001b\[[0-9;]*m/g, ''); // Strip ANSI codes for length calculation
      const paddedLine = line + ' '.repeat(Math.max(0, innerWidth - stripped.length));
      console.log(colorFn(BOX.vertical) + paddedLine.slice(0, innerWidth) + colorFn(BOX.vertical));
    }

    // Padding bottom
    for (let i = 0; i < padding; i++) {
      console.log(colorFn(BOX.vertical) + ' '.repeat(innerWidth) + colorFn(BOX.vertical));
    }

    // Bottom border
    console.log(colorFn(BOX.bottomLeft + BOX.horizontal.repeat(boxWidth - 2) + BOX.bottomRight));
  },

  /**
   * Display a success message in a green box
   * @param {string} message - Success message
   * @param {string} title - Optional title
   */
  displaySuccess(message, title = 'Success') {
    console.log('');
    this.displayBox(theme.success(message), {
      title,
      borderColor: 'success',
      padding: 0
    });
  },

  /**
   * Display an error message in a red box
   * @param {string} message - Error message
   * @param {string} title - Optional title
   */
  displayError(message, title = 'Error') {
    console.log('');
    this.displayBox(theme.error(message), {
      title,
      borderColor: 'error',
      padding: 0
    });
  },

  /**
   * Display a warning message in an amber box
   * @param {string} message - Warning message
   * @param {string} title - Optional title
   */
  displayWarning(message, title = 'Warning') {
    console.log('');
    this.displayBox(theme.warning(message), {
      title,
      borderColor: 'warning',
      padding: 0
    });
  },

  /**
   * Display an info message in a blue box
   * @param {string} message - Info message
   * @param {string} title - Optional title
   */
  displayInfo(message, title = 'Info') {
    console.log('');
    this.displayBox(theme.info(message), {
      title,
      borderColor: 'info',
      padding: 0
    });
  },

  /**
   * Display current step progress
   * @param {number} current - Current step
   * @param {number} total - Total steps
   * @param {string} description - Step description
   */
  displayStep(current, total, description) {
    const progress = theme.primary.bold(`[${current}/${total}]`);
    console.log(`${progress} ${description}`);
  },

  /**
   * Display a completion message
   * @param {string} message - Completion message
   */
  displayComplete(message) {
    this.displaySuccess(message, 'Complete');
  },

  /**
   * Display a simple status line
   * @param {string} icon - Status icon
   * @param {string} message - Status message
   * @param {string} color - Color name
   */
  displayStatus(icon, message, color = 'primary') {
    const colorFn = theme[color] || theme.primary;
    console.log(`${colorFn(icon)} ${message}`);
  },

  /**
   * Display a list of items
   * @param {string[]} items - List items
   * @param {string} bullet - Bullet character
   */
  displayList(items, bullet = '  -') {
    for (const item of items) {
      console.log(theme.dim(bullet) + ' ' + item);
    }
  },

  /**
   * Display next steps
   * @param {string[]} steps - Array of step descriptions
   */
  displayNextSteps(steps) {
    console.log(theme.dim('\nNext steps:'));
    steps.forEach((step, index) => {
      console.log(theme.dim(`  ${index + 1}. ${step}`));
    });
    console.log('');
  },

  /**
   * Display a separator line
   * @param {string} style - 'light' or 'heavy'
   */
  displaySeparator(style = 'light') {
    const width = this.getWidth();
    const char = style === 'heavy' ? BOX.heavyHorizontal : BOX.horizontal;
    console.log(theme.dim(char.repeat(width)));
  },

  /**
   * Theme colors for external use
   */
  theme,

  /**
   * Logo gradient for external use
   */
  logoGradient,

  /**
   * Box characters for external use
   */
  BOX
};

module.exports = CLIUtils;
