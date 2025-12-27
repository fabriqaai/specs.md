# Changelog

All notable changes to the specsmd VS Code extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.6] - 2025-12-27

### Added
- Link to full documentation at specs.md

### Fixed
- Use absolute URL for preview image (fixes marketplace display)

## [0.0.5] - 2025-12-27

### Changed
- Version bump to trigger re-publish with latest fixes

### Fixed
- Ensure aria-hidden SVG icons are included in published version

## [0.0.4] - 2025-12-27

### Added
- Marketplace icon using `resources/favicon.png`
- Homepage link to https://specs.md
- Extension preview image in README
- VS Code Extension section in main project README
- Show All/Show Less toggle for Up Next queue
- Recent Completions section with expandable artifact files

### Changed
- Improved icon to be square (512x512) for better marketplace display
- Optimized preview image size (827KB → 261KB)
- Added aria-hidden to SVG toggle icons for accessibility

### Fixed
- Repository URL in package.json now correctly points to `specs.md.git`

## [0.0.3] - 2025-12-26

### Added
- Lit web components for Bolts view
- StateStore for centralized state management
- Activity feed with filtering options
- Focus section with expandable bolt cards

### Changed
- Migrated webview from vanilla HTML to Lit components
- Improved stage progress visualization

## [0.0.2] - 2025-12-25

### Added
- Specs tab with hierarchical intent/unit/story view
- Overview tab with project metrics
- File opening and navigation commands

### Fixed
- Duplicate event handler registration in webview

## [0.0.1] - 2025-12-24

### Added
- Initial release
- Sidebar panel with Bolts view
- Memory bank artifact parsing
- Basic bolt status display
