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
  return 'runs';
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
  cycleRunFilter
};
