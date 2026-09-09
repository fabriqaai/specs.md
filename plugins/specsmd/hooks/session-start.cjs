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
      'Use using-specsmd only when explicitly requested, continuing a named intent/task/bolt, or coordinating substantial product delivery.',
      'Decide before loading the flow: standalone questions, read-only reviews and small self-contained edits stay direct; the memory-bank directory alone is not a trigger.',
      'When the flow applies, reuse prior answers and authorization. After compaction resume matching artifacts; preserve phase and approval gates.',
    ].join(' '),
  },
}));
