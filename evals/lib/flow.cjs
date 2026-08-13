'use strict';

const fs = require('fs');
const path = require('path');

function scriptsDir(repoRoot) {
  return path.join(repoRoot, 'plugins', 'specsmd', 'skills', 'flow-runtime', 'scripts');
}

function flowAvailable(repoRoot) {
  return fs.existsSync(path.join(scriptsDir(repoRoot), 'init-project.cjs'));
}

function loadFlow(repoRoot) {
  if (!flowAvailable(repoRoot)) return null;
  const dir = scriptsDir(repoRoot);
  /* eslint-disable import/no-dynamic-require, global-require */
  const lib = require(path.join(dir, 'lib.cjs'));
  const { initProject } = require(path.join(dir, 'init-project.cjs'));
  const { initIntent } = require(path.join(dir, 'init-intent.cjs'));
  const { initWorkItem } = require(path.join(dir, 'init-work-item.cjs'));
  const { initBolt, initDraft } = require(path.join(dir, 'init-bolt.cjs'));
  const { updateStage } = require(path.join(dir, 'update-stage.cjs'));
  const { completeBolt } = require(path.join(dir, 'complete-bolt.cjs'));
  const { projectStatus } = require(path.join(dir, 'status.cjs'));
  const { validateIntegrity } = require(path.join(dir, 'validate-integrity.cjs'));
  const { initRelease } = require(path.join(dir, 'init-release.cjs'));
  const { recordVerify } = require(path.join(dir, 'record-verify.cjs'));
  /* eslint-enable import/no-dynamic-require, global-require */
  return {
    lib,
    initProject,
    initIntent,
    initWorkItem,
    initBolt,
    initDraft,
    updateStage,
    completeBolt,
    projectStatus,
    validateIntegrity,
    initRelease,
    recordVerify,
  };
}

module.exports = {
  flowAvailable,
  loadFlow,
  scriptsDir,
};
