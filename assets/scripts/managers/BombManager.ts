import {_decorator, Node, v3, Vec3, instantiate, Prefab, tween, Sprite, isValid, Vec2} from 'cc';
import {Bomb, Constants, MergeSpecial} from '../enumConst';
import {gridCmpt} from '../item/gridCmpt';
import {rocketCmpt} from '../item/rocketCmpt';
import {planeCmpt} from '../item/planeCmpt';
import {CocosHelper} from '../components/cocosHelper';
import {GameBoardManager} from './GameBoardManager';
import {gameLogic} from '../gameLogic';

export class BombManager {
    private gameBoard: GameBoardManager;
    private effNode: Node;
    private rocketPre: Prefab;
    private planePre: Prefab;
    private particlePre: Prefab;
    private surroundPos = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    constructor(effNode: Node, rocketPre: Prefab, planePre: Prefab, particlePre: Prefab, gameBoard: GameBoardManager) {
        this.effNode = effNode;
        this.rocketPre = rocketPre;
        this.planePre = planePre;
        this.particlePre = particlePre;
        this.gameBoard = gameBoard;
    }

    isBomb(bc: gridCmpt): boolean {
        return bc.type >= 8 && bc.type <= 12;
    }

    async handleBomb(bc: gridCmpt, isResult: boolean = false, special: number = -1): Promise<boolean> {
        if (this.isBomb(bc)) {
            let bombList = [];
            let list2 = [];
            let list: gridCmpt[] = await this.getBombList(bc, special);
            bombList.push(list);
            for (let i = 0; i < list.length; i++) {
                if (list[i].h == bc.h && list[i].v == bc.v) continue;
                if (this.isBomb(list[i])) {
                    bombList.push(await this.getBombList(list[i]));
                }
            }
            let func = (pc: gridCmpt) => {
                for (let i = 0; i < list2.length; i++) {
                    if (list2[i].h == pc.h && list2[i].v == pc.v) {
                        return true;
                    }
                }
                return false;
            }
            for (let i = 0; i < bombList.length; i++) {
                for (let j = 0; j < bombList[i].length; j++) {
                    let item = bombList[i][j];
                    if (!func(item)) {
                        list2.push(item);
                    }
                }
            }

            await this.gameBoard.handleSamelistBomb(list2);
            return true;
        }
        return false;
    }

    async getBombList(bc: gridCmpt, special: number = -1): Promise<gridCmpt[]> {
        let list: gridCmpt[] = [];
        switch (bc.type) {
            case Bomb.hor:
                if (special == MergeSpecial.VerHor) {
                    for (let i = 0; i < this.gameBoard.getDimensions().V; i++) {
                        let item = this.gameBoard.getBlockArr()[bc.h][i];
                        if (item) {
                            list.push(item.getComponent(gridCmpt));
                        }
                    }
                }
                for (let i = 0; i < this.gameBoard.getDimensions().H; i++) {
                    let item = this.gameBoard.getBlockArr()[i][bc.v];
                    if (item) {
                        list.push(item.getComponent(gridCmpt));
                    }
                }

                let rocket1 = instantiate(this.rocketPre);
                this.effNode.addChild(rocket1);
                rocket1.setPosition(bc.node.position);
                rocket1.getComponent(rocketCmpt).initData(bc.type);
                break;
            case Bomb.ver:
                if (special == MergeSpecial.VerHor) {
                    for (let i = 0; i < this.gameBoard.getDimensions().H; i++) {
                        let item = this.gameBoard.getBlockArr()[i][bc.v];
                        if (item) {
                            list.push(item.getComponent(gridCmpt));
                        }
                    }
                }
                for (let i = 0; i < this.gameBoard.getDimensions().V; i++) {
                    let item = this.gameBoard.getBlockArr()[bc.h][i];
                    if (item) {
                        list.push(item.getComponent(gridCmpt));
                    }
                }
                let rocket = instantiate(this.rocketPre);
                this.effNode.addChild(rocket);
                rocket.setPosition(bc.node.position);
                rocket.getComponent(rocketCmpt).initData(bc.type);
                break;
            case Bomb.bomb:
                if (special == MergeSpecial.BombHorOrVer) {
                    for (let j = bc.v - 1; j <= bc.v + 1 && j < this.gameBoard.getDimensions().V && j >= 0; j++)
                        for (let i = 0; i < this.gameBoard.getDimensions().H; i++) {
                            let item = this.gameBoard.getBlockArr()[i][j];
                            if (item) {
                                list.push(item.getComponent(gridCmpt));
                            }
                        }

                    for (let i = bc.h - 1; i <= bc.h + 1 && i < this.gameBoard.getDimensions().H && i >= 0; i++)
                        for (let j = 0; j < this.gameBoard.getDimensions().V; j++) {
                            let item = this.gameBoard.getBlockArr()[i][j];
                            if (item) {
                                list.push(item.getComponent(gridCmpt));
                            }
                        }
                    break;
                }
                let extend = special == MergeSpecial.BombBomb ? 4 : 2;
                for (let i = bc.h - extend; i <= bc.h + extend && i < this.gameBoard.getDimensions().V; i++) {
                    for (let j = bc.v - extend; j <= bc.v + extend && j < this.gameBoard.getDimensions().V; j++) {
                        if (i < 0 || j < 0) continue;
                        let item = this.gameBoard.getBlockArr()[i][j];
                        if (item) {
                            list.push(item.getComponent(gridCmpt));
                        }
                    }
                }
                break;
            case Bomb.plane:
                let targetNodes: Vec2[] = [];
                let distance = [];
                let targets: Vec2[] = [];
                let targetNumbers = special == Bomb.plane ? 3 : 1;
                for (let i = 0; i < targetNumbers; i++) {
                    let h = Math.floor(Math.random() * this.gameBoard.getDimensions().H);
                    let v = Math.floor(Math.random() * this.gameBoard.getDimensions().V);
                    distance.push(1000);
                    targets.push(new Vec2(h, v));
                }
                for (let i = 0; i < this.gameBoard.getDimensions().H; i++) {
                    for (let j = 0; j < this.gameBoard.getDimensions().V; j++) {
                        for (let tar = 0; tar < targetNumbers; tar++) {
                            let item = this.gameBoard.getBlockArr()[i][j];
                            let itemDistance = Math.abs(i - targets[tar].x) + Math.abs(j - targets[tar].y);
                            if (item && itemDistance < distance[tar] && !targetNodes.includes(new Vec2(i, j))) {
                                distance[tar] = itemDistance;
                                targetNodes[tar] = new Vec2(i, j);
                            }
                        }
                    }
                }

                for (let i = 0; i < this.surroundPos.length; i++) {
                    let h = bc.h + this.surroundPos[i][0];
                    let v = bc.v + this.surroundPos[i][1];
                    if (h < 0 || v < 0 || h >= this.gameBoard.getDimensions().H || v >= this.gameBoard.getDimensions().V) continue;
                    let item = this.gameBoard.getBlockArr()[h][v];
                    if (item) list.push(item.getComponent(gridCmpt));
                }

                list.push(bc);

                for (let i = 0; i < targetNodes.length; i++) {
                    let plane = instantiate(this.planePre);
                    this.effNode.addChild(plane);
                    plane.setPosition(bc.node.position);
                    plane.getComponent(planeCmpt).initData(this.gameBoard.getBlockPosArr()[targetNodes[i].x][targetNodes[i].y], special, targetNodes[i], (pos, type) => this.planeTargetCallback(pos, type));
                }
                break;
            case Bomb.allSame:
                let curType: number = -1;
                if (special == -1) {
                    curType = Math.floor(Math.random() * gameLogic.blockCount);
                }
                let node = bc.node.getChildByName('icon').getChildByName('Match12');
                node.getComponent(Sprite).enabled = false;
                node.getChildByName('a').active = true;
                if (curType < 0) curType = Math.floor(Math.random() * gameLogic.blockCount);
                for (let i = 0; i < this.gameBoard.getDimensions().H; i++) {
                    for (let j = 0; j < this.gameBoard.getDimensions().V; j++) {
                        let item = this.gameBoard.getBlockArr()[i][j];
                        if (item && (item.getComponent(gridCmpt).type == curType || special == Bomb.allSame)) {
                            if (special != -1 && special != Bomb.allSame) {
                                if (special == Bomb.bomb || special == Bomb.plane)
                                    item.getComponent(gridCmpt).setType(special);
                                else
                                    item.getComponent(gridCmpt).setType(Math.floor(Math.random() * 1.9) + 8);
                            }

                            list.push(item.getComponent(gridCmpt));
                            let particle = instantiate(this.particlePre);
                            this.effNode.addChild(particle);
                            particle.setPosition(bc.node.position);
                            particle.children.forEach(item => {
                                item.active = item.name == "move";
                            });
                            tween(particle).to(0.5, {position: item.position}).call(async (particle) => {
                                await CocosHelper.delayTime(0.2);
                                particle.destroy();
                            }).start();
                        }
                    }
                }
                list.push(bc);
                await CocosHelper.delayTime(0.7);
                break;
        }
        return list;
    }

    private destroyGridAndGetScore(ele: gridCmpt) {
        let particle = instantiate(this.particlePre);
        this.effNode.addChild(particle);
        particle.children.forEach(item => {
            item.active = +item.name == ele.type;
        });
        let tp = ele.type;
        if (!ele || !ele.node) return;
        let worldPosition = ele.node.worldPosition;
        particle.setPosition(this.gameBoard.getBlockPosArr()[ele.h][ele.v]);
        this.gameBoard.getBlockArr()[ele.h][ele.v] = null;
        if (isValid(ele) && !ele.isDeleted) {
            ele.isDeleted = true;
            ele.node.destroy();
        }
    }

    private async planeTargetCallback(position: Vec2, special: number = -1): Promise<void> {
        return new Promise(async resolve => {
            let target = this.gameBoard.getBlockArr()[position.x][position.y];
            if (target) {
                if (special != -1 && special != Bomb.plane) {
                    target.getComponent(gridCmpt).setType(special);
                    await this.handleBomb(target.getComponent(gridCmpt));
                } else {
                    this.destroyGridAndGetScore(target.getComponent(gridCmpt));
                    await this.gameBoard.checkMoveDown();
                    await this.gameBoard.checkAgain();
                }
            }
            resolve();
        });
    }

    async handleComboBomb(bomb1: gridCmpt, bomb2: gridCmpt) {
        // bomb + bomb
        if (bomb1.type == Bomb.bomb && bomb2.type == Bomb.bomb) {
            await this.handleBomb(bomb2, false, MergeSpecial.BombBomb);
            return;
        }

        if ((bomb1.type == Bomb.ver || bomb1.type == Bomb.hor) && (bomb2.type == Bomb.ver || bomb2.type == Bomb.hor)) {
            this.destroyGridAndGetScore(bomb2);
            await this.handleBomb(bomb1, false, MergeSpecial.VerHor);
            return;
        }
        //bomb + ver/hor
        if (bomb1.type == Bomb.bomb && (bomb2.type == Bomb.ver || bomb2.type == Bomb.hor)) {
            this.destroyGridAndGetScore(bomb2);
            await this.handleBomb(bomb1, false, MergeSpecial.BombHorOrVer);
            return;
        }
        if (bomb2.type == Bomb.bomb && (bomb1.type == Bomb.ver || bomb1.type == Bomb.hor)) {
            this.destroyGridAndGetScore(bomb1);
            await this.handleBomb(bomb2, false, MergeSpecial.BombHorOrVer);
            return;
        }

        // plane + other
        if (bomb2.type == Bomb.plane && bomb1.type >= Bomb.ver && bomb1.type <= Bomb.plane) {
            await this.handleBomb(bomb2, false, bomb1.type);
            this.destroyGridAndGetScore(bomb1);

            return;
        }

        if (bomb1.type == Bomb.plane && bomb2.type >= Bomb.ver && bomb2.type <= Bomb.bomb) {
            await this.handleBomb(bomb1, false, bomb2.type);
            this.destroyGridAndGetScore(bomb2);
            return;
        }

        //bomb + allSame
        if ((bomb1.type >= Bomb.ver && bomb1.type <= Bomb.allSame) && bomb2.type == Bomb.allSame) {
            await this.handleBomb(bomb2, false, bomb1.type);
            if (bomb1.type == Bomb.allSame) this.destroyGridAndGetScore(bomb1);
            return;
        }

        if (bomb1.type == Bomb.allSame && (bomb2.type >= Bomb.ver && bomb2.type <= Bomb.allSame)) {
            await this.handleBomb(bomb1, false, bomb2.type);
            if (bomb2.type == Bomb.allSame) this.destroyGridAndGetScore(bomb2);
            return;
        }

    }
} 