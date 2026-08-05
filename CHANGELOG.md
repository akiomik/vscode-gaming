# Change Log

All notable changes to the "vscode-gaming" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Unreleased

* Fixed gaming mode overwriting color customizations outside of `gaming.targets`
* Fixed reset changing `workbench.colorCustomizations` when gaming mode had never been started
* Fixed the original colors being unrecoverable after quitting VS Code with gaming mode running
* The original colors are now put back automatically on the next startup
* Fixed reset restoring a gaming color after gaming mode had been stopped and started again

## 0.1.0

* Added reset command
* Added `gaming.targets` option instead of `gaming.target`
* Improved color reproducibility

## 0.0.1

* Initial release
