const fs = require('fs');
const path = require('path');

const SUPPORTED_FLOWS = ['fire', 'aidlc', 'simple'];

function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function getFlowMarkerPath(workspacePath, flow) {
  switch (flow) {
    case 'fire':
      return path.join(workspacePath, '.specs-fire');
    case 'aidlc':
      return path.join(workspacePath, 'memory-bank');
    case 'simple':
      return path.join(workspacePath, 'specs');
    default:
      return null;
  }
}

function detectAvailableFlows(workspacePath) {
  return SUPPORTED_FLOWS.filter((flow) => {
    const markerPath = getFlowMarkerPath(workspacePath, flow);
    return markerPath && directoryExists(markerPath);
  });
}

function detectFlow(workspacePath, explicitFlow) {
  const availableFlows = detectAvailableFlows(workspacePath);

  if (explicitFlow) {
    if (!SUPPORTED_FLOWS.includes(explicitFlow)) {
      const valid = SUPPORTED_FLOWS.join(', ');
      throw new Error(`Invalid flow \"${explicitFlow}\". Valid options: ${valid}`);
    }

    const markerPath = getFlowMarkerPath(workspacePath, explicitFlow);
    const exists = markerPath ? directoryExists(markerPath) : false;

    return {
      flow: explicitFlow,
      source: 'flag',
      markerPath,
      detected: exists,
      availableFlows,
      warning: exists
        ? undefined
        : `Flow \"${explicitFlow}\" was selected explicitly but ${markerPath} was not found.`
    };
  }

  for (const flow of SUPPORTED_FLOWS) {
    const markerPath = getFlowMarkerPath(workspacePath, flow);
    if (markerPath && directoryExists(markerPath)) {
      return {
        flow,
        source: 'auto',
        markerPath,
        detected: true,
        availableFlows
      };
    }
  }

  return {
    flow: null,
    source: 'auto',
    markerPath: null,
    detected: false,
    availableFlows
  };
}

module.exports = {
  SUPPORTED_FLOWS,
  directoryExists,
  getFlowMarkerPath,
  detectAvailableFlows,
  detectFlow
};
