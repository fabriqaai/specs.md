#!/usr/bin/env node
/**
 * Produce a release checklist over completed bolts.
 * Usage: node init-release.cjs <rootPath> [--bolts id1,id2] [--title "..."] [--id slug]
 */
const fs = require('fs');
const path = require('path');
const lib = require('./lib.cjs');
const { projectStatus } = require('./status.cjs');

function isPlaceholder(text) {
  const t = String(text || '').trim();
  if (!t) return true;
  if (/^\{[^}]+\}$/.test(t)) return true;
  if (/^(none|n\/a|\(none\)|not yet recorded)\.?$/i.test(t)) return true;
  return false;
}

function findingsFromSection(section, source, severity) {
  if (isPlaceholder(section)) return [];
  const findings = [];
  const lines = section.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bullets = lines.filter((line) => /^[-*]\s+/.test(line));
  const items = bullets.length ? bullets.map((line) => line.replace(/^[-*]\s+/, '').trim()) : [section.trim()];
  for (const item of items) {
    if (isPlaceholder(item)) continue;
    findings.push({ source, severity, summary: item });
  }
  return findings;
}

function findingsFromReview(body) {
  return [
    ...findingsFromSection(lib.extractMarkdownSection(body, 'Load-bearing'), 'review-report.md', 'error'),
    ...findingsFromSection(lib.extractMarkdownSection(body, 'Advisory'), 'review-report.md', 'advisory'),
  ];
}

function findingsFromFindingsMd(body) {
  if (isPlaceholder(body)) return [];
  const learned =
    lib.extractMarkdownSection(body, 'What we learned') ||
    lib.extractMarkdownSection(body, 'What was learned') ||
    body;
  if (isPlaceholder(learned) || /\(not yet recorded\)/.test(learned)) return [];
  const first = learned
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .find((line) => line && !isPlaceholder(line));
  if (!first) return [];
  return [{ source: 'findings.md', severity: 'advisory', summary: first }];
}

function collectBoltSlice(root, boltId, contract) {
  const dir = lib.boltDir(root, boltId, contract);
  const walkthroughFile = path.join(dir, 'walkthrough.md');
  const testReportFile = path.join(dir, 'test-report.md');
  const reviewFile = path.join(dir, 'review-report.md');
  const findingsFile = path.join(dir, 'findings.md');

  const walkthrough = lib.readLooseMarkdown(walkthroughFile);
  const review = lib.readLooseMarkdown(reviewFile);
  const findingsMd = lib.readLooseMarkdown(findingsFile);

  const whatChanged = walkthrough.missing
    ? ''
    : lib.extractMarkdownSection(walkthrough.body, 'What changed');
  const howToVerify = walkthrough.missing
    ? ''
    : lib.extractMarkdownSection(walkthrough.body, 'How to verify');

  const outstanding = [];
  if (!review.missing) outstanding.push(...findingsFromReview(review.body));
  if (!findingsMd.missing) outstanding.push(...findingsFromFindingsMd(findingsMd.body));

  return {
    bolt: boltId,
    what_changed: whatChanged,
    evidence: {
      walkthrough: !walkthrough.missing,
      test_report: fs.existsSync(testReportFile),
      how_to_verify: howToVerify,
    },
    outstanding_findings: outstanding,
  };
}

function decisionsSince(root, contract, lastCreated) {
  const all = lib.listDecisions(root, contract);
  const inForce = lib.inForceDecisionIds(root, contract);
  const allow = new Set(inForce);
  return all
    .filter((decision) => {
      if (decision.status === 'abandoned') return false;
      if (allow.size && !allow.has(decision.id)) return false;
      if (!lastCreated) return true;
      return String(decision.created || '') > String(lastCreated);
    })
    .map((decision) => ({
      id: decision.id,
      title: decision.title || decision.id,
      consult_when: decision.consult_when || '',
      created: decision.created || null,
    }));
}

function formatEvidence(evidence) {
  return [
    `- walkthrough.md: ${evidence.walkthrough ? 'present' : 'missing'}`,
    `- test-report.md: ${evidence.test_report ? 'present' : 'missing'}`,
    `- How to verify: ${evidence.how_to_verify || '(not recorded)'}`,
  ].join('\n');
}

function formatFindings(findings) {
  if (!findings.length) return 'none';
  return findings
    .map((finding) => `- ${finding.severity} (${finding.source}${finding.bolt ? `, ${finding.bolt}` : ''}): ${finding.summary}`)
    .join('\n');
}

function buildBody(title, changes, projectFindings, decisions, previousRelease) {
  const sections = [`# Release checklist: ${title}`, ''];
  for (const change of changes) {
    sections.push(`## Bolt \`${change.bolt}\``, '');
    sections.push('### What changed', '', change.what_changed || '(not recorded)', '');
    sections.push('### Verification evidence', '', formatEvidence(change.evidence), '');
    sections.push('### Outstanding findings', '', formatFindings(change.outstanding_findings), '');
  }
  sections.push('## Integrity and standards findings', '', formatFindings(projectFindings), '');
  sections.push('## Decisions since last checklist', '');
  if (!decisions.length) {
    sections.push(previousRelease ? `none since \`${previousRelease}\`` : 'none', '');
  } else {
    for (const decision of decisions) {
      const consult = decision.consult_when ? ` — consult when: ${decision.consult_when}` : '';
      sections.push(`- \`${decision.id}\`${consult}`);
    }
    sections.push('');
  }
  return sections.join('\n');
}

function initRelease(rootPath, opts) {
  const contract = lib.loadContract();
  const root = lib.assertRoot(rootPath);
  lib.ensureProject(root, contract);

  const bolts = lib.listBolts(root, contract);
  const releases = lib.listReleases(root, contract);
  const released = lib.releasedBoltMap(releases);
  const requested = lib.splitList(opts.bolts || opts.workItems);
  let boltIds = requested.slice();
  if (!boltIds.length) {
    boltIds = bolts.filter((bolt) => bolt.status === 'complete' && !released.has(bolt.id)).map((bolt) => bolt.id);
  }
  if (!boltIds.length) {
    throw lib.terminal(
      'RELEASE_EMPTY',
      'No completed bolts were given for a release checklist.',
      'Pass --bolts with completed bolt ids, or complete a bolt first. Release is optional; skip this if the project does not ship this way.'
    );
  }

  const selected = [];
  for (const boltId of boltIds) {
    const bolt = bolts.find((item) => item.id === boltId);
    if (!bolt) {
      throw lib.terminal(
        'BOLT_MISSING',
        `Bolt "${boltId}" was not found.`,
        'Pass ids from docs/specsmd/bolts/ that already exist.'
      );
    }
    if (bolt.status !== 'complete') {
      throw lib.terminal(
        'BOLT_NOT_COMPLETE',
        `Bolt "${boltId}" is ${bolt.status} and cannot join a release checklist.`,
        'Complete the bolt first, or omit it from --bolts. Completion and release stay independent.'
      );
    }
    selected.push(bolt);
  }

  const previous = releases.length ? releases[releases.length - 1] : null;
  const changes = selected.map((bolt) => collectBoltSlice(root, bolt.id, contract));

  const statusReport = projectStatus(root);
  const projectFindings = (statusReport.health || []).map((finding) => ({
    source: finding.code || 'health',
    severity: finding.severity || 'advisory',
    summary: finding.message,
    bolt: null,
  }));

  const standardsFindings = [];
  for (const change of changes) {
    for (const finding of change.outstanding_findings) {
      if (finding.source === 'review-report.md' && finding.severity === 'error') {
        standardsFindings.push({ ...finding, bolt: change.bolt });
      }
    }
  }
  const outstanding = [
    ...changes.flatMap((change) => change.outstanding_findings.map((finding) => ({ ...finding, bolt: change.bolt }))),
    ...projectFindings,
  ];

  const decisions = decisionsSince(root, contract, previous && previous.created);
  const releasesDir = path.join(lib.artifactRoot(root, contract), 'releases');
  fs.mkdirSync(releasesDir, { recursive: true });
  const existing = lib.listDirNames(releasesDir);
  const width = contract.identifiers.release_width || contract.identifiers.intent_width || 3;
  const title = String(opts.title || '').trim() || `Release of ${selected.length} bolt${selected.length === 1 ? '' : 's'}`;
  let id = lib.normalizePrefixedSlug(opts.id, existing, width);
  if (!id) id = `${lib.nextPrefixedId(existing, width)}-${lib.kebab(title)}`;
  if (existing.includes(id)) {
    throw lib.terminal(
      'RELEASE_EXISTS',
      `Release "${id}" already exists.`,
      'Choose a different --id or omit it to allocate the next number.'
    );
  }

  const created = lib.nowStamp();
  const file = lib.releasePath(root, id, contract);
  const body = buildBody(title, changes, [...projectFindings, ...standardsFindings], decisions, previous && previous.id);
  lib.writeMarkdown(
    file,
    {
      id,
      title,
      status: 'complete',
      bolts: selected.map((bolt) => bolt.id),
      previous_release: previous ? previous.id : null,
      created,
    },
    body,
    root,
    contract
  );

  return {
    id,
    path: file,
    title,
    status: 'complete',
    bolts: selected.map((bolt) => bolt.id),
    changes,
    outstanding_findings: outstanding,
    standards_findings: standardsFindings,
    decisions_since_last: decisions,
    previous_release: previous ? previous.id : null,
    created,
  };
}

if (require.main === module) {
  lib.runMain(() => {
    const { positional, flags } = lib.parseArgs(process.argv);
    return initRelease(positional[0], {
      bolts: flags.bolts,
      title: flags.title,
      id: flags.id,
    });
  });
}

module.exports = { initRelease };
