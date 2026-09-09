#!/usr/bin/env node
// SessionStart routes to the unified flow without injecting the full skill.
const fs = require('fs');
const path = require('path');
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
try {
  fs.accessSync(path.join(pluginRoot, 'skills/using-specsmd/SKILL.md'), fs.constants.R_OK);
} catch { process.exit(0); }
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: [
      'The unified specsmd flow is available. Load using-specsmd only when routing product work or resuming its active flow.',
      'Read matching project context; reuse prior answers and task authorization. After compaction, resume from available conversation and artifact state rather than restarting an interview.',
      'Preserve the requested phase and actual approval gates. Ask only about unresolved material choices; continue independent authorized work.',
    ].join(' '),
  },
}));
