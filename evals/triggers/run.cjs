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
  'me', 'any', 'should', 'what', 'how', 'when', 'where', 'which', 'other', 'every',
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
      const signatures = (data.signatures || []).map((item) => String(item).trim()).filter(Boolean);
      const prompts = (data.prompts || []).map((prompt, index) => ({
        id: String(prompt.id || `${skill}-${index + 1}`),
        text: String(prompt.text || prompt.prompt || ''),
        expected: String(prompt.expected || skill),
      }));
      return { file: name, skill, description: data.description || '', signatures, prompts };
    });
}

function includesPhrase(haystack, phrase) {
  return String(haystack).toLowerCase().includes(String(phrase).toLowerCase());
}

function words(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && token.length > 3 && !STOPWORDS.has(token));
}

function signaturesForSkill(skillName, fixtures) {
  const fixture = fixtures.find((entry) => entry.skill === skillName);
  return fixture ? fixture.signatures.slice() : [];
}

function uniqueVocabulary(fixtures) {
  const counts = new Map();
  for (const fixture of fixtures) {
    const seen = new Set(words(fixture.signatures.join(' ')));
    for (const token of seen) counts.set(token, (counts.get(token) || 0) + 1);
  }
  const unique = new Map();
  for (const fixture of fixtures) {
    unique.set(
      fixture.skill,
      words(fixture.signatures.join(' ')).filter((token) => counts.get(token) === 1)
    );
  }
  return unique;
}

function wordPresent(promptWords, token) {
  if (promptWords.has(token)) return true;
  if (token.endsWith('s') && promptWords.has(token.slice(0, -1))) return true;
  if (promptWords.has(`${token}s`)) return true;
  return false;
}

function scorePromptAgainstSkill(promptText, skillName, fixtures, vocab) {
  const signatures = signaturesForSkill(skillName, fixtures);
  const promptWords = new Set(words(promptText));
  const unique = new Set((vocab && vocab.get(skillName)) || []);
  let uniqueHits = 0;
  for (const token of unique) {
    if (wordPresent(promptWords, token)) uniqueHits += 1;
  }
  let phraseHits = 0;
  for (const phrase of signatures) {
    if (phrase.trim().split(/\s+/).length >= 4 && includesPhrase(promptText, phrase)) phraseHits += 2;
  }
  if (includesPhrase(promptText, skillName)) uniqueHits += 1;
  return { score: uniqueHits + phraseHits, uniqueHits, phraseHits };
}

function predictSkill(promptText, skills, options = {}) {
  const fixtures = options.fixtures || [];
  const vocab = uniqueVocabulary(fixtures);
  const invocable = skills.filter((skill) => !skill.disableModelInvocation);
  const pool = invocable.length > 0 ? invocable : skills;
  const scored = pool.map((skill) => {
    const detail = scorePromptAgainstSkill(promptText, skill.name, fixtures, vocab);
    return { skill: skill.name, score: detail.score, uniqueHits: detail.uniqueHits };
  });
  scored.sort((a, b) => b.score - a.score || a.skill.localeCompare(b.skill));
  const best = scored[0] || { skill: null, score: 0 };
  const second = scored[1] || { score: -1 };
  const tied = Boolean(best.skill && second.skill && best.score === second.score);
  if (!best.skill || best.score <= 0 || tied) {
    return { skill: null, score: best.score || 0, tied, ranked: scored };
  }
  return { skill: best.skill, score: best.score, tied: false, ranked: scored };
}

function descriptionCarriesSignatures(description, signatures) {
  const missing = signatures.filter((phrase) => !includesPhrase(description, phrase));
  return { ok: missing.length === 0, missing };
}

function evaluatePrompt({ fixture, prompt, skills, fixtures, repoRoot }) {
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

  const expectedSkill = skills.find((skill) => skill.name === prompt.expected);
  if (!expectedSkill) {
    return {
      id: prompt.id,
      fixture: fixture.skill,
      prompt: prompt.text,
      expected: prompt.expected,
      predicted: null,
      outcome: 'fail',
      reason: `Expected skill ${prompt.expected} is not among loaded descriptions.`,
    };
  }

  const drift = descriptionCarriesSignatures(expectedSkill.description, fixture.signatures);
  if (!drift.ok) {
    return {
      id: prompt.id,
      fixture: fixture.skill,
      prompt: prompt.text,
      expected: prompt.expected,
      predicted: null,
      outcome: 'fail',
      reason: `Shipped description for ${prompt.expected} dropped signature phrases: ${drift.missing.join('; ')}`,
    };
  }

  for (const other of fixtures) {
    if (other.skill === prompt.expected) continue;
    const stolen = other.signatures.filter(
      (phrase) => phrase.trim().split(/\s+/).length >= 4 && includesPhrase(prompt.text, phrase)
    );
    if (stolen.length > 0) {
      return {
        id: prompt.id,
        fixture: fixture.skill,
        prompt: prompt.text,
        expected: prompt.expected,
        predicted: other.skill,
        outcome: 'fail',
        reason: `Prompt contains ${other.skill} signature phrase(s): ${stolen.join('; ')}`,
      };
    }
  }

  const prediction = predictSkill(prompt.text, skills, { fixtures });
  const pass = prediction.skill === prompt.expected;
  return {
    id: prompt.id,
    fixture: fixture.skill,
    prompt: prompt.text,
    expected: prompt.expected,
    predicted: prediction.skill,
    score: Number((prediction.score || 0).toFixed(3)),
    tied: Boolean(prediction.tied),
    outcome: pass ? 'pass' : 'fail',
    reason: pass
      ? `Matched ${prompt.expected} by unique signature vocabulary`
      : prediction.tied
        ? `Tie between skills (expected ${prompt.expected})`
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
      results.push(evaluatePrompt({ fixture, prompt, skills, fixtures, repoRoot }));
    }
  }
  const summary = {
    total: results.length,
    pass: results.filter((row) => row.outcome === 'pass').length,
    fail: results.filter((row) => row.outcome === 'fail').length,
    skipped: results.filter((row) => row.outcome === 'skipped').length,
    skills_found: skills.map((skill) => skill.name),
    method: 'unique-signature-vocabulary',
  };
  return { fixtures: fixtures.map((fixture) => fixture.skill), skills, results, summary };
}

function printUsage() {
  return [
    'Usage:',
    '  node evals/triggers/run.cjs [--root <dir>] [--json]',
    '',
    'Holdout for model-invocable descriptions. Each fixture names signature',
    'phrases that must remain in the shipped description. A prompt passes when',
    'those phrases still exist, the prompt does not quote another skill\'s',
    'signatures, and unique vocabulary from the expected skill wins.',
    'This is not a model router. Missing skill files report skipped.',
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
    console.log(`Trigger evals: ${report.summary.total} prompts (${report.summary.method})`);
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
  descriptionCarriesSignatures,
  evaluatePrompt,
  loadFixtures,
  loadSkillDescriptions,
  predictSkill,
  runTriggerEvals,
  scorePromptAgainstSkill,
  skillFilePath,
  UNIFIED_PLUGIN,
};
