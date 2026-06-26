export interface GameData {
    gameConfig: { rows: number; columns: number; bet: number; balance: number };
    symbols: { id: string; type: string; payout?: any }[];
    spins: { id: number; matrix: string[][]; win: any }[];
  }