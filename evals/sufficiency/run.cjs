#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  ALLOWED_COMPLEXITY,
  DEFAULT_INTENT,
  deriveSufficiency,
  findWorkItem,
  isoNow,
  listWorkItemFiles,
  loadFindingsFile,
  loadWorkItemFile,
  loadYaml,
  openBlockingFindings,
  parseArgs,
  protocolForComplexity,
  resolveRoot,
  sufficiencyReportAbs,
  sufficiencyReportRel,
  upsertFrontmatterFields,
} = require('../lib/common.cjs');

const PROTOCOLS_DIR = path.join(__dirname, 'protocols');

function readProtocol(protocol) {
  const file = path.join(PROTOCOLS_DIR, protocol.file);
  if (!fs.existsSync(file)) {
    throw new Error(`Protocol file missing: ${file}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function resolveProtocol(item) {
  const complexity = String(item.data.complexity || '').toLowerCase();
  if (!ALLOWED_COMPLEXITY.has(complexity)) {
    throw new Error(
      `Work item ${item.id} has no usable complexity (got ${JSON.stringify(item.data.complexity)}). ` +
        'Record complexity as high, medium, or low before running a sufficiency check.'
    );
  }
  const protocol = protocolForComplexity(complexity);
  if (!protocol) {
    throw new Error(`No sufficiency protocol for complexity ${complexity}.`);
  }
  return { complexity, protocol, body: readProtocol(protocol) };
}

function renderReport({ item, intentId, complexity, protocol, sufficiency, findings, notes, meta, recordedAt }) {
  const blocking = openBlockingFindings(findings);
  const lines = [
    '---',
    `work_item: ${item.id}`,
    `intent: ${intentId}`,
    `complexity: ${complexity}`,
    `protocol: ${protocol.id}`,
    `sufficiency: ${sufficiency}`,
    `recorded_at: ${recordedAt}`,
    '---',
    '',
    `# Sufficiency report: ${item.id}`,
    '',
    `Protocol: ${protocol.label} (${complexity} complexity).`,
    '',
    '## Outcome',
    '',
    sufficiency,
    '',
  ];

  if (notes) {
    lines.push('## Notes', '', notes.trim(), '');
  }

  if (meta && meta.probe) {
    lines.push(`Probe: ${meta.probe}`, '');
  }
  if (meta && meta.judge) {
    lines.push(`Judge: ${meta.judge}`, '');
  }

  lines.push('## Findings', '');
  if (findings.length === 0) {
    lines.push('No findings recorded.', '');
  } else {
    for (const finding of findings) {
      lines.push(`### ${finding.id} — ${finding.class} (${finding.status})`, '');
      if (finding.summary) lines.push(finding.summary, '');
      if (finding.detail) lines.push(finding.detail, '');
      if (finding.resolution) lines.push(`Resolution: ${finding.resolution}`, '');
    }
  }

  lines.push('## Pass bar', '');
  if (sufficiency === 'cleared') {
    lines.push(
      'No open divergence-causing finding remains (no open `divergence` or `contradiction`).',
      'Advisory findings may remain open. Full probe conformance is not the bar.',
      ''
    );
  } else {
    lines.push(
      'Not cleared: unresolved blocking findings remain.',
      ...blocking.map((finding) => `- ${finding.id}: ${finding.summary || finding.class}`),
      ''
    );
  }

  return lines.join('\n');
}

function recordSufficiency(options) {
  const repoRoot = resolveRoot(options.root);
  const yaml = loadYaml(repoRoot);
  const intentId = options.intent || DEFAULT_INTENT;
  const item = findWorkItem(repoRoot, intentId, options.workItem, yaml);
  const { complexity, protocol } = resolveProtocol(item);

  let findings = options.findings || [];
  let meta = options.meta || {};
  if (options.findingsFile) {
    const loaded = loadFindingsFile(options.findingsFile, yaml);
    findings = loaded.findings;
    meta = { ...loaded.meta, ...meta };
  }

  const derived = deriveSufficiency(findings);
  let sufficiency = options.outcome || derived;
  if (sufficiency !== 'cleared' && sufficiency !== 'not-cleared') {
    throw new Error(
      `sufficiency must be cleared or not-cleared (got ${JSON.stringify(sufficiency)}).`
    );
  }

  const blocking = openBlockingFindings(findings);
  if (sufficiency === 'cleared' && blocking.length > 0) {
    const names = blocking.map((finding) => finding.id).join(', ');
    throw new Error(
      `Cannot record sufficiency: cleared while blocking findings are open (${names}). ` +
        'Resolve each divergence/contradiction in the spec, or name it intentional freedom, then re-record. ' +
        `Work item: ${item.file}`
    );
  }

  const recordedAt = options.recordedAt || isoNow();
  const reportAbs = sufficiencyReportAbs(repoRoot, intentId, item.id);
  const reportRel = sufficiencyReportRel(intentId, item.id);
  fs.mkdirSync(path.dirname(reportAbs), { recursive: true });
  fs.writeFileSync(
    reportAbs,
    renderReport({
      item,
      intentId,
      complexity,
      protocol,
      sufficiency,
      findings,
      notes: options.notes || meta.notes || '',
      meta,
      recordedAt,
    }),
    'utf8'
  );

  const updated = upsertFrontmatterFields(item.content, {
    sufficiency,
    sufficiency_report: reportRel,
  });
  fs.writeFileSync(item.file, updated, 'utf8');

  return {
    id: item.id,
    intentId,
    complexity,
    protocol: protocol.id,
    sufficiency,
    reportPath: reportAbs,
    reportRel,
    blocking: blocking.length,
    findings,
  };
}

function listSufficiency(options) {
  const repoRoot = resolveRoot(options.root);
  const yaml = loadYaml(repoRoot);
  const intentId = options.intent || DEFAULT_INTENT;
  return listWorkItemFiles(repoRoot, intentId).map((file) => {
    const item = loadWorkItemFile(file, yaml);
    const id = String(item.data.id || path.basename(file, '.md'));
    const complexity = String(item.data.complexity || '');
    const protocol = protocolForComplexity(complexity);
    return {
      id,
      file,
      complexity: complexity || null,
      protocol: protocol ? protocol.id : null,
      sufficiency: item.data.sufficiency || 'unchecked',
      sufficiency_report: item.data.sufficiency_report || null,
    };
  });
}

function protocolForWorkItem(options) {
  const repoRoot = resolveRoot(options.root);
  const yaml = loadYaml(repoRoot);
  const intentId = options.intent || DEFAULT_INTENT;
  const item = findWorkItem(repoRoot, intentId, options.workItem, yaml);
  const resolved = resolveProtocol(item);
  return {
    id: item.id,
    intentId,
    complexity: resolved.complexity,
    protocol: resolved.protocol,
    body: resolved.body,
    sufficiency: item.data.sufficiency || 'unchecked',
    sufficiency_report: item.data.sufficiency_report || null,
  };
}

function printUsage() {
  return [
    'Usage:',
    '  node evals/sufficiency/run.cjs --work-item <id> [--intent <id>] [--root <dir>]',
    '      Print the protocol the work item\'s complexity requires.',
    '  node evals/sufficiency/run.cjs --work-item <id> --record [--findings <file>] [--outcome cleared|not-cleared]',
    '      Write the report and update work-item frontmatter (sufficiency, sufficiency_report).',
    '  node evals/sufficiency/run.cjs --work-item <id> --status',
    '      Print the recorded sufficiency state.',
    '  node evals/sufficiency/run.cjs --list [--intent <id>]',
    '      List work items and recorded sufficiency.',
    '',
    'Scripts are the only writers of sufficiency state. Do not hand-edit those fields.',
  ].join('\n');
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) {
    console.log(printUsage());
    return 0;
  }

  const options = {
    root: args.root,
    intent: args.intent,
    workItem: args['work-item'] || args._[0],
    findingsFile: args.findings,
    outcome: args.outcome,
    notes: args.notes,
  };

  if (args.list) {
    const rows = listSufficiency(options);
    if (args.json) {
      console.log(JSON.stringify(rows, null, 2));
    } else {
      for (const row of rows) {
        console.log(
          `${row.id}\t${row.complexity || '-'}\t${row.protocol || '-'}\t${row.sufficiency}`
        );
      }
    }
    return 0;
  }

  if (!options.workItem) {
    console.error(printUsage());
    return 1;
  }

  if (args.record) {
    const result = recordSufficiency(options);
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`${result.id}: ${result.sufficiency}`);
      console.log(`report: ${result.reportRel}`);
    }
    return 0;
  }

  const printed = protocolForWorkItem(options);
  if (args.status) {
    const payload = {
      id: printed.id,
      complexity: printed.complexity,
      protocol: printed.protocol.id,
      sufficiency: printed.sufficiency,
      sufficiency_report: printed.sufficiency_report,
    };
    if (args.json) console.log(JSON.stringify(payload, null, 2));
    else {
      console.log(`${payload.id}: ${payload.sufficiency} (${payload.protocol})`);
      if (payload.sufficiency_report) console.log(`report: ${payload.sufficiency_report}`);
    }
    return 0;
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          id: printed.id,
          complexity: printed.complexity,
          protocol: printed.protocol.id,
          sufficiency: printed.sufficiency,
          body: printed.body,
        },
        null,
        2
      )
    );
  } else {
    console.log(`# ${printed.id} — ${printed.complexity} → ${printed.protocol.label}\n`);
    console.log(printed.body);
  }
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv);
  } catch (err) {
    console.error(err.message || err);
    process.exitCode = 1;
  }
}

module.exports = {
  listSufficiency,
  main,
  protocolForWorkItem,
  recordSufficiency,
  renderReport,
  resolveProtocol,
};
