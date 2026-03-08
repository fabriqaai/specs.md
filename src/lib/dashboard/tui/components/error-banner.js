const { truncate } = require('./header');

function renderErrorLines(error, width, watchEnabled = true) {
  if (!error) {
    return [];
  }

  const lines = [
    `[error:${error.code || 'UNKNOWN'}] ${error.message || 'Unknown error'}`
  ];

  if (error.details) {
    lines.push(`details: ${error.details}`);
  }

  if (error.path) {
    lines.push(`path: ${error.path}`);
  }

  if (error.hint) {
    lines.push(`hint: ${error.hint}`);
  }

  if (watchEnabled) {
    lines.push('Dashboard keeps running and will recover after the next valid update.');
  } else {
    lines.push('Fix the error and rerun dashboard.');
  }

  return lines.map((line) => truncate(line, width));
}

module.exports = {
  renderErrorLines
};
