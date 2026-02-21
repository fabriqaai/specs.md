const { truncate } = require('./header');

function renderHelpLines(showHelp, width) {
  if (!showHelp) {
    return [truncate('Press h to show keyboard shortcuts.', width)];
  }

  return [
    truncate('Keys: q quit | r refresh | h/? toggle help | tab cycle view | 1 runs | 2 overview | f cycle run filter', width)
  ];
}

module.exports = {
  renderHelpLines
};
