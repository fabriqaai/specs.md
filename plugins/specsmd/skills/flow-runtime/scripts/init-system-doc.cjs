#!/usr/bin/env node
/**
 * Register a semantic system/ document. Registration is the document itself.
 * Usage: node init-system-doc.cjs <rootPath> --id auth --name "Auth" --purpose "..." --claimed-scope auth
 */
const path = require('path');
const lib = require('./lib.cjs');
const memory = require('./memory-lib.cjs');

function initSystemDoc(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  lib.ensureProject(root, contract);

  const id = lib.kebab(opts.id || opts.name);
  if (!id) {
    throw lib.terminal('ID_REQUIRED', 'A system document id is required.', 'Pass --id auth (or --name Auth).');
  }
  lib.assertSafeId(id, 'system document id');

  const name = opts.name || id;
  const purpose = opts.purpose;
  if (!purpose || !String(purpose).trim()) {
    throw lib.terminal(
      'PURPOSE_REQUIRED',
      'A system document needs a purpose.',
      'Pass --purpose "what current truth this document states".'
    );
  }
  const claimedScope = lib.splitList(opts.claimedScope);
  if (!claimedScope.length) {
    throw lib.terminal(
      'SCOPE_REQUIRED',
      'A system document needs a claimed scope.',
      'Pass --claimed-scope auth,identity (topics this document is truth for).'
    );
  }

  const file = path.join(lib.artifactRoot(root, contract), 'system', `${id}.md`);
  if (require('fs').existsSync(file)) {
    throw lib.terminal(
      'SYSTEM_DOC_EXISTS',
      `System document "${id}" already exists.`,
      `Update ${memory.projectRel(root, file)} or choose a different --id.`
    );
  }

  const data = {
    id,
    name: String(name).trim(),
    purpose: String(purpose).trim(),
    claimed_scope: claimedScope,
    status: 'active',
    created: lib.nowStamp(),
    last_verified: null,
    verified_by: null,
  };
  if (opts.facts) data.facts = opts.facts;
  if (opts.claims) data.claims = opts.claims;

  const body =
    opts.body ||
    `# ${data.name}\n\n${data.purpose}\n\nClaimed scope: ${claimedScope.join(', ')}.\n`;
  lib.writeMarkdown(file, data, body.endsWith('\n') ? body : `${body}\n`, root, contract);
  return {
    id,
    path: memory.projectRel(root, file),
    name: data.name,
    purpose: data.purpose,
    claimed_scope: claimedScope,
    memory_class: lib.memoryClassFor('system', data.status, contract),
  };
}

function parseJsonFlag(raw, label) {
  if (raw == null || raw === true) return undefined;
  try {
    return JSON.parse(String(raw));
  } catch {
    throw lib.terminal(
      'JSON_INVALID',
      `${label} is not valid JSON.`,
      `Pass ${label} as JSON, e.g. --claims-json '[{"path":"src/auth.js","contains":"oauth"}]' or --facts-json '{"provider":"oauth"}'.`
    );
  }
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return initSystemDoc(positional[0], {
      id: flags.id,
      name: flags.name,
      purpose: flags.purpose,
      claimedScope: flags['claimed-scope'],
      facts: parseJsonFlag(flags['facts-json'] || flags.facts, '--facts-json'),
      claims: parseJsonFlag(flags['claims-json'] || flags.claims, '--claims-json'),
      body: flags.body,
    });
  });
}

module.exports = { initSystemDoc };
