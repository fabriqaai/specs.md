function getSectionOrderForView(view, options = {}) {
  const includeWorktrees = options.includeWorktrees === true;
  const includeOtherWorktrees = options.includeOtherWorktrees === true;

  if (view === 'intents') {
    return ['intent-status'];
  }
  if (view === 'completed') {
    return ['completed-runs'];
  }
  if (view === 'health') {
    return ['standards', 'stats', 'warnings', 'error-details'];
  }
  if (view === 'git') {
    return ['git-status', 'git-changes', 'git-commits', 'git-diff'];
  }
  const sections = [];
  if (includeWorktrees) {
    sections.push('worktrees');
  }
  sections.push('current-run', 'run-files');
  if (includeOtherWorktrees) {
    sections.push('other-worktrees-active');
  }
  return sections;
}

function cycleSection(view, currentSectionKey, direction = 1, availableSections = null) {
  const order = Array.isArray(availableSections) && availableSections.length > 0
    ? availableSections
    : getSectionOrderForView(view);
  if (order.length === 0) {
    return currentSectionKey;
  }

  const currentIndex = order.indexOf(currentSectionKey);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeIndex + direction + order.length) % order.length;
  return order[nextIndex];
}

module.exports = {
  getSectionOrderForView,
  cycleSection
};
