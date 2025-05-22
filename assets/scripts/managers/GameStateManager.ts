import { _decorator, Node, Label } from 'cc';

export class GameStateManager {
    private level: number = 1;
    private stepCount: number = 0;
    private isWin: boolean = false;
    private lbStep: Label | null = null;

    constructor(lbStep: Label | null = null) {
        this.lbStep = lbStep;
    }

    getLevel(): number {
        return this.level;
    }

    setLevel(level: number) {
        this.level = level;
    }

    getStepCount(): number {
        return this.stepCount;
    }

    setStepCount(count: number) {
        this.stepCount = count;
        this.updateStepLabel();
    }

    decrementStepCount() {
        this.stepCount--;
        this.updateStepLabel();
        if (this.stepCount <= 0) {
            this.checkWinCondition();
        }
    }

    isWinState(): boolean {
        return this.isWin;
    }

    setWinState(win: boolean) {
        this.isWin = win;
    }

    private updateStepLabel() {
        if (this.lbStep) {
            this.lbStep.string = this.stepCount.toString();
        }
    }

    private checkWinCondition() {
        // Add win condition logic here
        // For example, check if all objectives are met
        this.isWin = true;
    }
} 