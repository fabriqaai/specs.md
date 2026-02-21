function createInitialUIState() {
  return {
    view: 'runs',
    runFilter: 'all',
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

function cycleRunFilter(current) {
  if (current === 'all') {
    return 'active';
  }
  if (current === 'active') {
    return 'completed';
  }
  return 'all';
}

module.exports = {
  createInitialUIState,
  cycleView,
  cycleViewBackward,
  cycleRunFilter
};
