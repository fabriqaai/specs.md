function createInitialUIState() {
  return {
    view: 'runs',
    showHelp: true
  };
}

function cycleView(current) {
  if (current === 'runs') {
    return 'overview';
  }
  if (current === 'overview') {
    return 'health';
  }
  return 'runs';
}

function cycleViewBackward(current) {
  if (current === 'runs') {
    return 'health';
  }
  if (current === 'overview') {
    return 'runs';
  }
  return 'overview';
}

module.exports = {
  createInitialUIState,
  cycleView,
  cycleViewBackward
};
