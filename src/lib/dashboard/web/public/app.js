(function () {
  var themeKey = 'specsmd:webview-state';

  function readTheme() {
    try {
      var stored = localStorage.getItem(themeKey);
      if (stored === '"dark"' || stored === 'dark') {
        return 'dark';
      }
      if (stored === '"light"' || stored === 'light') {
        return 'light';
      }
      var parsed = JSON.parse(stored);
      if (parsed === 'dark' || parsed === 'light') {
        return parsed;
      }
    } catch (error) {
      return 'dark';
    }

    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    } finally {
      textarea.remove();
    }
  }

  function closeCommandDialog() {
    var existing = document.querySelector('.specsmd-command-dialog');
    if (existing) {
      existing.remove();
    }
  }

  function showCommandDialog(command) {
    closeCommandDialog();

    var overlay = document.createElement('div');
    overlay.className = 'specsmd-command-dialog';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Start FIRE run command');

    var panel = document.createElement('div');
    panel.className = 'specsmd-command-dialog-panel';

    var title = document.createElement('div');
    title.className = 'specsmd-command-dialog-title';
    title.textContent = 'Start FIRE run';

    var description = document.createElement('div');
    description.className = 'specsmd-command-dialog-description';
    description.textContent = 'Run this command from your project folder.';

    var commandBox = document.createElement('textarea');
    commandBox.className = 'specsmd-command-dialog-command';
    commandBox.value = command;
    commandBox.readOnly = true;
    commandBox.rows = 2;

    var actions = document.createElement('div');
    actions.className = 'specsmd-command-dialog-actions';

    var copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'specsmd-command-dialog-copy';
    copyButton.textContent = 'Copy Command';

    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'specsmd-command-dialog-close';
    closeButton.textContent = 'Close';

    copyButton.addEventListener('click', function () {
      copyText(command).then(function () {
        copyButton.textContent = 'Copied';
      }).catch(function () {
        commandBox.focus();
        commandBox.select();
      });
    });

    closeButton.addEventListener('click', closeCommandDialog);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        closeCommandDialog();
      }
    });

    actions.appendChild(copyButton);
    actions.appendChild(closeButton);
    panel.appendChild(title);
    panel.appendChild(description);
    panel.appendChild(commandBox);
    panel.appendChild(actions);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    commandBox.focus();
    commandBox.select();
  }

  document.documentElement.dataset.host = 'dashboard-web';
  applyTheme(readTheme());

  window.addEventListener('storage', function (event) {
    if (event.key !== themeKey) {
      return;
    }

    applyTheme(readTheme());
  });

  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'setData') {
      document.documentElement.dataset.loaded = 'true';
    }
  });

  window.addEventListener('specsmd-dashboard-command', function (event) {
    if (!event.detail || !event.detail.command) {
      return;
    }

    showCommandDialog(String(event.detail.command));
  });

  window.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeCommandDialog();
    }
  });
}());
