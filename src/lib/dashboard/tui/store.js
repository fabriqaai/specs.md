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
  if (current === 'health') {
    return 'git';
  }
  return 'runs';
}

function cycleViewBackward(current) {
  if (current === 'runs') {
    return 'git';
  }
  if (current === 'intents') {
    return 'runs';
  }
  if (current === 'completed') {
    return 'intents';
  }
  if (current === 'health') {
    return 'completed';
  }
  return 'health';
}

module.exports = {
  createInitialUIState,
  cycleView,
  cycleViewBackward
};
