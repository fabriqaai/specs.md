#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { loadYaml, parseArgs, parseFrontmatter, posix, resolveRoot } = require('../lib/common.cjs');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const UNIFIED_PLUGIN = 'specsmd';
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'at', 'by', 'is', 'it',
  'this', 'that', 'with', 'from', 'as', 'be', 'are', 'was', 'do', 'i', 'we', 'you', 'my',
  'me', 'any', 'should', 'what', 'how', 'when', 'where', 'which',
]);

function skillFilePath(repoRoot, skillName) {
  return path.join(repoRoot, 'plugins', UNIFIED_PLUGIN, 'skills', skillName, 'SKILL.md');
}

function loadSkillDescriptions(repoRoot, yaml) {
  const skillsDir = path.join(repoRoot, 'plugins', UNIFIED_PLUGIN, 'skills');
  if (!fs.existsSync(skillsDir)) return [];
  const skills = [];
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = parseFrontmatter(raw, yaml);
    const data = parsed.data || {};
    skills.push({
      name: String(data.name || entry.name),
      description: String(data.description || ''),
      disableModelInvocation: data['disable-model-invocation'] === true,
      file: posix(path.relative(repoRoot, file)),
    });
  }
  return skills;
}

function loadFixtures(yaml) {
  if (!fs.existsSync(FIXTURES_DIR)) return [];
  return fs
    .readdirSync(FIXTURES_DIR)
    .filter((name) => name.endsWith('.yaml') || name.endsWith('.yml'))
    .sort()
    .map((name) => {
      const file = path.join(FIXTURES_DIR, name);
      const data = yaml.load(fs.readFileSync(file, 'utf8')) || {};
      const skill = String(data.skill || data.expected_skill || path.basename(name, path.extname(name)));
      const prompts = (data.prompts || []).map((prompt, index) => ({
        id: String(prompt.id || `${skill}-${index + 1}`),
        text: String(prompt.text || prompt.prompt || ''),
        expected: String(prompt.expected || skill),
      }));
      return { file: name, skill, description: data.description || '', prompts };
    });
}

function stem(token) {
  if (token.length > 4 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !STOPWORDS.has(token) && token.length > 1)
    .map(stem);
}

function scorePromptAgainstSkill(promptText, skill) {
  const promptTokens = new Set(tokenize(promptText));
  const skillTokens = new Set([...tokenize(skill.name), ...tokenize(skill.description)]);
  if (promptTokens.size === 0 || skillTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of promptTokens) {
    if (skillTokens.has(token)) overlap += 1;
  }
  let score = overlap / promptTokens.size;
  for (const token of tokenize(skill.name)) {
    if (promptTokens.has(token)) score += 0.25;
  }
  return score;
}

function predictSkill(promptText, skills) {
  const invocable = skills.filter((skill) => !skill.disableModelInvocation);
  const pool = invocable.length > 0 ? invocable : skills;
  let best = null;
  for (const skill of pool) {
    const score = scorePromptAgainstSkill(promptText, skill);
    if (!best || score > best.score) best = { skill: skill.name, score };
  }
  if (!best || best.score <= 0) return { skill: null, score: 0 };
  return best;
}

function evaluatePrompt({ fixture, prompt, skills, repoRoot }) {
  const expectedPath = skillFilePath(repoRoot, prompt.expected);
  if (!fs.existsSync(expectedPath) || skills.length === 0) {
    return {
      id: prompt.id,
      fixture: fixture.skill,
      prompt: prompt.text,
      expected: prompt.expected,
      predicted: null,
      outcome: 'skipped',
      reason: `Skill file missing: plugins/${UNIFIED_PLUGIN}/skills/${prompt.expected}/SKILL.md`,
    };
  }
  const prediction = predictSkill(prompt.text, skills);
  const pass = prediction.skill === prompt.expected;
  return {
    id: prompt.id,
    fixture: fixture.skill,
    prompt: prompt.text,
    expected: prompt.expected,
    predicted: prediction.skill,
    score: Number(prediction.score.toFixed(3)),
    outcome: pass ? 'pass' : 'fail',
    reason: pass
      ? `Matched ${prompt.expected}`
      : `Predicted ${prediction.skill || 'none'} (expected ${prompt.expected})`,
  };
}

function runTriggerEvals(options = {}) {
  const repoRoot = resolveRoot(options.root);
  const yaml = loadYaml(repoRoot);
  const fixtures = loadFixtures(yaml);
  const skills = loadSkillDescriptions(repoRoot, yaml);
  const results = [];
  for (const fixture of fixtures) {
    for (const prompt of fixture.prompts) {
      results.push(evaluatePrompt({ fixture, prompt, skills, repoRoot }));
    }
  }
  const summary = {
    total: results.length,
    pass: results.filter((row) => row.outcome === 'pass').length,
    fail: results.filter((row) => row.outcome === 'fail').length,
    skipped: results.filter((row) => row.outcome === 'skipped').length,
    skills_found: skills.map((skill) => skill.name),
  };
  return { fixtures: fixtures.map((fixture) => fixture.skill), skills, results, summary };
}

function printUsage() {
  return [
    'Usage:',
    '  node evals/triggers/run.cjs [--root <dir>] [--json]',
    '',
    'Scores canonical prompts against plugins/specsmd skill descriptions.',
    'Missing skill files report skipped — they are not treated as failures.',
  ].join('\n');
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.help || args.h) {
    console.log(printUsage());
    return 0;
  }
  const report = runTriggerEvals({ root: args.root });
  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Trigger evals: ${report.summary.total} prompts`);
    console.log(
      `pass=${report.summary.pass} fail=${report.summary.fail} skipped=${report.summary.skipped}`
    );
    if (report.summary.skills_found.length === 0) {
      console.log('No plugins/specsmd skill files found; all prompts skipped.');
    }
    for (const row of report.results) {
      console.log(`${row.outcome}\t${row.expected}\t${row.id}\t${row.reason}`);
    }
  }
  return report.summary.fail > 0 ? 1 : 0;
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
  evaluatePrompt,
  loadFixtures,
  loadSkillDescriptions,
  predictSkill,
  runTriggerEvals,
  scorePromptAgainstSkill,
  skillFilePath,
  tokenize,
  UNIFIED_PLUGIN,
};
