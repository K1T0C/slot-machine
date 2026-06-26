import * as PIXI from "pixi.js";
import { SlotView } from "./SlotView";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

gsap.registerPlugin(PixiPlugin);

const gameData = {
    gameConfig: { rows: 3, columns: 5, bet: 1, balance: 1000 },
    reelMapping: {
        "A": [0, 0, 0, 0, 0], "B": [1, 1, 1, 1, 1], "C": [2, 2, 2, 2, 2],
        "D": [3, 3, 3, 3, 3], "WILD": [4, 4, 4, 4, 4], "SCATTER": [5, 5, 5, 5, 5], "SEVEN": [6, 6, 6, 6, 6]
    },
    spins: [
        { id: 1, matrix: [["B", "C", "A", "D", "A"], ["C", "C", "C", "C", "C"], ["C", "C", "B", "A", "A"]] },
        { id: 2, matrix: [["B", "B", "C", "A", "A"], ["C", "B", "A", "D", "A"], ["A", "B", "C", "C", "A"]] },
        { id: 3, matrix: [["B", "B", "C", "A", "B"], ["A", "C", "B", "C", "A"], ["A", "C", "A", "B", "B"]] }
    ]
};

const app = new PIXI.Application();

(async () => {
    await app.init({ resizeTo: window, backgroundColor: 0x000000 });
    document.body.appendChild(app.canvas);

    await PIXI.Assets.load([
        "bg.png", "frame.png", "lever_idle.png", "lever_pressed.png", "btn_bet_minus.png",
        "lamp_01.png", "lamp_02.png", "lamp_03.png", "lamp_04.png", "lamp_05.png",
        "strip_01.png", "strip_02.png", "strip_03.png", "strip_04.png", "strip_05.png", "coin.png"
    ]);

    const ui = new PIXI.Container();
    ui.position.set(app.screen.width / 2, app.screen.height / 2);
    ui.scale.set(1.6);
    app.stage.addChild(ui);

    function createSprite(texture: string, x: number, y: number, scale: number) {
        const sprite = PIXI.Sprite.from(texture);
        sprite.anchor.set(0.5);
        sprite.position.set(x, y);
        sprite.scale.set(scale);
        return sprite;
    }

    ui.addChild(createSprite("bg.png", 0, 0, 0.5));
    const slotView = new SlotView(gameData, app);
    ui.addChild(slotView.container);
    ui.addChild(createSprite("frame.png", 0, 0, 0.5));

    const BALANCE_X = -162, BALANCE_Y = 220, BET_X = 220, BET_Y = 220;
    
    // Стиль для золотистого текста с красной окантовкой
    const textStyle = { 
        fontFamily: 'Arial Black', 
        fontSize: 10, 
        fontWeight: 'bold', 
        fill: '#FFD700', // Золотой цвет
        stroke: { color: '#FF0000', width: 3 }, // Красная окантовка
        align: 'center' 
    };
    
    const balanceText = new PIXI.Text({ text: `BALANCE\n${gameData.gameConfig.balance}`, style: textStyle });
    balanceText.anchor.set(0.5); balanceText.position.set(BALANCE_X, BALANCE_Y);
    ui.addChild(balanceText);

    const betText = new PIXI.Text({ text: `BET\n${gameData.gameConfig.bet}`, style: textStyle });
    betText.anchor.set(0.5); betText.position.set(BET_X, BET_Y);
    ui.addChild(betText);

    const btnMinus = createSprite("btn_bet_minus.png", 0, 0, 0.5);
    ui.addChild(btnMinus);

    const lever = PIXI.Sprite.from("lever_idle.png");
    lever.anchor.set(0.5);
    lever.position.set(0, 0); 
    lever.scale.set(0.5);
    lever.eventMode = "static";
    lever.cursor = "pointer";
    ui.addChild(lever); 

    let spinCounter = 0;
    lever.on("pointerdown", () => {
        gameData.gameConfig.bet += 1;
        betText.text = `BET\n${gameData.gameConfig.bet}`;

        if (gameData.gameConfig.balance >= gameData.gameConfig.bet) {
            lever.texture = PIXI.Assets.get("lever_pressed.png");
            gameData.gameConfig.balance -= gameData.gameConfig.bet;
            balanceText.text = `BALANCE\n${gameData.gameConfig.balance}`;
            slotView.playSpin(gameData.spins[spinCounter % gameData.spins.length].matrix);
            setTimeout(() => {
                const win = slotView.checkWin(gameData.spins[spinCounter % gameData.spins.length].matrix);
                if (win.length > 0) {
                    slotView.animateWinningCoins({x: BALANCE_X, y: BALANCE_Y}, () => {});
                    gsap.to(gameData.gameConfig, { balance: gameData.gameConfig.balance + 100, duration: 1.5, onUpdate: () => balanceText.text = `BALANCE\n${Math.floor(gameData.gameConfig.balance)}` });
                }
                spinCounter++;
            }, 2500);
        }
    });

    lever.on("pointerup", () => lever.texture = PIXI.Assets.get("lever_idle.png"));
    lever.on("pointerupoutside", () => lever.texture = PIXI.Assets.get("lever_idle.png"));

    const lamps: PIXI.Sprite[] = [];
    ["lamp_01.png", "lamp_02.png", "lamp_03.png", "lamp_04.png", "lamp_05.png"].forEach(src => {
        const lamp = createSprite(src, 0, 0, 0.5);
        ui.addChild(lamp);
        lamps.push(lamp);
    });

    app.ticker.add((ticker) => {
        let time = ticker.lastTime * 0.001;
        lamps.forEach((lamp, i) => lamp.alpha = 0.5 + Math.sin(time * 3 + i) * 0.5);
        btnMinus.alpha = 0.7 + Math.sin(time * 6) * 0.3;
    });
})();