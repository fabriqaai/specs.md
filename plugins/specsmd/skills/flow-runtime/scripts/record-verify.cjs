#!/usr/bin/env node
/**
 * Record that a released change was confirmed in a target environment.
 * Usage: node record-verify.cjs <rootPath> --change <boltId> --by "who" --environment "where" --observation "what" [--when ISO] [--release id]
 */
const lib = require('./lib.cjs');

function resolveRelease(root, changeId, preferredId, contract) {
  const releases = lib.listReleases(root, contract);
  if (preferredId) {
    const chosen = releases.find((item) => item.id === preferredId);
    if (!chosen) {
      throw lib.terminal(
        'RELEASE_MISSING',
        `Release "${preferredId}" was not found.`,
        'Pass a release id that exists under docs/specsmd/releases/, or omit --release to use the latest checklist that names this change.'
      );
    }
    if (!lib.splitList(chosen.bolts).includes(changeId)) {
      throw lib.terminal(
        'CHANGE_NOT_ON_RELEASE',
        `Release "${preferredId}" does not name change "${changeId}".`,
        'Pass a change listed on that checklist, or produce a checklist that includes it.'
      );
    }
    return chosen;
  }
  const matches = releases.filter((item) => lib.splitList(item.bolts).includes(changeId));
  if (!matches.length) {
    throw lib.terminal(
      'CHANGE_NOT_RELEASED',
      `Change "${changeId}" is not on a release checklist.`,
      'Run init-release with this completed bolt, then retry record-verify. Completion does not require a release.'
    );
  }
  return matches[matches.length - 1];
}

function recordVerify(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);

  const change = String(opts.change || '').trim();
  const confirmedBy = String(opts.by || opts.confirmedBy || '').trim();
  const environment = String(opts.environment || '').trim();
  const observation = String(opts.observation || '').trim();
  if (!change) {
    throw lib.terminal(
      'CHANGE_REQUIRED',
      'A verification needs a change to confirm.',
      'Pass --change <bolt-id> for the released bolt being confirmed.'
    );
  }
  if (!confirmedBy) {
    throw lib.terminal(
      'CONFIRMED_BY_REQUIRED',
      'A verification needs who or what confirmed the change.',
      'Pass --by "Name (human)" or --by "agent-name".'
    );
  }
  if (!environment) {
    throw lib.terminal(
      'ENVIRONMENT_REQUIRED',
      'A verification needs the target environment.',
      'Pass --environment staging (or production, local, …).'
    );
  }
  if (!observation) {
    throw lib.terminal(
      'OBSERVATION_REQUIRED',
      'A verification needs the observed behavior.',
      'Pass --observation with what a caller can see in that environment.'
    );
  }

  lib.assertBoltId(change);
  const release = resolveRelease(root, change, opts.release, contract);
  const existing = lib.listVerifications(root, release.id, contract);
  const width = contract.identifiers.verification_width || 3;
  const seq = lib.nextPrefixedId(
    existing.map((item) => item.id),
    width
  );
  const id = `${seq}-${lib.kebab(change)}`;
  const confirmedAt = String(opts.when || opts.confirmedAt || '').trim() || lib.nowStamp();
  const file = lib.verificationPath(root, release.id, id, contract);
  const body = [
    `# Verification: ${change}`,
    '',
    `- Confirmed by: ${confirmedBy}`,
    `- When: ${confirmedAt}`,
    `- Environment: ${environment}`,
    `- Change: ${change}`,
    `- Release: ${release.id}`,
    '',
    '## Observation',
    '',
    observation,
    '',
  ].join('\n');

  lib.writeMarkdown(
    file,
    {
      id,
      release: release.id,
      change,
      confirmed_by: confirmedBy,
      confirmed_at: confirmedAt,
      environment,
      observation,
    },
    body,
    root,
    contract
  );

  return {
    id,
    path: file,
    release: release.id,
    change,
    confirmed_by: confirmedBy,
    confirmed_at: confirmedAt,
    environment,
    observation,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return recordVerify(positional[0], {
      change: flags.change,
      by: flags.by,
      environment: flags.environment,
      observation: flags.observation,
      when: flags.when,
      release: flags.release,
    });
  });
}

module.exports = { recordVerify };
