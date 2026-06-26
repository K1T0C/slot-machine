import * as PIXI from "pixi.js";
import { gsap } from "gsap";

export class SlotView {
    public container: PIXI.Container;
    private reels: PIXI.TilingSprite[] = [];
    private highlightLayer: PIXI.Container;
    private gameData: any;
    private app: PIXI.Application; // Добавлено поле для app

    private readonly SYMBOL_WIDTH = 96;
    private readonly SYMBOL_HEIGHT = 90;
    private readonly OFFSET_Y = 15;
    private readonly colOffsets = [0, 0, 0, 0, 0];

    constructor(gameData: any, app: PIXI.Application) {
        this.gameData = gameData;
        this.app = app; // Сохраняем app
        this.container = new PIXI.Container();

        const columns = this.gameData.gameConfig.columns;
        const rows = this.gameData.gameConfig.rows;
        
        const width = columns * this.SYMBOL_WIDTH;
        const height = rows * this.SYMBOL_HEIGHT;

        const mask = new PIXI.Graphics()
            .rect(-width / 2, (-height / 2) + (this.OFFSET_Y / 2), width, height)
            .fill(0xffffff);

        this.container.addChild(mask);
        this.container.mask = mask;

        this.highlightLayer = new PIXI.Container();
        this.createReels();
        this.container.addChild(this.highlightLayer);
    }

    private createReels() {
        const columns = this.gameData.gameConfig.columns;
        const startX = -(columns * this.SYMBOL_WIDTH) / 2;
        const startY = -(this.gameData.gameConfig.rows * this.SYMBOL_HEIGHT) / 2 + this.OFFSET_Y;

        for (let i = 0; i < columns; i++) {
            const texture = PIXI.Assets.get(`strip_0${i + 1}.png`);
            const reel = new PIXI.TilingSprite({
                texture,
                width: this.SYMBOL_WIDTH,
                height: 7 * this.SYMBOL_HEIGHT
            });

            const finalY = startY + this.colOffsets[i];
            reel.position.set(startX + (i * this.SYMBOL_WIDTH), finalY);
            reel.tilePosition.set(0, 0);
            
            this.container.addChild(reel);
            this.reels.push(reel);
        }
    }

    public playSpin(matrix: string[][]) {
        console.log("Spin started!");
        
        this.clearHighlights();
        const loopHeight = 7 * this.SYMBOL_HEIGHT;
    
        this.reels.forEach((reel, col) => {
            // Берем символ, если его нет — берем "A"
            const symbol = (matrix[1] && matrix[1][col]) ? matrix[1][col] : "A";
            
            // Получаем маппинг. Если символа нет в reelMapping, берем стандартный массив [0,0,0,0,0]
            const mapping = this.gameData.reelMapping[symbol] || [0, 0, 0, 0, 0];
            const index = mapping[col] !== undefined ? mapping[col] : 0;
            
            const targetY = index * this.SYMBOL_HEIGHT;
            
            let currentPos = reel.tilePosition.y % loopHeight;
            if (currentPos < 0) currentPos += loopHeight;
    
            let dist = targetY - currentPos;
            if (dist <= 0) dist += loopHeight;
            
            const totalDistance = (loopHeight * 3) + dist;
    
            gsap.killTweensOf(reel.tilePosition);
            gsap.to(reel.tilePosition, {
                y: `+=${totalDistance}`,
                duration: 1.5 + col * 0.2,
                ease: "power2.inOut", 
                onComplete: () => {
                    reel.tilePosition.y = targetY % loopHeight;
                    // Эффект покачивания
                    gsap.to(reel.tilePosition, {
                        y: targetY - 15,
                        duration: 0.2,
                        ease: "sine.out",
                        yoyo: true,
                        repeat: 1
                    });
                }
            });
        });
    
        // Логика проверки выигрыша и отрисовки линии
        setTimeout(() => {
            const win = this.checkWin(matrix);
            if (win.length > 0) {
                console.log("Win detected, drawing line...");
                this.drawWinLine(win);
            }
        }, 2000);
    }

    public checkWin(matrix: string[][]): number[][] {
        // 1. Посмотрим, что пришло в матрице
        console.log("Checking matrix:", matrix); 
        
        const row = Math.floor(this.gameData.gameConfig.rows / 2);
        const line = matrix[row];
        
        // 2. Проверим, что именно сравниваем
        console.log("Checking line:", line);
        
        if (line && line.length === 5 && line.every(s => s === line[0])) {
            console.log("WIN DETECTED!");
            return line.map((_, i) => [i, row]);
        }
        
        console.log("No win this spin.");
        return [];
    }

    private drawWinLine(positions: number[][]) {
        const points = positions.map(([col, row]) => new PIXI.Point(
            -(this.gameData.gameConfig.columns * this.SYMBOL_WIDTH) / 2 + col * this.SYMBOL_WIDTH + this.SYMBOL_WIDTH / 2,
            -(this.gameData.gameConfig.rows * this.SYMBOL_HEIGHT) / 2 + row * this.SYMBOL_HEIGHT + this.SYMBOL_HEIGHT / 2 + this.OFFSET_Y
        ));
    
        const group = new PIXI.Container();
        const glow = new PIXI.Graphics();
        const line = new PIXI.Graphics();
        
        this.makeLine(glow, points);
        glow.stroke({ width: 25, color: 0xff9900, alpha: 0.3 });
        
        this.makeLine(line, points);
        line.stroke({ width: 7, color: 0xffff00 });
        
        group.addChild(glow, line);
        
        // ВАЖНО: Добавляем прямо в основной контейнер SlotView, чтобы быть поверх reels
        this.highlightLayer.addChild(group); 
        
        group.alpha = 1;
        gsap.to(group, { 
            alpha: 0.3, 
            duration: 0.5, 
            repeat: -1, 
            yoyo: true, 
            ease: "sine.inOut" 
        });
        
        console.log("Линия отрисована поверх всего!");
    }

    private makeLine(g: PIXI.Graphics, points: PIXI.Point[]) {
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    }

    private clearHighlights() {
        this.highlightLayer.removeChildren();
    }

    public animateWinningCoins(targetPos: { x: number, y: number }, onComplete: () => void) {
        // --- ТВОИ НАСТРОЙКИ ---
        const SETTINGS = {
            baseScale: 0.6,       
            minScale: 0.15,       
            coinCount: 20,        
            speed: 0.15           
        };
        // -----------------------
    
        const parent = this.container.parent;
    
        for (let i = 0; i < SETTINGS.coinCount; i++) {
            const coin = PIXI.Sprite.from("coin.png");
            coin.anchor.set(0.5);
            
            // Устанавливаем начальный размер из настроек
            coin.scale.set(SETTINGS.baseScale);
            
            parent.addChild(coin);
            
            // Разлет из центра
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 50;
            coin.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius);
            
            let frame = 0;
            const delay = i * 5; 
            const duration = 60; 
            
            const moveCoin = () => {
                frame++;
                if (frame < delay) return; 
    
                const progress = (frame - delay) / duration;
                
                // Движение с использованием SETTINGS.speed
                coin.x += (targetPos.x - coin.x) * SETTINGS.speed;
                coin.y += (targetPos.y - coin.y) * SETTINGS.speed;
                
                // ДИНАМИЧЕСКИЙ РАЗМЕР: от baseScale до minScale
                const currentScale = SETTINGS.baseScale - (progress * (SETTINGS.baseScale - SETTINGS.minScale));
                coin.scale.set(currentScale);
    
                if (progress >= 1) {
                    this.app.ticker.remove(moveCoin);
                    coin.destroy();
                    if (i === SETTINGS.coinCount - 1) onComplete();
                }
            };
            
            this.app.ticker.add(moveCoin);
        }
    }
    }
