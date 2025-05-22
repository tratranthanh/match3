import { _decorator, Node, Vec3, EventTouch, UITransform, v3, Rect, tween } from 'cc';
import { gridCmpt } from '../item/gridCmpt';
import { GameBoardManager } from './GameBoardManager';
import { BombManager } from './BombManager';
import { GameStateManager } from './GameStateManager';
import {gameLogic} from "db://assets/scripts/gameLogic";
import {Constants} from "db://assets/scripts/enumConst";
import {CocosHelper} from "db://assets/scripts/components/cocosHelper";

export class TouchManager {
    private gameBoard: GameBoardManager;
    private bombManager: BombManager;
    private gameState: GameStateManager;
    public isStartTouch: boolean = false;
    public isStartChange: boolean = false;
    private curTwo: gridCmpt[] = [];

    public get getCurTwo(): gridCmpt[] {
        return this.curTwo;
    }

    constructor(gameBoard: GameBoardManager, bombManager: BombManager, gameState: GameStateManager) {
        this.gameBoard = gameBoard;
        this.bombManager = bombManager;
        this.gameState = gameState;
    }

    onTouchStart(event: EventTouch) {
        if (this.isStartChange || this.gameState.isWinState()) return;
        this.isStartTouch = true;
        let p = event.getUILocation();
        let pos = this.gameBoard.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let node = this.checkClickOnBlock(pos);
        if (node) {
            console.log("touch start");
            this.curTwo = [node];
        }
    }

    onTouchMove(event: EventTouch) {
        if (!this.isStartTouch || this.isStartChange || this.gameState.isWinState()) return;
        let p = event.getUILocation();
        let pos = this.gameBoard.gridNode.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(p.x, p.y, 1));
        let node = this.checkClickOnBlock(v3(pos.x, pos.y, 0));
        if (node && gameLogic.isNeighbor(node, this.curTwo[0])) {
            node.setSelected(true);
            this.curTwo.push(node);
            this.isStartChange = true;
            this.startChangeCurTwoPos();
        }
    }

    onTouchEnd() {
        this.isStartTouch = false;
        this.curTwo = [];
    }

    private checkClickOnBlock(pos: Vec3): gridCmpt | null {
        return this.gameBoard.checkClickOnBlock(pos);
    }

    private isAdjacent(block1: gridCmpt, block2: gridCmpt): boolean {
        return (Math.abs(block1.h - block2.h) == 1 && block1.v == block2.v) ||
               (Math.abs(block1.v - block2.v) == 1 && block1.h == block2.h);
    }

    private async swapBlocks(block1: gridCmpt, block2: gridCmpt) {
        this.isStartChange = true;
        let tempH = block1.h;
        let tempV = block1.v;
        let tempType = block1.type;

        block1.setType(block2.type);
        block2.setType(tempType);

        this.gameBoard.getBlockArr()[block1.h][block1.v] = block2.node;
        this.gameBoard.getBlockArr()[block2.h][block2.v] = block1.node;

        block1.h = block2.h;
        block1.v = block2.v;
        block2.h = tempH;
        block2.v = tempV;

        await this.checkAndHandleMatches();
        this.isStartChange = false;
    }

    private async checkAndHandleMatches() {
        let matches = this.gameBoard.findMatches();
        if (matches.length > 0) {
            this.gameState.decrementStepCount();
            for (let match of matches) {
                await this.bombManager.handleBomb(match);
            }
            await this.gameBoard.fillEmptySpaces();
            await this.checkAndHandleMatches();
        } else {
            // Swap back if no matches
            if (this.curTwo.length == 2) {
                await this.swapBlocks(this.curTwo[0], this.curTwo[1]);
            }
        }
    }

    async startChangeCurTwoPos(isBack: boolean = false) {
        let time = Constants.changeTime;
        let one = this.curTwo[0];
        let two = this.curTwo[1];
        if (!one || !two) return;
        tween(one.node).to(time, { position: this.gameBoard.blockPosArr[two.h][two.v] }).start();
        tween(two.node).to(time, { position: this.gameBoard.blockPosArr[one.h][one.v] }).call(async () => {
            if (!isBack) {
                this.gameBoard.changeData(one, two);
                // destroy special block if interract

                if (this.bombManager.isBomb(one) && this.bombManager.isBomb(two)) {
                    await this.bombManager.handleComboBomb(one, two);
                    await this.gameBoard.checkAgain();
                    return;
                }
                let isbomb1 = await this.bombManager.handleBomb(one);
                let isbomb2 = await this.bombManager.handleBomb(two);
                // check if match exist
                let bool = await this.gameBoard.startCheckThree((bl) => {
                    if (bl) {
                        // this.stepCount--;
                        // CocosHelper.updateLabelText(this.lbStep, `${this.stepCount}`);
                    }
                });
                if (bool || (isbomb1 || isbomb2)) {
                    await this.gameBoard.checkAgain()
                }
                else {
                    console.log(this.curTwo);
                    await this.startChangeCurTwoPos(true);
                }
            }
            else {
                this.gameBoard.changeData(one, two);
                this.isStartChange = false;
                this.isStartTouch = false;
                this.resetSelected();
            }
        }).start();
    }
    resetSelected() {
        // if (!this.isValid) {
        //     return;
        // }
        this.curTwo.forEach(item => {
            if (item) {
                item.setSelected(false);
            }
        })
        this.isStartChange = false;
        this.isStartTouch = false;
    }

} 