import {Node, v3, Vec3, instantiate, Prefab, tween, isValid} from 'cc';
import {Bomb, Constants} from '../enumConst';
import {gridCmpt} from '../item/gridCmpt';
import {CocosHelper} from '../components/cocosHelper';
import {gameLogic} from '../gameLogic';
import {goalComponent} from "db://assets/scripts/components/goalComponent";
import {GameViewCmpt} from "db://assets/scripts/gameViewCmpt";
import {eventMgt, EventName} from "db://assets/scripts/components/eventManager";

export class GameBoardManager {
    private blockArr: Node[][] = [];
    public blockPosArr: Vec3[][] = [];
    public gridNode: Node;
    private effNode: Node;
    private gridPre: Prefab;
    private particlePre: Prefab;
    private goals: Map<number, goalComponent> = new Map();
    private dimensions: { H: number, V: number };

    private cornerPos = [[-1, -1], [1, 1], [1, -1], [-1, 1]];
    private surroundPos = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    private checkingMoveDown: number = 0;
    private downTime: number = 0.1;
    private intervalTipsIndex: number = 0;
    private gameViewComponent: GameViewCmpt = null;

    constructor(gridNode: Node, effNode: Node, gridPre: Prefab, particlePre: Prefab, goals: goalComponent[], dimensions: {
        H: number,
        V: number
    }, gameViewComponent: GameViewCmpt) {
        this.gridNode = gridNode;
        this.effNode = effNode;
        this.gridPre = gridPre;
        this.particlePre = particlePre;
        this.dimensions = dimensions;
        this.goals = new Map();
        for (let i = 0; i < goals.length; i++) {
            this.goals.set(i, goals[i]);
        }
        this.gameViewComponent = gameViewComponent;
        this.initGridLayout();
    }

    getGridNode(): Node {
        return this.gridNode;
    }

    getBlockArr(): Node[][] {
        return this.blockArr;
    }

    getBlockPosArr(): Vec3[][] {
        return this.blockPosArr;
    }

    getDimensions(): { H: number, V: number } {
        return this.dimensions;
    }

    private initGridLayout() {
        // Initialize grid layout
        let gap = 0;
        let count = 0;
        let width = Constants.Width;

        for (let i = 0; i < this.dimensions.H; i++) {
            this.blockPosArr.push([]);
            this.blockArr.push([]);
            for (let j = 0; j < this.dimensions.V; j++) {
                let xx = (width + gap) * (i + 0) - (width + gap) * (this.dimensions.H - 1) / 2;
                let yy = (width + gap) * (j + 0) - (width + gap) * (this.dimensions.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                this.blockPosArr[i][j] = pos;
                this.blockArr[i][j] = null;
            }
        }

        for (let i = 0; i < this.dimensions.H; i++) {
            this.blockArr[i] = [];
            this.blockPosArr[i] = [];
            for (let j = 0; j < this.dimensions.V; j++) {
                if (gameLogic.hideFullList.length < this.dimensions.H * this.dimensions.V) {
                    gameLogic.hideFullList.push([i, j]);
                }
                let xx = (width + gap) * (i) - (width + gap) * (this.dimensions.H - 1) / 2;
                let yy = (width + gap) * (j) - (width + gap) * (this.dimensions.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                this.blockPosArr[i][j] = pos;
                this.blockArr[i][j] = null;
                if (gameLogic.checkInHideList(i, j)) {
                    this.blockArr[i][j] = null;
                    continue;
                }
                count++;

                /** 障碍物 */
                let type = -1;
                if (this.blockArr[i][j]) continue;
                let grid = instantiate(this.gridPre);
                this.gridNode.addChild(grid);
                grid.getComponent(gridCmpt).initData(i, j, type);
                if (pos) grid.setPosition(pos);
                let sameHor = this._checkHorizontal(grid.getComponent(gridCmpt));
                let sameVer = this._checkVertical(grid.getComponent(gridCmpt));
                if (sameHor.length >= 3 || sameVer.length >= 3) {
                    grid.getComponent(gridCmpt).setType((grid.getComponent(gridCmpt).type + 1) % gameLogic.blockCount);
                } else if (sameHor.length == 2 && sameVer.length == 2) {
                    let cornerH = sameHor[1].data.h;
                    let cornerV = sameVer[1].data.v;
                    let corner = this.blockArr[cornerH][cornerV];
                    if (corner && corner.getComponent(gridCmpt).type == grid.getComponent(gridCmpt).type) {
                        grid.getComponent(gridCmpt).setType((grid.getComponent(gridCmpt).type + 1) % gameLogic.blockCount);
                    }
                }
                grid.setScale(v3(0, 0, 0));
                tween(grid).to(count / 100, { scale: v3(1, 1, 1) }).start();
                this.blockArr[i][j] = grid;
            }
        }
    }

    findMatches(): gridCmpt[] {
        let matches: gridCmpt[] = [];
        // Check horizontal matches
        for (let i = 0; i < this.dimensions.H; i++) {
            for (let j = 0; j < this.dimensions.V - 2; j++) {
                let block1 = this.blockArr[i][j]?.getComponent(gridCmpt);
                let block2 = this.blockArr[i][j + 1]?.getComponent(gridCmpt);
                let block3 = this.blockArr[i][j + 2]?.getComponent(gridCmpt);
                if (block1 && block2 && block3 &&
                    block1.type === block2.type &&
                    block2.type === block3.type) {
                    matches.push(block1);
                }
            }
        }
        // Check vertical matches
        for (let i = 0; i < this.dimensions.H - 2; i++) {
            for (let j = 0; j < this.dimensions.V; j++) {
                let block1 = this.blockArr[i][j]?.getComponent(gridCmpt);
                let block2 = this.blockArr[i + 1][j]?.getComponent(gridCmpt);
                let block3 = this.blockArr[i + 2][j]?.getComponent(gridCmpt);
                if (block1 && block2 && block3 &&
                    block1.type === block2.type &&
                    block2.type === block3.type) {
                    matches.push(block1);
                }
            }
        }
        return matches;
    }

    async fillEmptySpaces() {
        // Move blocks down to fill empty spaces
        for (let i = 0; i < this.dimensions.H; i++) {
            for (let j = 0; j < this.dimensions.V; j++) {
                if (!this.blockArr[i][j]) {
                    // Find the first non-empty block above
                    let k = j + 1;
                    while (k < this.dimensions.V && !this.blockArr[i][k]) {
                        k++;
                    }
                    if (k < this.dimensions.V) {
                        // Move block down
                        this.blockArr[i][j] = this.blockArr[i][k];
                        this.blockArr[i][k] = null;
                        let blockCmpt = this.blockArr[i][j].getComponent(gridCmpt);
                        blockCmpt.h = i;
                        blockCmpt.v = j;
                        await CocosHelper.delayTime(0.1);
                    }
                }
            }
        }
    }

    clearData() {
        this.blockArr = [];
        this.blockPosArr = [];
        this.gridNode.removeAllChildren();
    }

    async initLayout() {
        this.clearData();
        let gap = 0;
        let count = 0;
        let width = Constants.Width;

        // Initialize grid coordinates
        for (let i = 0; i < this.dimensions.H; i++) {
            this.blockPosArr.push([]);
            this.blockArr.push([]);
            for (let j = 0; j < this.dimensions.V; j++) {
                let xx = (width + gap) * (i + 0) - (width + gap) * (this.dimensions.H - 1) / 2;
                let yy = (width + gap) * (j + 0) - (width + gap) * (this.dimensions.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                this.blockPosArr[i][j] = pos;
                this.blockArr[i][j] = null;
            }
        }

        // Initialize normal candies
        for (let i = 0; i < this.dimensions.H; i++) {
            for (let j = 0; j < this.dimensions.V; j++) {
                if (gameLogic.hideFullList.length < this.dimensions.H * this.dimensions.V) {
                    gameLogic.hideFullList.push([i, j]);
                }
                let xx = (width + gap) * (i + 0) - (width + gap) * (this.dimensions.H - 1) / 2;
                let yy = (width + gap) * (j + 0) - (width + gap) * (this.dimensions.V - 1) / 2;
                let pos = v3(xx, yy, 1);
                if (gameLogic.checkInHideList(i, j)) {
                    this.blockArr[i][j] = null;
                    continue;
                }
                count++;

                let type = -1;
                if (this.blockArr[i][j]) continue;
                let block = this.addBlock(i, j, pos, type);
                let sameHor = this._checkHorizontal(block.getComponent(gridCmpt));
                let sameVer = this._checkVertical(block.getComponent(gridCmpt));
                if (sameHor.length >= 3 || sameVer.length >= 3) {
                    block.getComponent(gridCmpt).setType((block.getComponent(gridCmpt).type + 1) % gameLogic.blockCount);
                } else if (sameHor.length == 2 && sameVer.length == 2) {
                    let cornerH = sameHor[1].data.h;
                    let cornerV = sameVer[1].data.v;
                    let corner = this.blockArr[cornerH][cornerV];
                    if (corner && corner.getComponent(gridCmpt).type == block.getComponent(gridCmpt).type) {
                        block.getComponent(gridCmpt).setType((block.getComponent(gridCmpt).type + 1) % gameLogic.blockCount);
                    }
                }
                block.setScale(v3(0, 0, 0));
                tween(block).to(count / 100, {scale: v3(1, 1, 1)}).start();
                this.blockArr[i][j] = block;
            }
        }
        await CocosHelper.delayTime(0.8);
    }

    addBlock(i: number, j: number, pos: Vec3 = null, type: number = -1): Node {
        let block = instantiate(this.gridPre);
        this.gridNode.addChild(block);
        block.getComponent(gridCmpt).initData(i, j, type);
        if (pos) {
            block.setPosition(pos);
        }
        return block;
    }

    private _checkHorizontal(item: gridCmpt): gridCmpt[] {
        let arr: gridCmpt[] = [item];
        let startX = item.data.h;
        let startY = item.data.v;
        // Right
        for (let i = startX + 1; i < this.dimensions.H; i++) {
            if (!this.blockArr[i][startY]) break;
            let ele = this.blockArr[i][startY].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type && ele.type < Constants.NormalType) {
                arr.push(ele);
            } else {
                break;
            }
        }
        // Left
        for (let i = startX - 1; i >= 0; i--) {
            if (i < 0) break;
            if (!this.blockArr[i][startY]) break;
            let ele = this.blockArr[i][startY].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type && ele.type < Constants.NormalType) {
                arr.push(ele);
            } else {
                break;
            }
        }
        if (arr.length < 2) return [];
        return arr;
    }

    private _checkVertical(item: gridCmpt): gridCmpt[] {
        let arr: gridCmpt[] = [item];
        let startX = item.data.h;
        let startY = item.data.v;
        // Up
        for (let i = startY + 1; i < this.dimensions.V; i++) {
            if (!this.blockArr[startX][i]) break;
            let ele = this.blockArr[startX][i].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type && ele.type < Constants.NormalType) {
                arr.push(ele);
            } else {
                break;
            }
        }
        // Down
        for (let i = startY - 1; i >= 0; i--) {
            if (i < 0) break;
            if (!this.blockArr[startX][i]) break;
            let ele = this.blockArr[startX][i].getComponent(gridCmpt);
            if (!ele || item.getMoveState()) break;
            if (ele.type == item.type && ele.type < Constants.NormalType) {
                arr.push(ele);
            } else {
                break;
            }
        }
        if (arr.length < 2) return [];
        return arr;
    }

    async startCheckThree(cb: Function = null): Promise<boolean> {
        return new Promise(async resolve => {
            let samelist = [];
            for (let i = 0; i < this.dimensions.H; i++) {
                for (let j = 0; j < this.dimensions.V; j++) {
                    // if (!this.isValid) {
                    //     resolve(false);
                    //     return;
                    // }
                    let {result, hor, ver} = this.checkMatches(i, j, samelist);
                    if (!result) continue;
                    if (hor.length >= 3 && ver.length >= 3) {
                        hor = hor.slice(1, hor.length);//将自己去掉一个（重复）
                        hor = hor.concat(ver);
                        samelist.push(hor);
                    }
                }
            }

            //check if special 2x2 exist
            for (let i = 0; i < this.dimensions.H; i++) {
                for (let j = 0; j < this.dimensions.V; j++) {
                    let {result, hor, ver} = this.checkMatches(i, j, samelist);
                    if (!result) continue;
                    if (hor.length > 1 && hor.length <= 3 && ver.length > 1 && ver.length <= 3) {
                        let center = this.blockArr[i][j].getComponent(gridCmpt);
                        //check corner 4 direction
                        for (let k = 0; k < this.cornerPos.length; k++) {
                            let h = center.data.h + this.cornerPos[k][0];
                            let v = center.data.v + this.cornerPos[k][1];
                            if (h < 0 || v < 0 || h >= this.dimensions.H || v >= this.dimensions.V) continue;
                            let corner = this.blockArr[h][v];

                            if (corner && center.type == corner.getComponent(gridCmpt).type
                                && corner.getComponent(gridCmpt).type < Constants.NormalType) {
                                if (!this.checkExist(corner.getComponent(gridCmpt), samelist)
                                    && hor.findIndex(x => x.h == h) > -1 && ver.findIndex(x => x.v == v) > -1) {

                                    hor.push(corner.getComponent(gridCmpt));
                                    hor = hor.slice(1, hor.length);//将自己去掉一个（重复）
                                    hor = hor.concat(ver);
                                    // check if the corner has more hor or ver -> add the additrional hor or ver
                                    let cornerHor = this._checkHorizontal(corner.getComponent(gridCmpt));
                                    let cornerVer = this._checkVertical(corner.getComponent(gridCmpt));
                                    if (cornerHor.length > 3 || cornerVer.length > 3) continue;
                                    for (let additionalHor = 0; additionalHor < cornerHor.length; additionalHor++) {
                                        let exist = hor.findIndex(x => x.h == cornerHor[additionalHor].data.h && x.v == cornerHor[additionalHor].data.v);
                                        if (exist == -1) {
                                            hor.push(cornerHor[additionalHor]);
                                        }
                                    }

                                    for (let additionalVer = 0; additionalVer < cornerVer.length; additionalVer++) {
                                        let exist = hor.findIndex(x => x.h == cornerVer[additionalVer].data.h && x.v == cornerVer[additionalVer].data.v);
                                        if (exist == -1) {
                                            hor.push(cornerVer[additionalVer]);
                                        }
                                    }

                                    samelist.push(hor);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            for (let i = 0; i < this.dimensions.H; i++) {
                for (let j = 0; j < this.dimensions.V; j++) {
                    let {result, hor, ver} = this.checkMatches(i, j, samelist);
                    if (!result) continue;
                    if (hor.length >= 3) {
                        samelist.push(hor);
                    } else if (ver.length >= 3) {
                        samelist.push(ver);
                    }
                }
            }
            cb && cb(!!samelist.length);
            await this.handleSamelist(samelist);
            let bool = !!samelist.length;
            resolve(bool);
        })
    }

    private checkMatches(i: number, j: number, sameList: any[]): {result: boolean, hor: gridCmpt[], ver: gridCmpt[]} {
        let item = this.blockArr[i][j];
        if (!item || item.getComponent(gridCmpt).getMoveState()) return {result: false, hor: null, ver: null};
        if (this.checkExist(item.getComponent(gridCmpt), sameList)) return {result: false, hor: null, ver: null};
        let hor: gridCmpt[] = this._checkHorizontal(item.getComponent(gridCmpt));
        let ver: gridCmpt[] = this._checkVertical(item.getComponent(gridCmpt));
        return {result: true, hor: hor, ver: ver};
    }

    private checkExist(item: gridCmpt, samelist: any[]) {
        for (let i = 0; i < samelist.length; i++) {
            for (let j = 0; j < samelist[i].length; j++) {
                let ele: gridCmpt = samelist[i][j];
                if (ele.data.h == item.data.h && ele.data.v == item.data.v) {
                    return true;
                }
            }
        }
        return false;
    }

    private async handleSamelist(samelist: any[]) {
        return new Promise(async resolve => {
            if (samelist.length < 1) {
                resolve("");
                return;
            }
            this._deleteDuplicates(samelist);
            //0:去掉不合法的
            samelist = this.jugetLegitimate(samelist);
            //1:移除
            for (let i = 0; i < samelist.length; i++) {
                let item = samelist[i];
                if (item.length < 3) continue;
                if (item.length > 3) {
                    await this.synthesisBomb(item);
                    continue;
                }


                for (let j = 0; j < item.length; j++) {
                    let ele: gridCmpt = item[j];
                    /** 在这里检测糖果四周的障碍物 */
                    // let listAround = this.getAroundGrid(ele)
                    // let obstacleList = this.getObstacleList(listAround);
                    // if (obstacleList.length > 0) {
                    //     for (let m = 0; m < obstacleList.length; m++) {
                    //         this.destroyGridAndGetScore(obstacleList[m].getComponent(gridCmpt));
                    //     }
                    // }
                    this.destroyGridAndGetScore(ele);
                }
            }
            // await CocosHelper.delayTime(0.2);
            await this.checkMoveDown();
            resolve("");
        });
    }

    private _deleteDuplicates(samelist: any[]) {
        for (let i = 0; i < samelist.length; i++) {
            let itemlist = samelist[i];
            let bool = true;
            do {
                let count = 0;
                for (let m = 0; m < itemlist.length - 1; m++) {
                    for (let n = m + 1; n < itemlist.length; n++) {
                        if (itemlist[m].data.h == itemlist[n].data.h && itemlist[m].data.v == itemlist[n].data.v) {
                            samelist[i].splice(i, 1);
                            count++;
                            console.log('------------repeat----------');
                            break;
                        }
                    }
                }
                bool = count > 0 ? true : false;
            } while (bool);
        }
    }

    destroyGridAndGetScore(ele: gridCmpt) {
        let particle = instantiate(this.particlePre);
        this.effNode.addChild(particle);
        particle.children.forEach(item => {
            item.active = +item.name == ele.type;
        })
        let tp = ele.type;
        if (!ele || !ele.node) return;
        let worldPosition = ele.node.worldPosition
        this.flyItem(tp, worldPosition);
        particle.setPosition(this.blockPosArr[ele.h][ele.v]);
        this.blockArr[ele.h][ele.v] = null;
        if (isValid(ele) && !ele.isDeleted) {
            ele.isDeleted = true;
            ele.node.destroy();
            // ele.node.active = false;
        }
    }

    async flyItem(type: number, pos: Vec3) {
        let goal = this.goals.get(type);
        if (goal) {
            goal.collect();
        }
    }

    private jugetLegitimate(samelist: any[]) {
        let arr: any[] = [];
        for (let i = 0; i < samelist.length; i++) {
            let itemlist = samelist[i];
            let bool: boolean = this.startJuge(itemlist);
            if (bool) {
                arr.push(itemlist);
            }
        }
        return arr;
    }

    private startJuge(list: gridCmpt[]): boolean {
        let bool = false;
        let len = list.length;
        switch (len) {
            case 3:
                bool = this._atTheSameHorOrVer(list);
                break;

            case 4:
                bool = this._atTheSameHorOrVer(list);
                if (!bool) {
                    bool = this._square(list);
                }
                break;

            case 5:
                bool = this._atTheSameHorOrVer(list);
                if (!bool) {
                    bool = this._atLeastThreeSameHorAndVer(list);
                    if (!bool) {
                        bool = this._square(list);
                    }
                }
                break;

            case 6:
                bool = this._atLeastThreeSameHorAndVer(list);
                if (!bool) {
                    bool = this._square(list);
                }
                break;

            case 7:
                bool = this._atLeastThreeSameHorAndVer(list);
                break;

            default://全在行或者列
                bool = this._atLeastThreeSameHorAndVer(list);
                break;

        }
        return bool;
    }

    private _atLeastThreeSameHorAndVer(list: gridCmpt[]): boolean {
        let bool = false;
        let count = 0;
        //同一列
        for (let i = 0; i < list.length; i++) {
            let item1 = list[i];
            for (let j = 0; j < list.length; j++) {
                let item2 = list[j];
                if (item1.data.h == item2.data.h) {
                    count++;
                    break;
                }
            }
        }
        if (count < 3) return bool;
        count = 0;
        //同一行
        for (let i = 0; i < list.length; i++) {
            let item1 = list[i];
            for (let j = 0; j < list.length; j++) {
                let item2 = list[j];
                if (item1.data.v == item2.data.v) {
                    count++;
                    break;
                }
            }
        }
        if (count < 3) return bool;
        return true;
    }

    private _square(list: gridCmpt[]): boolean {
        let horCount = 0;
        let verCount = 0;
        let center = list[0];
        for (let i = 0; i < list.length; i++) {
            if (!list[i] || !list[i].data) continue;
            if (list[i].data.h == center.data.h) {
                horCount++;
            }
            if (list[i].data.v == center.data.v) {
                verCount++;
            }
        }

        if ((horCount >= 3 && verCount >= 3) || Math.abs(horCount - verCount) > 1) return false;
        return true;

    }

    /**
     * 处在同一行/或者同一列
     * @param list
     * @returns
     */
    private _atTheSameHorOrVer(list: gridCmpt[]): boolean {
        let item = list[0];
        let bool = true;
        //同一列
        for (let i = 0; i < list.length; i++) {
            if (item.data.h != list[i].data.h) {
                bool = false;
                break;
            }
        }
        if (bool) return bool;
        bool = true;
        //同一行
        for (let i = 0; i < list.length; i++) {
            if (item.data.v != list[i].data.v) {
                bool = false;
                break;
            }
        }
        return bool;
    }

    synthesisBomb(item: gridCmpt[]) {
        return new Promise(resolve => {

            /** 先找当前item中是否包含curTwo,包含就以curTwo为中心合成 */
            let center: gridCmpt = null;
            for (let j = 0; j < item.length; j++) {
                for (let m = 0; m < this.gameViewComponent.touchManager.getCurTwo.length; m++) {
                    if (item[j].h == this.gameViewComponent.touchManager.getCurTwo[m].h && item[j].v == this.gameViewComponent.touchManager.getCurTwo[m].v) {
                        center = item[j];
                        break;
                    }
                }
            }
            if (!center) {
                center = item[Math.floor(item.length / 2)];
            }
            let bombType = Bomb.plane;
            let isSquare = this._square(item);
            if (!isSquare) {
                bombType = gameLogic.getBombType(item);
            }
            let count = 0;
            let count1 = 0;
            for (let j = 0; j < item.length; j++) {
                let ele: gridCmpt = item[j];
                let tp = ele.type;
                if (!ele || !ele.node) continue;
                // this.flyItem(tp, worldPosition);
                count1++;
                tween(ele.node).to(0.1, {position: this.blockPosArr[center.h][center.v]}).call((target) => {
                    count++;
                    let gt = target.getComponent(gridCmpt);
                    console.log(gt.h, gt.v)
                    if (gt.h == center.h && gt.v == center.v) {
                        gt.setType(bombType);
                    } else {
                        this.flyItem(gt.type, gt.node.worldPosition);
                        this.blockArr[gt.h][gt.v] = null;
                        gt.node.destroy();
                    }
                    if (count == count1) {
                        resolve("");
                    }
                }).start();
            }
        })
    }

    async checkMoveDown() {
        this.checkingMoveDown ++;
        if (this.checkingMoveDown > 1) return;
        return new Promise(async resolve => {
            for (let i = 0; i < this.dimensions.H; i++) {
                let count = 0;
                for (let j = 0; j < this.dimensions.V; j++) {
                    // if (!this.isValid) {
                    //     this.checkingMoveDown = 0;
                    //     return;
                    // }
                    let block = this.blockArr[i][j];
                    let isHide = gameLogic.checkInHideList(i, j);
                    if (!block) {
                        if (!isHide) {
                            count++;
                        } else {
                            //当前格子以下是不是全是边界空的，是边界空的就忽略，否则就+1
                            let bool = gameLogic.checkAllInHideList(i, j);
                            if (!bool && count > 0) {
                                count++;
                            }
                        }
                    }
                    else if (block && count > 0) {
                        let count1 = await this.getDownLastCount(i, j, count);
                        this.blockArr[i][j] = null;
                        this.blockArr[i][j - count1] = block;
                        block.getComponent(gridCmpt).initData(i, j - count1);
                        this.resetTimeInterval();
                        tween(block).to(0.5, { position: this.blockPosArr[i][j - count1] }, { easing: 'backOut' }).call(() => {

                        }).start();
                    }
                }
            }
            // await CocosHelper.delayTime(0.2);
            await this.checkReplenishBlock();
            if (this.checkingMoveDown > 1) {
                this.checkingMoveDown = 0;
                await this.checkMoveDown();
            }
            this.checkingMoveDown = 0;
            resolve("");
        });
    }

    resetTimeInterval() {
        clearInterval(this.intervalTipsIndex);
        this.downTime = 1;
    }
    getTimeInterval() {
        return this.downTime;
    }
    async getDownLastCount(i, j, count): Promise<number> {
        return new Promise(resolve => {
            let tempCount = 0;
            let func = (i, j, count) => {
                tempCount = count;
                let bool = gameLogic.checkInHideList(i, j - count);
                if (bool || this.blockArr[i][j - count]) {
                    func(i, j, count - 1);
                }
            }
            func(i, j, count);
            resolve(tempCount);
        })
    }
    async checkReplenishBlock() {
        return new Promise(async resolve => {
            let count1 = 0;
            let count2 = 0;
            for (let i = 0; i < this.dimensions.H; i++) {
                for (let j = 0; j < this.dimensions.V; j++) {
                    let block = this.blockArr[i][j];
                    let isHide = gameLogic.checkInHideList(i, j);
                    if (!block && !isHide) {
                        let pos = this.blockPosArr[i][this.dimensions.V - 1];
                        let block = this.addBlock(i, j, v3(pos.x, pos.y + Constants.Width + 20, 1));
                        this.blockArr[i][j] = block;
                        this.resetTimeInterval();
                        count1++;
                        tween(block).to(0.5, { position: this.blockPosArr[i][j] }, { easing: 'backOut' }).call(() => {
                            count2++;
                            if (count1 == count2) {
                                resolve("");
                            }
                        }).start();
                    }
                }
            }
            // await CocosHelper.delayTime(0.5);
            resolve("");
        });
    }

    checkClickOnBlock(pos: Vec3): gridCmpt {
        // if (!this.isValid) return;
        if (this.blockArr.length < 1) return;
        for (let i = 0; i < this.dimensions.H; i++) {
            for (let j = 0; j < this.dimensions.V; j++) {
                let block = this.blockArr[i][j];
                if (block && block.getComponent(gridCmpt).type < Constants.NormalType) {
                    if (block.getComponent(gridCmpt).isInside(pos)) {
                        return block.getComponent(gridCmpt);
                    }
                }
            }
        }
        return null;
    }

    changeData(item1: gridCmpt, item2: gridCmpt) {
        /** 数据交换 */
        let temp = item1.data;
        item1.data = item2.data;
        item2.data = temp;

        /** 位置交换 */
        let x1 = item1.data.h;
        let y1 = item1.data.v;
        let x2 = item2.data.h;
        let y2 = item2.data.v;
        let pTemp = this.blockArr[x1][y1];
        this.blockArr[x1][y1] = this.blockArr[x2][y2]
        this.blockArr[x2][y2] = pTemp;
        this.blockArr[x1][y1].getComponent(gridCmpt).initData(this.blockArr[x1][y1].getComponent(gridCmpt).data.h, this.blockArr[x1][y1].getComponent(gridCmpt).data.v);
        this.blockArr[x2][y2].getComponent(gridCmpt).initData(this.blockArr[x2][y2].getComponent(gridCmpt).data.h, this.blockArr[x2][y2].getComponent(gridCmpt).data.v);
    }

    async checkAgain(isResult: boolean = false) {
        let bool = await this.startCheckThree();
        if (bool) {
            this.checkAgain(isResult);
        }
        else {
            await CocosHelper.delayTime(.5);
            this.gameViewComponent.touchManager.resetSelected();
            let isWin = true;
            this.goals.forEach((value, key) => {
                if (value.getGoal() > 0) {
                    isWin = false;
                }
            });

            if (isWin) {
                await CocosHelper.delayTime(2);
                eventMgt.emit(EventName.ShowResultPanel, true, () => {
                    this.initLayout();
                    eventMgt.emit(EventName.ChangeCarSkin, -1);
                });
            }

            // if (this.stepCount <= 0) {
            //     eventMgt.emit(EventName.ShowResultPanel, false, () => {
            //         this.loadExtraData(this.level);
            //         eventMgt.emit(EventName.ChangeCarSkin, -1);
            //     });
            // }

            // if (isResult) {
            //     console.log(isResult);
            //     this.checkAllBomb();
            // }
        }
    }

    async handleSamelistBomb(samelist: any[]): Promise<void> {
        return new Promise(async resolve => {
            if (samelist.length < 1) {
                resolve();
                return;
            }
            // 移除
            for (let i = 0; i < samelist.length; i++) {
                let ele: gridCmpt = samelist[i];
                if (!ele || !ele.node) continue;
                /** 在这里检测糖果四周的障碍物 */
                let listAround = this.getAroundGrid(ele)
                // let obstacleList = this.getObstacleList(listAround);
                // if (obstacleList.length > 0) {
                //     for (let m = 0; m < obstacleList.length; m++) {
                //         this.destroyGridAndGetScore(obstacleList[m].getComponent(gridCmpt));
                //     }
                // }
                this.destroyGridAndGetScore(ele);
            }

            await CocosHelper.delayTime(0.2);
            await this.checkMoveDown();
            resolve();
        });
    }

    getAroundGrid(grid: gridCmpt) {
        if (grid.type > Constants.NormalType) return [];
        let h = grid.h;
        let v = grid.v;
        let left = h - 1;
        let right = h + 1;
        let up = v + 1;
        let down = v - 1;
        let list = [];
        if (left >= 0 && this.blockArr[left][v]) {
            list.push(this.blockArr[left][v]);
        }
        if (right < Constants.layCount && this.blockArr[right][v]) {
            list.push(this.blockArr[right][v]);
        }
        if (down >= 0 && this.blockArr[h][down]) {
            list.push(this.blockArr[h][down]);
        }
        if (up < Constants.layCount && this.blockArr[h][up]) {
            list.push(this.blockArr[h][up]);
        }
        return list;
    }

}