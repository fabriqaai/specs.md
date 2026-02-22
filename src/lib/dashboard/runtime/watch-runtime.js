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
    rootPaths,
    onRefresh,
    onError,
    debounceMs = 250
  } = options;

  const roots = Array.from(new Set([
    ...(Array.isArray(rootPaths) ? rootPaths : []),
    ...(typeof rootPath === 'string' ? [rootPath] : [])
  ].filter((value) => typeof value === 'string' && value.trim() !== '')));

  if (roots.length === 0) {
    throw new Error('rootPath or rootPaths is required for watch runtime');
  }

  if (typeof onRefresh !== 'function') {
    throw new Error('onRefresh callback is required for watch runtime');
  }

  const reportError = typeof onError === 'function' ? onError : () => {};

  let watcher = null;
  let started = false;
  const debounced = createDebouncedTrigger(onRefresh, debounceMs);

  const watchTargets = roots.flatMap((baseRoot) => ([
    path.join(baseRoot, 'state.yaml'),
    path.join(baseRoot, 'intents'),
    path.join(baseRoot, 'runs'),
    path.join(baseRoot, 'standards'),
    path.join(baseRoot, 'bolts'),
    path.join(baseRoot, 'specs')
  ]));

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
    hasPendingRefresh: () => debounced.isPending(),
    getRoots: () => [...roots]
  };
}

module.exports = {
  createDebouncedTrigger,
  createWatchRuntime
};
