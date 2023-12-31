# vscode-gaming

[![Visual Studio Marketplace Version (including pre-releases)](https://img.shields.io/visual-studio-marketplace/v/omi.vscode-gaming)](https://marketplace.visualstudio.com/items?itemName=omi.vscode-gaming)
[![Node.js Test](https://github.com/akiomik/vscode-gaming/actions/workflows/test.yml/badge.svg)](https://github.com/akiomik/vscode-gaming/actions/workflows/test.yml)

![banner](images/github-banner.png)

A gaming theme for [Visual Studio Code](https://azure.microsoft.com/en-us/products/visual-studio-code).
Port of [gaming.vim](https://github.com/high-moctane/gaming.vim).

## Features

![screenshot](images/screenshot.gif)

## Commands

* `Start gaming mode`: Start gradient animation
* `Stop gaming mode`: Stop gradient animation
* `Reset gaming mode`: Reset color configuration

## Extension Settings

This extension contributes the following settings:

* `gaming.period`: The gradient color cycle in milliseconds (defaults: `10000`)
* `gaming.updateTime`: The updating interval in milliseconds (defaults: `50`)
* `gaming.targets`: The colorization targets in [`workbench.colorCustomizations` namespace](https://code.visualstudio.com/api/references/theme-color) (defaults: `["editor.background"]`)

## Release Notes

### 0.1.0

* Added reset command
* Added `gaming.targets` option instead of `gaming.target`
* Improved color reproducibility

### 0.0.1

* Initial release

## Development

1. Open this project with Visual Studio Code:

```bash
code .
```

2. Press `F5` to open a new window with this extension loaded.
3. Run the command from the command palette by pressing (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and typing `gaming mode`.

## Testing

```bash
npm test
```
