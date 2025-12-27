/**
 * esbuild configuration for webview bundling.
 *
 * Usage:
 *   node esbuild.webview.mjs           # Build once
 *   node esbuild.webview.mjs --watch   # Watch mode
 *   node esbuild.webview.mjs --production  # Production build (minified)
 */

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// Ensure dist/webview directory exists
const distDir = 'dist/webview';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: ['src/webview/lit/index.ts'],
    bundle: true,
    outfile: 'dist/webview/bundle.js',
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    minify: production,
    sourcemap: !production,
    define: {
        'process.env.NODE_ENV': production ? '"production"' : '"development"'
    },
    // TypeScript decorator configuration - use legacy decorators for Lit
    tsconfigRaw: {
        compilerOptions: {
            experimentalDecorators: true,
            useDefineForClassFields: false
        }
    },
    // Log build info
    logLevel: 'info',
};

async function build() {
    try {
        if (watch) {
            // Watch mode
            const ctx = await esbuild.context(buildOptions);
            await ctx.watch();
            console.log('[esbuild] Watching webview for changes...');
        } else {
            // Single build
            const result = await esbuild.build(buildOptions);
            console.log('[esbuild] Webview bundle created:', production ? '(production)' : '(development)');

            // Report bundle size
            const stats = fs.statSync('dist/webview/bundle.js');
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`[esbuild] Bundle size: ${sizeKB} KB`);
        }
    } catch (error) {
        console.error('[esbuild] Build failed:', error);
        process.exit(1);
    }
}

build();
