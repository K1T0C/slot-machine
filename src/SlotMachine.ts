import { Application, Container, Graphics, Text } from 'pixi.js';
import type { GameData } from './types/game';

const SYMBOL_COLORS: Record<string, number> = {
  cherry: 0xe74c3c,
  lemon: 0xf1c40f,
  orange: 0xe67e22,
  plum: 0x9b59b6,
  bell: 0xf39c12,
  bar: 0x3498db,
  seven: 0x2ecc71,
};

const DEFAULT_COLOR = 0x95a5a6;

export class SlotMachine {
  private readonly app: Application;
  private readonly gameData: GameData;
  private readonly root: Container;
  private readonly gridContainer: Container;
  private readonly cellGraphics: Graphics[][] = [];
  private spinIndex = 0;

  private readonly columns: number;
  private readonly rows: number;
  private readonly cellSize = 90;
  private readonly cellGap = 8;
  private readonly gridPadding = 16;

  constructor(app: Application, gameData: GameData) {
    this.app = app;
    this.gameData = gameData;
    this.columns = gameData.gameConfig.columns;
    this.rows = gameData.gameConfig.rows;

    this.root = new Container();
    this.gridContainer = new Container();
    this.root.addChild(this.gridContainer);

    this.createGrid();
    this.createSpinButton();
    this.centerOnStage();

    const idleSymbol = this.gameData.symbols[0]?.id ?? 'unknown';
    this.updateGrid(
      Array.from({ length: this.rows }, () =>
        Array.from({ length: this.columns }, () => idleSymbol),
      ),
    );

    app.stage.addChild(this.root);
  }

  private createGrid(): void {
    const gridWidth =
      this.columns * this.cellSize + (this.columns - 1) * this.cellGap;
    const gridHeight =
      this.rows * this.cellSize + (this.rows - 1) * this.cellGap;

    const frame = new Graphics();
    frame
      .roundRect(
        -this.gridPadding,
        -this.gridPadding,
        gridWidth + this.gridPadding * 2,
        gridHeight + this.gridPadding * 2,
        12,
      )
      .fill({ color: 0x1a1a2e })
      .stroke({ color: 0x4a4a6a, width: 3 });

    this.gridContainer.addChild(frame);

    for (let row = 0; row < this.rows; row++) {
      const rowGraphics: Graphics[] = [];

      for (let col = 0; col < this.columns; col++) {
        const cell = new Graphics();
        cell.x = col * (this.cellSize + this.cellGap);
        cell.y = row * (this.cellSize + this.cellGap);
        this.drawCell(cell, DEFAULT_COLOR);
        this.gridContainer.addChild(cell);
        rowGraphics.push(cell);
      }

      this.cellGraphics.push(rowGraphics);
    }
  }

  private drawCell(cell: Graphics, color: number): void {
    cell.clear();
    cell
      .roundRect(0, 0, this.cellSize, this.cellSize, 8)
      .fill({ color })
      .stroke({ color: 0xffffff, alpha: 0.25, width: 2 });
  }

  private createSpinButton(): void {
    const gridWidth =
      this.columns * this.cellSize + (this.columns - 1) * this.cellGap;
    const gridHeight =
      this.rows * this.cellSize + (this.rows - 1) * this.cellGap;

    const buttonWidth = 160;
    const buttonHeight = 52;

    const button = new Container();
    button.x = (gridWidth - buttonWidth) / 2;
    button.y = gridHeight + this.gridPadding + 24;

    const background = new Graphics();
    background
      .roundRect(0, 0, buttonWidth, buttonHeight, 10)
      .fill({ color: 0xe94560 })
      .stroke({ color: 0xffffff, alpha: 0.3, width: 2 });

    const label = new Text({
      text: 'SPIN',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: 0xffffff,
      },
    });
    label.anchor.set(0.5);
    label.x = buttonWidth / 2;
    label.y = buttonHeight / 2;

    button.addChild(background, label);
    button.eventMode = 'static';
    button.cursor = 'pointer';

    button.on('pointerover', () => {
      background.clear();
      background
        .roundRect(0, 0, buttonWidth, buttonHeight, 10)
        .fill({ color: 0xff6b81 })
        .stroke({ color: 0xffffff, alpha: 0.3, width: 2 });
    });

    button.on('pointerout', () => {
      background.clear();
      background
        .roundRect(0, 0, buttonWidth, buttonHeight, 10)
        .fill({ color: 0xe94560 })
        .stroke({ color: 0xffffff, alpha: 0.3, width: 2 });
    });

    button.on('pointerdown', () => this.spin());

    this.root.addChild(button);
  }

  private centerOnStage(): void {
    const gridWidth =
      this.columns * this.cellSize + (this.columns - 1) * this.cellGap;
    const gridHeight =
      this.rows * this.cellSize + (this.rows - 1) * this.cellGap;
    const buttonArea = 24 + 52 + this.gridPadding;

    const totalWidth = gridWidth + this.gridPadding * 2;
    const totalHeight = gridHeight + this.gridPadding * 2 + buttonArea;

    this.root.x = (this.app.screen.width - totalWidth) / 2 + this.gridPadding;
    this.root.y = (this.app.screen.height - totalHeight) / 2 + this.gridPadding;
  }

  private getSymbolColor(symbolId: string): number {
    return SYMBOL_COLORS[symbolId] ?? DEFAULT_COLOR;
  }

  updateGrid(matrix: string[][]): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        const symbolId = matrix[row]?.[col] ?? 'unknown';
        this.drawCell(this.cellGraphics[row][col], this.getSymbolColor(symbolId));
      }
    }
  }

  spin(): void {
    const spin = this.gameData.spins[this.spinIndex];

    if (!spin) {
      console.warn('Спины закончились — добавьте новые данные в JSON.');
      return;
    }

    console.log('Результат спина:', spin);
    this.updateGrid(spin.matrix);
    this.spinIndex += 1;
  }
}
