# Changelog

All notable changes to the "vscode-gaming" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-06

### Added

- The original colors are now restored automatically on the next startup after quitting VS Code with gaming mode running

### Fixed

- Gaming mode no longer overwrites color customizations outside of `gaming.targets`
- Reset no longer changes `workbench.colorCustomizations` when gaming mode has never been started
- Reset no longer restores a gaming color after gaming mode has been stopped and started again

## [0.1.0] - 2023-12-26

### Added

- Reset command
- `gaming.targets` setting, which replaces `gaming.target`

### Changed

- Improved color reproducibility

### Removed

- `gaming.target` setting, replaced by `gaming.targets`

## [0.0.1] - 2023-12-24

### Added

- Initial release

[Unreleased]: https://github.com/akiomik/vscode-gaming/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/akiomik/vscode-gaming/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/akiomik/vscode-gaming/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/akiomik/vscode-gaming/releases/tag/v0.0.1
