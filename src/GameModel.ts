// src/GameModel.ts

export interface GameData {
    gameConfig: { rows: number; columns: number; bet: number; balance: number };
    spins: any[];
}

export class GameModel {
    private _balance: number = 1000;
    private _bet: number = 1;
    
    // ВАЖНО: Массив теперь содержит строки '1'-'7', 
    // которые соответствуют алиасам загруженных картинок (1.png - 7.png)
    private symbols: string[] = ['1', '2', '3', '4', '5', '6', '7'];

    public getNextSpin() {
        // 1. Списываем ставку
        this._balance -= this._bet;

        // 2. Генерируем случайную матрицу 3x5
        const matrix = [];
        for (let row = 0; row < 3; row++) {
            const currentRow = [];
            for (let col = 0; col < 5; col++) {
                // Выбираем случайный ID от '1' до '7'
                const randomIndex = Math.floor(Math.random() * this.symbols.length);
                currentRow.push(this.symbols[randomIndex]);
            }
            matrix.push(currentRow);
        }

        // 3. Имитируем выигрыш
        const winAmount = Math.random() > 0.7 ? 5 : 0; 
        this._balance += winAmount;

        return {
            id: Date.now(),
            matrix: matrix,
            win: { amount: winAmount, lines: [] }
        };
    }

    public get balance(): number {
        return this._balance;
    }

    public get bet(): number {
        return this._bet;
    }
}