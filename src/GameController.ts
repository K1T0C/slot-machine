export class GameController {
    constructor(private model: GameModel, private view: SlotView) {
        // Здесь ты подписываешься на клик кнопки Spin
    }

    public onSpinClick() {
        const result = this.model.getNextSpin();
        this.view.updateGrid(result.matrix);
        // Здесь вызываешь подсветку, если есть выигрыш:
        if (result.win.amount > 0) {
            this.highlightWins(result.win.lines);
        }
    }
}