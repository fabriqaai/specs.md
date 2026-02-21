function createInitialUIState() {
  return {
    view: 'runs',
    showHelp: false
  };
}

function cycleView(current) {
  if (current === 'runs') {
    return 'intents';
  }
  if (current === 'intents') {
    return 'completed';
  }
  if (current === 'completed') {
    return 'health';
  }
  return 'runs';
}

function cycleViewBackward(current) {
  if (current === 'runs') {
    return 'health';
  }
  if (current === 'intents') {
    return 'runs';
  }
  if (current === 'completed') {
    return 'intents';
  }
  return 'completed';
}

module.exports = {
  createInitialUIState,
  cycleView,
  cycleViewBackward
};
