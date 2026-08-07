/**
 * Installs specsmd plugin skills into a project's .agents/skills/ directory —
 * the neutral location read by Codex, Cursor, Copilot, Gemini, Zed, and others.
 * Claude Code is covered by a .claude/skills symlink pointing at the same tree.
 *
 * This is the native-skills channel. The legacy flow installer (installer.js)
 * is untouched and remains the path for tools without skill support.
 */

const fs = require('fs-extra');
const path = require('path');

const FLOW_PLUGINS = {
    aidlc: 'specsmd-aidlc',
    fire: 'specsmd-fire',
    ideation: 'specsmd-ideation',
    simple: 'specsmd-simple'
};
const CORE_PLUGIN = 'specsmd-core';
const AGENTS_MARKER = '## specsmd — spec-driven development';

function resolvePluginsRoot() {
    const candidates = [
        path.join(__dirname, '..', 'plugins'), // packaged npm layout (synced at prepack)
        path.join(__dirname, '..', '..', 'plugins') // monorepo dev layout
    ];
    const found = candidates.find((c) => fs.existsSync(path.join(c, CORE_PLUGIN, 'skills')));
    if (!found) {
        throw new Error('specsmd plugins directory not found in the package or repository.');
    }
    return found;
}

function copyPluginSkills(pluginsRoot, plugin, targetDir, installed) {
    const skillsDir = path.join(pluginsRoot, plugin, 'skills');
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (installed.has(entry.name)) {
            throw new Error(`Skill name collision: "${entry.name}" is provided by both ${installed.get(entry.name)} and ${plugin}.`);
        }
        fs.copySync(path.join(skillsDir, entry.name), path.join(targetDir, entry.name));
        installed.set(entry.name, plugin);
    }
}

function ensureClaudeSymlink(cwd) {
    const claudeDir = path.join(cwd, '.claude');
    const link = path.join(claudeDir, 'skills');
    if (fs.existsSync(link)) {
        return fs.lstatSync(link).isSymbolicLink() ? 'exists' : 'skipped-existing-dir';
    }
    fs.ensureDirSync(claudeDir);
    fs.symlinkSync(path.join('..', '.agents', 'skills'), link, 'dir');
    return 'created';
}

function ensureAgentsMd(cwd, pluginsRoot) {
    const fragmentPath = path.join(pluginsRoot, CORE_PLUGIN, 'agents-md', 'AGENTS-fragment.md');
    const fragment = fs.readFileSync(fragmentPath, 'utf8');
    const agentsMd = path.join(cwd, 'AGENTS.md');
    if (!fs.existsSync(agentsMd)) {
        fs.writeFileSync(agentsMd, fragment);
        return 'created';
    }
    const current = fs.readFileSync(agentsMd, 'utf8');
    if (current.includes(AGENTS_MARKER)) {
        return 'exists';
    }
    fs.writeFileSync(agentsMd, `${current.trimEnd()}\n\n${fragment}`);
    return 'appended';
}

/**
 * @param {object} options
 * @param {string[]} options.flows - flow names from FLOW_PLUGINS
 * @param {string} [options.cwd] - project root (default process.cwd())
 * @returns summary of what was installed
 */
function installSkills({ flows, cwd = process.cwd() }) {
    const unknown = flows.filter((f) => !FLOW_PLUGINS[f]);
    if (unknown.length > 0) {
        throw new Error(`Unknown flow(s): ${unknown.join(', ')}. Available: ${Object.keys(FLOW_PLUGINS).join(', ')}.`);
    }
    if (flows.length === 0) {
        throw new Error(`Specify at least one flow (${Object.keys(FLOW_PLUGINS).join(', ')}) or use --all.`);
    }

    const pluginsRoot = resolvePluginsRoot();
    const targetDir = path.join(cwd, '.agents', 'skills');
    fs.ensureDirSync(targetDir);

    const installed = new Map();
    copyPluginSkills(pluginsRoot, CORE_PLUGIN, targetDir, installed);
    for (const flow of flows) {
        copyPluginSkills(pluginsRoot, FLOW_PLUGINS[flow], targetDir, installed);
    }

    return {
        target: targetDir,
        skills: [...installed.keys()].sort(),
        claudeSymlink: ensureClaudeSymlink(cwd),
        agentsMd: ensureAgentsMd(cwd, pluginsRoot)
    };
}

module.exports = { installSkills, FLOW_PLUGINS, resolvePluginsRoot };
