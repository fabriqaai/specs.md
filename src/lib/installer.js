const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');
const yaml = require('js-yaml');
const CLIUtils = require('./cli-utils');
const InstallerFactory = require('./InstallerFactory');
const { FLOWS } = require('./constants');
const analytics = require('./analytics');

// Use theme from CLIUtils for consistent styling
const { theme } = CLIUtils;

/**
 * Categorize an error for analytics tracking
 * @param {Error} error - The error to categorize
 * @returns {string} Error category
 */
function categorizeError(error) {
    const message = (error.message || '').toLowerCase();

    if (message.includes('permission') || message.includes('eacces')) {
        return 'file_permission';
    }
    if (message.includes('enoent') || message.includes('not found')) {
        return 'file_not_found';
    }
    if (message.includes('network') || message.includes('enotfound') || message.includes('timeout')) {
        return 'network';
    }
    if (message.includes('enospc') || message.includes('disk')) {
        return 'disk_space';
    }
    return 'unknown';
}

/**
 * Count files in a directory recursively
 * @param {string} dir - Directory path
 * @returns {Promise<number>} File count
 */
async function countFiles(dir) {
    let count = 0;
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                count += await countFiles(path.join(dir, entry.name));
            } else {
                count++;
            }
        }
    } catch {
        // Ignore errors (directory might not exist)
    }
    return count;
}

async function detectTools() {
  const detected = [];
  const installers = InstallerFactory.getInstallers();

  for (const installer of installers) {
    if (await installer.detect()) {
      detected.push(installer.key);
    }
  }
  return detected;
}

async function install() {
  // Initialize analytics (respects opt-out env vars)
  analytics.init();
  await analytics.trackInstallerStarted();

  const installStartTime = Date.now();

  await CLIUtils.displayLogo();
  CLIUtils.displayHeader('Installation', '');

  // Step 1: Detect agentic coding tools
  const detectedToolKeys = await detectTools();
  const installers = InstallerFactory.getInstallers();
  const detectedNames = installers
    .filter(i => detectedToolKeys.includes(i.key))
    .map(i => i.name);

  CLIUtils.displayStep(1, 4, 'Detecting agentic coding tools...');
  if (detectedNames.length > 0) {
    CLIUtils.displayStatus('', `Detected: ${detectedNames.join(', ')}`, 'success');
  } else {
    CLIUtils.displayStatus('', 'No agentic coding tools detected', 'warning');
  }
  console.log('');

  // Step 2: Select tools
  CLIUtils.displayStep(2, 4, 'Select target tools');

  // Build choices with descriptive formatting
  const toolChoices = installers.map(installer => ({
    title: installer.name + (detectedToolKeys.includes(installer.key) ? theme.dim(' (detected)') : ''),
    value: installer.key,
    selected: detectedToolKeys.includes(installer.key)
  }));

  console.log(theme.dim('  [Space] toggle  [Enter] confirm  [a] toggle all'));
  console.log(theme.dim(`  ${theme.success('[x]')} = selected    ${theme.dim('[ ]')} = not selected\n`));

  const { selectedToolKeys } = await prompts({
    type: 'multiselect',
    name: 'selectedToolKeys',
    message: 'Choose tools:',
    choices: toolChoices,
    min: 1,
    instructions: false
  });

  if (!selectedToolKeys || selectedToolKeys.length === 0) {
    CLIUtils.displayError('Installation cancelled - no tools selected');
    process.exit(1);
  }

  // Track IDE selection (await to ensure delivery before potential cancel)
  await analytics.trackIdesConfirmed(selectedToolKeys);

  // Step 3: Select Flow
  console.log('');
  CLIUtils.displayStep(3, 4, 'Select SDLC flow');
  const flowChoices = Object.entries(FLOWS).map(([key, flow]) => ({
    title: `${flow.name} - ${flow.description}${flow.message || ''}`,
    value: key,
    disabled: flow.disabled
  }));

  const { selectedFlow } = await prompts({
    type: 'select',
    name: 'selectedFlow',
    message: 'Which SDLC flow would you like to install?',
    choices: flowChoices
  });

  if (!selectedFlow) {
    CLIUtils.displayError('Installation cancelled');
    process.exit(1);
  }

  // Track flow selection (await to ensure delivery before potential cancel)
  await analytics.trackFlowSelected(selectedFlow);

  // Step 4: Install flow files
  console.log('');
  CLIUtils.displayStep(4, 4, `Installing ${FLOWS[selectedFlow].name} flow...`);

  try {
    const filesCreated = await installFlow(selectedFlow, selectedToolKeys);

    // Track successful installation for each tool
    const durationMs = Date.now() - installStartTime;
    for (const toolKey of selectedToolKeys) {
      analytics.trackInstallationCompleted(toolKey, selectedFlow, durationMs, filesCreated);
    }

    CLIUtils.displaySuccess(`${FLOWS[selectedFlow].name} flow installed successfully!`, 'Installation Complete');

    // Get selected tool names for next steps message
    const selectedToolNames = installers
      .filter(i => selectedToolKeys.includes(i.key))
      .map(i => i.name);

    const nextSteps = [
      `Read .specsmd/${selectedFlow}/quick-start.md for getting started`,
      `Open ${selectedToolNames.join(' or ')} and run /specsmd-master-agent`
    ];
    CLIUtils.displayNextSteps(nextSteps);
  } catch (error) {
    // Track installation failure
    const errorCategory = categorizeError(error);
    for (const toolKey of selectedToolKeys) {
      analytics.trackInstallationFailed(toolKey, errorCategory, selectedFlow);
    }

    CLIUtils.displayError(`Installation failed: ${error.message}`);
    console.log(theme.dim('\nRolling back changes...'));
    await rollback(selectedFlow, selectedToolKeys);
    CLIUtils.displayStatus('', 'Installation rolled back', 'warning');
    process.exit(1);
  }
}

async function installFlow(flowKey, toolKeys) {
  const flowPath = path.join(__dirname, '..', 'flows', FLOWS[flowKey].path);

  // Step 1: Install commands for each tool
  // Pass empty config since config.yaml is removed
  const dummyConfig = {};
  for (const toolKey of toolKeys) {
    const installer = InstallerFactory.getInstaller(toolKey);
    if (installer) {
      await installer.installCommands(flowPath, dummyConfig);
    }
  }

  // Step 2: Install shared flow config
  const specsmdDir = '.specsmd';
  const targetFlowDir = path.join(specsmdDir, flowKey);

  console.log(theme.dim(`  Installing flow resources to ${targetFlowDir}/...`));
  await fs.ensureDir(targetFlowDir);

  // Copy agents
  await fs.copy(path.join(flowPath, 'agents'), path.join(targetFlowDir, 'agents'));

  // Copy internal agent capabilities (legacy check)
  if (await fs.pathExists(path.join(flowPath, 'agent-capabilities'))) {
    await fs.copy(path.join(flowPath, 'agent-capabilities'), path.join(targetFlowDir, 'agent-capabilities'));
  }

  // Copy bolt-types if they exist (legacy check)
  if (await fs.pathExists(path.join(flowPath, 'bolt-types'))) {
    await fs.copy(path.join(flowPath, 'bolt-types'), path.join(targetFlowDir, 'bolt-types'));
  }

  // Copy skills, templates, shared (now at flow root level, not nested in .specsmd)
  if (await fs.pathExists(path.join(flowPath, 'skills'))) {
    await fs.copy(path.join(flowPath, 'skills'), path.join(targetFlowDir, 'skills'));
  }
  if (await fs.pathExists(path.join(flowPath, 'templates'))) {
    await fs.copy(path.join(flowPath, 'templates'), path.join(targetFlowDir, 'templates'));
  }
  if (await fs.pathExists(path.join(flowPath, 'shared'))) {
    await fs.copy(path.join(flowPath, 'shared'), path.join(targetFlowDir, 'shared'));
  }

  // Copy config files
  if (await fs.pathExists(path.join(flowPath, 'memory-bank.yaml'))) {
    await fs.copy(path.join(flowPath, 'memory-bank.yaml'), path.join(targetFlowDir, 'memory-bank.yaml'));
  }
  if (await fs.pathExists(path.join(flowPath, 'context-config.yaml'))) {
    await fs.copy(path.join(flowPath, 'context-config.yaml'), path.join(targetFlowDir, 'context-config.yaml'));
  }
  if (await fs.pathExists(path.join(flowPath, 'quick-start.md'))) {
    await fs.copy(path.join(flowPath, 'quick-start.md'), path.join(targetFlowDir, 'quick-start.md'));
  }

  // Copy docs
  await fs.copy(path.join(flowPath, 'README.md'), path.join(targetFlowDir, 'README.md'));

  if (await fs.pathExists(path.join(flowPath, 'constitution.md'))) {
    await fs.copy(path.join(flowPath, 'constitution.md'), path.join(targetFlowDir, 'constitution.md'));
  }

  CLIUtils.displayStatus('', 'Installed flow resources', 'success');

  // Step 2.5: Install local scripts for deterministic operations
  // These scripts are version-matched to the installed specsmd version
  const scriptsDir = path.join(specsmdDir, 'scripts');
  await fs.ensureDir(scriptsDir);

  const sourceScriptsDir = path.join(__dirname, '..', 'scripts');
  if (await fs.pathExists(sourceScriptsDir)) {
    await fs.copy(sourceScriptsDir, scriptsDir);
    CLIUtils.displayStatus('', 'Installed local scripts', 'success');
  }

  // Note: Scripts are invoked directly via relative path (e.g., node .specsmd/scripts/bolt-complete.js)
  // No npm scripts added to package.json to avoid dependency on package.json for execution

  // NOTE: memory-bank/ is NOT created during installation
  // It will be created when user runs project-init
  // This allows us to detect if project is initialized by checking for memory-bank/standards/

  // Step 3: Create manifest
  const manifest = {
    flow: flowKey,
    version: require('../package.json').version,
    installed_at: new Date().toISOString(),
    tools: toolKeys
  };

  await fs.writeFile(
    path.join(specsmdDir, 'manifest.yaml'),
    yaml.dump(manifest),
    'utf8'
  );

  CLIUtils.displayStatus('', 'Created installation manifest', 'success');

  // Count files created for analytics
  const filesCreated = await countFiles(specsmdDir);
  return filesCreated;
}

async function rollback(flowKey, toolKeys) {
  // Remove tool command files
  for (const toolKey of toolKeys) {
    const installer = InstallerFactory.getInstaller(toolKey);
    if (installer) {
      const commandsDir = installer.commandsDir;
      if (await fs.pathExists(commandsDir)) {
        const files = await fs.readdir(commandsDir);
        for (const file of files) {
          if (file.startsWith('specsmd-')) {
            await fs.remove(path.join(commandsDir, file));
          }
        }
      }
    }
  }

  // Remove .specsmd directory
  if (await fs.pathExists('.specsmd')) {
    await fs.remove('.specsmd');
  }
}

async function uninstall() {
  CLIUtils.displayHeader('Uninstall', '');

  // Check if specsmd is installed
  if (!await fs.pathExists('.specsmd/manifest.yaml')) {
    CLIUtils.displayWarning('specsmd is not installed in this project');
    return;
  }

  // Read manifest
  const manifestContent = await fs.readFile('.specsmd/manifest.yaml', 'utf8');
  const manifest = yaml.load(manifestContent);

  const installers = InstallerFactory.getInstallers();
  // Support both old 'ides' key and new 'tools' key for backward compatibility
  const installedToolKeys = manifest.tools || manifest.ides || [];
  const installedNames = installers
    .filter(i => installedToolKeys.includes(i.key))
    .map(i => i.name);

  console.log(theme.dim(`Found installation: ${FLOWS[manifest.flow].name} flow`));
  console.log(theme.dim(`Installed for: ${installedNames.join(', ')}\n`));

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Are you sure you want to uninstall specsmd?',
    initial: false
  });

  if (!confirm) {
    CLIUtils.displayStatus('', 'Uninstall cancelled', 'warning');
    return;
  }

  // Ask about memory bank
  const { keepMemoryBank } = await prompts({
    type: 'confirm',
    name: 'keepMemoryBank',
    message: 'Keep memory-bank folder? (Contains your project artifacts)',
    initial: true
  });

  console.log(theme.primary('\nUninstalling...\n'));

  try {
    // Remove command files
    for (const toolKey of installedToolKeys) {
      const installer = InstallerFactory.getInstaller(toolKey);
      if (installer) {
        const commandsDir = installer.commandsDir;
        if (await fs.pathExists(commandsDir)) {
          console.log(theme.dim(`  Removing commands from ${commandsDir}/...`));
          const files = await fs.readdir(commandsDir);
          for (const file of files) {
            if (file.startsWith('specsmd-')) {
              await fs.remove(path.join(commandsDir, file));
            }
          }
        }
      }
    }

    // Remove .specsmd directory
    console.log(theme.dim('  Removing .specsmd/...'));
    await fs.remove('.specsmd');

    // Optionally remove memory-bank
    if (!keepMemoryBank && await fs.pathExists('memory-bank')) {
      console.log(theme.dim('  Removing memory-bank/...'));
      await fs.remove('memory-bank');
    }

    CLIUtils.displaySuccess('Uninstall complete!', 'Complete');
    if (keepMemoryBank) {
      console.log(theme.dim('memory-bank/ was preserved\n'));
    }
  } catch (error) {
    CLIUtils.displayError(`Uninstall failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  install,
  uninstall
};

