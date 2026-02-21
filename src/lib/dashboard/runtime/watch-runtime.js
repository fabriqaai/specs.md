const chokidar = require('chokidar');
const path = require('path');

function createDebouncedTrigger(callback, delayMs) {
  let timeoutId = null;

  const trigger = () => {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback();
    }, delayMs);
  };

  const cancel = () => {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return {
    trigger,
    cancel,
    isPending: () => timeoutId != null
  };
}

function createWatchRuntime(options) {
  const {
    rootPath,
    onRefresh,
    onError,
    debounceMs = 250
  } = options;

  if (!rootPath || typeof rootPath !== 'string') {
    throw new Error('rootPath is required for watch runtime');
  }

  if (typeof onRefresh !== 'function') {
    throw new Error('onRefresh callback is required for watch runtime');
  }

  const reportError = typeof onError === 'function' ? onError : () => {};

  let watcher = null;
  let started = false;
  const debounced = createDebouncedTrigger(onRefresh, debounceMs);

  const watchTargets = [
    path.join(rootPath, 'state.yaml'),
    path.join(rootPath, 'intents'),
    path.join(rootPath, 'runs'),
    path.join(rootPath, 'standards')
  ];

  function start() {
    if (started) {
      return;
    }

    started = true;

    try {
      watcher = chokidar.watch(watchTargets, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 150,
          pollInterval: 50
        },
        depth: 10
      });

      watcher.on('all', () => {
        debounced.trigger();
      });

      watcher.on('error', (error) => {
        reportError(error);
      });
    } catch (error) {
      reportError(error);
    }
  }

  async function close() {
    debounced.cancel();

    if (watcher) {
      const activeWatcher = watcher;
      watcher = null;
      started = false;
      await activeWatcher.close();
    }
  }

  return {
    start,
    close,
    isActive: () => started,
    hasPendingRefresh: () => debounced.isPending()
  };
}

module.exports = {
  createDebouncedTrigger,
  createWatchRuntime
};
