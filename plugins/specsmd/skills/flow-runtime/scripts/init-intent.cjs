#!/usr/bin/env node
/**
 * Create an intent brief.
 * Usage: node init-intent.cjs <rootPath> --title "..." [--id slug] [--body-file path]
 */
const fs = require('fs');
const lib = require('./lib.cjs');

function initIntent(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  lib.ensureProject(root, contract);

  const title = opts.title;
  if (!title || !String(title).trim()) {
    throw lib.terminal('TITLE_REQUIRED', 'An intent title is required.', 'Pass --title "the outcome you want".');
  }

  const intentsDir = require('path').join(lib.artifactRoot(root, contract), 'intents');
  const existing = lib.listDirNames(intentsDir);
  const width = contract.identifiers.intent_width;
  let id = lib.normalizePrefixedSlug(opts.id, existing, width);
  if (!id) id = `${lib.nextPrefixedId(existing, width)}-${lib.kebab(title)}`;
  if (existing.includes(id)) {
    throw lib.terminal(
      'INTENT_EXISTS',
      `Intent "${id}" already exists.`,
      'Choose a different --id or omit it to allocate the next number.'
    );
  }

  const file = lib.intentPath(root, id, contract);
  lib.assertInsideRoot(root, file, contract);

  let body = opts.body || '';
  if (opts.bodyFile) {
    body = fs.readFileSync(opts.bodyFile, 'utf8');
  }
  if (!body.trim()) {
    body = `# Intent: ${title}\n\n## Problem\n\n## Outcome\n\n## Scope\n\n## Non-goals\n`;
  }

  const data = {
    id,
    title: String(title).trim(),
    status: 'active',
    created: lib.nowStamp(),
  };
  lib.assertStatus(data.status, contract);
  lib.writeMarkdown(file, data, body.endsWith('\n') ? body : body + '\n', root, contract);

  return { id, path: file, status: data.status, title: data.title };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return initIntent(positional[0], {
      title: flags.title,
      id: flags.id,
      bodyFile: flags['body-file'],
    });
  });
}

module.exports = { initIntent };
