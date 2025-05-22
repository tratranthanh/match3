import { _decorator, Component, Node, Prefab, Vec3, v3, instantiate } from 'cc';
import { ResLoadHelper } from './components/resLoadHelper';
import { Constants, Pieces } from './enumConst';
import { gameLogic } from './gameLogic';
import { blockCmpt } from './item/blockCmpt';
import {goalComponent} from "db://assets/scripts/components/goalComponent";
const { ccclass, property } = _decorator;

@ccclass('gridManagerCmpt')
export class gridManagerCmpt extends Component {

    private blockPre: Prefab = null;
    private obstacleArr = [];
    private blockArr: Node[][] = [];
    private blockPosArr: Vec3[][] = [];
    /** 行列数 */
    /** Number of rows and columns */
    private H: number = Constants.layCount;
    private V: number = Constants.layCount;
    private rectWidth: number = Constants.Width;
    private hideList = [];
    public async initGrid() {
        await this.loadLinePre();
        this.initLayout();
    }

    async loadLinePre() {
        this.blockPre = await ResLoadHelper.loadPieces(Pieces.block);
    }

    initLayout() {
        this.hideList = gameLogic.hideList;
        this.clearData();
        let gap = 0;
        let width = this.rectWidth;
        for (let i = 0; i < this.H; i++) {
            this.blockArr.push([]);
            this.blockPosArr.push([]);
            for (let j = 0; j < this.V; j++) {
                let xx = (width + gap) * (i + 0) - (width + gap) * (this.H - 1) / 2;
                let yy = (width + gap) * (j + 0) - (width + gap) * (this.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                this.blockPosArr[i][j] = pos;
                if (gameLogic.checkInHideList(i, j)) {
                    this.blockArr[i][j] = null;
                    continue;
                }
                let block = this.addBlock(i, j, pos);
                this.blockArr[i][j] = block;
            }
        }
        /** 边框设置 */
        /** Border settings */
        this.setMapBorders();
    }

    /** 边框设置 */
    /** Border settings */
    setMapBorders() {
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block) {
                    let top, down, left, right = null;
                    if (j + 1 < this.V) {
                        top = this.blockArr[i][j + 1];
                    }
                    if (j - 1 >= 0) {
                        down = this.blockArr[i][j - 1];
                    }
                    if (i - 1 >= 0) {
                        left = this.blockArr[i - 1][j];
                    }
                    if (i + 1 < this.H) {
                        right = this.blockArr[i + 1][j];
                    }
                    block.getComponent(blockCmpt).handleBorders(top, down, left, right);
                }
            }
        }
    }

    addBlock(i: number, j: number, pos: Vec3 = null) {
        let block = instantiate(this.blockPre);
        this.node.addChild(block);
        block.getComponent(blockCmpt).initData(i, j);
        if (pos) {
            block.setPosition(pos);
        }
        return block;
    }

    clearData() {
        if (this.blockArr.length < 1) return;
        for (let i = 0; i < this.H; i++) {
            for (let j = 0; j < this.V; j++) {
                let block = this.blockArr[i][j];
                if (block) {
                    block.destroy();
                }
            }
        }
        this.obstacleArr.forEach(item => item.destroy());
        this.obstacleArr = [];
        this.blockArr = [];
        this.blockPosArr = [];
    }
}


