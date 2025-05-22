
import { Node, Vec3, } from "cc";
import { Bomb, BombArea, Constants } from "./enumConst";
import { gridCmpt } from "./item/gridCmpt";
class GameLogic {
    public rewardGold: number = 100;
    public curLevel: number = 1;
    /** n糖果种类 */
    public blockCount: number = 5;
    /** 开始游戏选择的的道具 */
    public toolsArr: number[] = [];
    /** 空位 */
    public hideFullList: any = [];
    public hideList = [];
    /** 挨着旁边的障碍物列表，这里做个类型记录 */
    public sideObstacleList: number[] = [201]
    public moves: number = 15;

    protected async onInit(...args: any[]) {
    }

    checkInHideList(i: number, j: number) {
        for (let m = 0; m < this.hideList.length; m++) {
            if (this.hideList[m][0] == i && this.hideList[m][1] == j) {
                return true;
            }
        }
        return false;
    }

    checkAllInHideList(i: number, j: number) {
        let bool = true;
        for (let m = j; m >= 0; m--) {
            let isInHide = this.checkInHideList(i, m);
            if (!isInHide) {
                bool = false;
                break;
            }
        }
        return bool;
    }

    async resetHdeList(lv: number) {
        // 有障碍物
        // let data = await LevelConfig.getLevelData(lv);
        // let idArr = data.mapData[0].m_id;
        // for (let i = 0; i < idArr.length; i++) {
        //     if (idArr[i] > Constant.NormalType) {
        //         this.hideList = [];
        //         return;
        //     }

        // }
        if (this.defaultHidelist[lv - 1]) {
            this.hideList = this.defaultHidelist[lv - 1];
            return;
        }
        if (this.hideFullList.length == 0) {
            this.hideList = this.defaultHidelist[0];
            return;
        }
        this.hideList = [];
        let rand = Math.floor(Math.random() * 25);
        for (let i = 0; i < rand; i++) {
            let idx = Math.floor(Math.random() * this.hideFullList.length);
            this.hideList.push(this.hideFullList[idx])
        }
    }
    /** 是否相邻 */
    isNeighbor(gc1: gridCmpt, gc2: gridCmpt) {
        if (gc1.h == gc2.h && Math.abs(gc1.v - gc2.v) == 1) {
            return true;
        }
        if (gc1.v == gc2.v && Math.abs(gc1.h - gc2.h) == 1) {
            return true;
        }
        return false;
    }

    isSameGrid(gc1: gridCmpt, gc2: gridCmpt) {
        return gc1.v == gc2.v && gc1.h == gc2.h;
    }

    /** 同一行 */
    private isSameHorizental(list: gridCmpt[]) {
        let first = list[0].v;
        for (let i = 0; i < list.length; i++) {
            if (list[i].v != first) return false;
        }
        return true;
    }
    /** 同一列 */
    private isSameVertical(list: gridCmpt[]) {
        let first = list[0].h;
        for (let i = 0; i < list.length; i++) {
            if (list[i].h != first) return false;
        }
        return true;
    }

    /** 获取炸弹编号 */
    getBombType(list: gridCmpt[]) {
        let len = list.length;
        if (len == 4) {
            if (this.isSameHorizental(list)) return Bomb.ver;
            if (this.isSameVertical(list)) return Bomb.hor;
        } else {
            if (this.isSameHorizental(list) || this.isSameVertical(list)) return Bomb.allSame;
            return Bomb.bomb;
        }

    }

    gridToBombArea(grid: gridCmpt): BombArea {
        return {
            h: grid.h,
            v: grid.v,
            type: grid.type,
            position: grid.node ? grid.node.position : Vec3.ZERO
        }
    }
 
    bombAreaToGrid(bombArea: BombArea, gridArr: Node[][]): gridCmpt {
        let grid = gridArr[bombArea.h][bombArea.v];
        if (grid) {
            return grid.getComponent(gridCmpt);
        }
        return null;
    }

    /**
    * 提示道具拓展，居中检测其上下左右类型
    * @param ele 
    */
    public checkTipsGroup(ele: gridCmpt, gridArr: Node[][]) {
        let otp = ele.type;
        let xx = ele.data.h;
        let yy = ele.data.v;
        let idxLeft = xx - 1;
        let idxRight = xx + 1;
        let idxUp = yy + 1;
        let idxDown = yy - 1;
        let aitemLeft = idxLeft >= 0 ? gridArr[idxLeft][yy] : null;
        let aitemLeft1 = idxLeft - 1 >= 0 ? gridArr[idxLeft - 1][yy] : null;
        let aitemRight = idxRight < Constants.layCount ? gridArr[idxRight][yy] : null;
        let aitemRight1 = idxRight + 1 < Constants.layCount ? gridArr[idxRight + 1][yy] : null;
        let aitemUp = idxUp < Constants.layCount ? gridArr[xx][idxUp] : null;
        let aitemUp1 = idxUp + 1 < Constants.layCount ? gridArr[xx][idxUp + 1] : null;
        let aitemDown = idxDown >= 0 ? gridArr[xx][idxDown] : null;
        let aitemDown1 = idxDown - 1 >= 0 ? gridArr[xx][idxDown - 1] : null;

        let itemLeft = aitemLeft && aitemLeft.getComponent(gridCmpt);
        let itemLeft1 = aitemLeft1 && aitemLeft1.getComponent(gridCmpt);
        let itemRight = aitemRight && aitemRight.getComponent(gridCmpt);
        let itemRight1 = aitemRight1 && aitemRight1.getComponent(gridCmpt);
        let itemUp = aitemUp && aitemUp.getComponent(gridCmpt);
        let itemUp1 = aitemUp1 && aitemUp1.getComponent(gridCmpt);
        let itemDown = aitemDown && aitemDown.getComponent(gridCmpt);
        let itemDown1 = aitemDown1 && aitemDown1.getComponent(gridCmpt);

        let result = [];
        if (itemLeft && itemLeft.type != otp) {
            if (itemLeft1 && itemLeft1.type == itemLeft.type) {//两个个相同开头
                if (itemUp && itemUp.type == itemLeft1.type) {
                    result = [itemLeft1, itemLeft, itemUp];
                    return result;
                }
                else if (itemRight && itemRight.type == itemLeft.type) {
                    result = [itemLeft1, itemLeft, itemRight];
                    return result;
                }
                else if (itemDown && itemDown.type == itemLeft.type) {
                    result = [itemLeft1, itemLeft, itemDown];
                    return result;
                }
            }
            else {//一个相同开头
                if (itemUp && itemUp1) {
                    if (itemUp1.type == itemLeft.type && itemUp.type == itemLeft.type) {
                        result = [itemUp, itemUp1, itemLeft];
                        return result;
                    }
                }
                else if (itemDown && itemDown1) {
                    if (itemDown1.type == itemLeft.type && itemDown.type == itemLeft.type) {
                        result = [itemDown, itemDown1, itemLeft];
                        return result;
                    }
                }
                else if (itemRight && itemRight1) {
                    if (itemRight1.type == itemLeft.type && itemRight.type == itemLeft.type) {
                        result = [itemRight, itemRight1, itemLeft];
                        return result;
                    }
                }
            }
        }
        //
        if (itemDown && itemDown.type != otp) {
            if (itemDown1 && itemDown1.type == itemDown.type) {//两个个相同开头
                if (itemUp && itemUp.type == itemDown1.type) {
                    result = [itemDown1, itemDown, itemUp];
                    return result;
                }
                else if (itemRight && itemRight.type == itemDown.type) {
                    result = [itemDown1, itemDown, itemRight];
                    return result;
                }
                else if (itemLeft && itemLeft.type == itemDown.type) {
                    result = [itemDown1, itemDown, itemLeft];
                    return result;
                }
            }
            else {//一个相同开头
                if (itemUp && itemUp1) {
                    if (itemUp1.type == itemDown.type && itemUp.type == itemDown.type) {
                        result = [itemUp, itemUp1, itemDown];
                        return result;
                    }
                }
                else if (itemLeft && itemLeft1) {
                    if (itemLeft1.type == itemDown.type && itemLeft.type == itemDown.type) {
                        result = [itemLeft, itemLeft1, itemDown];
                        return result;
                    }
                }
                else if (itemRight && itemRight1) {
                    if (itemRight1.type == itemDown.type && itemRight.type == itemDown.type) {
                        result = [itemRight, itemRight1, itemDown];
                        return result;
                    }
                }
            }
        }
        //
        if (itemUp && itemUp.type != otp) {
            if (itemUp1 && itemUp1.type == itemUp.type) {//两个个相同开头
                if (itemLeft && itemLeft.type == itemUp1.type) {
                    result = [itemUp1, itemUp, itemLeft];
                    return result;
                }
                else if (itemRight && itemRight.type == itemUp.type) {
                    result = [itemUp1, itemUp, itemRight];
                    return result;
                }
                else if (itemDown && itemDown.type == itemUp.type) {
                    result = [itemUp1, itemUp, itemDown];
                    return result;
                }
            }
            else {//一个相同开头
                if (itemLeft && itemLeft1) {
                    if (itemLeft.type == itemUp.type && itemLeft1.type == itemUp.type) {
                        result = [itemLeft, itemLeft1, itemUp];
                        return result;
                    }
                }
                else if (itemDown && itemDown1) {
                    if (itemDown1.type == itemUp.type && itemDown.type == itemUp.type) {
                        result = [itemDown, itemDown1, itemUp];
                        return result;
                    }
                }
                else if (itemRight && itemRight1) {
                    if (itemRight1.type == itemUp.type && itemRight.type == itemUp.type) {
                        result = [itemRight, itemRight1, itemUp];
                        return result;
                    }
                }
            }
        }
        //
        if (itemRight && itemRight.type != otp) {
            if (itemRight1 && itemRight1.type == itemRight.type) {//两个个相同开头
                if (itemLeft && itemLeft.type == itemRight1.type) {
                    result = [itemRight1, itemRight, itemLeft];
                    return result;
                }
                else if (itemUp && itemUp.type == itemRight.type) {
                    result = [itemRight1, itemRight, itemUp];
                    return result;
                }
                else if (itemDown && itemDown.type == itemRight.type) {
                    result = [itemRight1, itemRight, itemDown];
                    return result;
                }
            }
            else {//一个相同开头
                if (itemLeft && itemLeft1) {
                    if (itemLeft.type == itemRight.type && itemLeft1.type == itemRight.type) {
                        result = [itemLeft, itemLeft1, itemRight];
                        return result;
                    }
                }
                else if (itemDown && itemDown1) {
                    if (itemDown1.type == itemRight.type && itemDown.type == itemRight.type) {
                        result = [itemDown, itemDown1, itemRight];
                        return result;
                    }
                }
                else if (itemUp && itemUp1) {
                    if (itemUp1.type == itemRight.type && itemUp.type == itemRight.type) {
                        result = [itemUp, itemUp1, itemRight];
                        return result;
                    }
                }
            }
        }
        //
        let tempArr = [
            itemLeft, itemRight, itemUp, itemDown
        ];
        let temp = [];
        for (let i = 0; i < tempArr.length; i++) {
            if (tempArr[i]) {
                temp.push(tempArr[i]);
            }
        }
        if (temp.length >= 3) {
            let type1 = ele.type;
            let type2 = temp[0].type;
            if (temp.length == 3) {
                if (type1 != type2) {
                    if (temp[1].type == type2 && temp[2].type == type2) {
                        if (!itemLeft) {
                            result = [itemUp, itemDown, itemRight];
                        }
                        else if (!itemRight) {
                            result = [itemUp, itemDown, itemLeft];
                        }
                        else if (!itemDown) {
                            result = [itemRight, itemLeft, itemUp];
                        }
                        else if (!itemUp) {
                            result = [itemRight, itemLeft, itemDown];
                        }
                        return result;
                    }
                }
            }
            else {
                let type3 = temp[1].type;
                if (type2 != type1 && type3 != type1) {
                    if (type2 == type3 && type2 == temp[2].type && type2 == temp[3].type) {
                        result = [itemRight, itemLeft, itemUp];
                        return result;
                    }
                    //至少有三个相同类型
                    let count1 = temp.reduce((a, v) => v.type == type2 ? a + 1 : a + 0, 0);
                    let count2 = temp.reduce((a, v) => v.type == type3 ? a + 1 : a + 0, 0);
                    if (count1 == 3 || count2 == 3) {
                        if (itemLeft.type != itemRight.type && itemLeft.type != itemUp.type) {
                            result = [itemUp, itemDown, itemRight];
                            return result;
                        }
                        else if (itemRight.type != itemLeft.type && itemRight.type != itemUp.type) {
                            result = [itemUp, itemDown, itemLeft];
                            return result;
                        }
                        else if (itemUp.type != itemLeft.type && itemRight.type != itemUp.type) {
                            result = [itemRight, itemLeft, itemDown];
                            return result;
                        }
                        else if (itemDown.type != itemLeft.type && itemRight.type != itemDown.type) {
                            result = [itemRight, itemLeft, itemUp];
                            return result;
                        }
                    }

                }
            }
        }
        return result;
    }


    /** 默认地图固定格式 */
    private defaultHidelist = [
        [[0, 0], [0, 1], [1, 0], [0, 8], [0, 7], [1, 8], [8, 0], [8, 1], [7, 0], [8, 8], [8, 7], [7, 8]],
        [
            [0, 0], [0, 1], [0, 2], [1, 0], [2, 0], [1, 1], [0, 8], [8, 8],
            [6, 0], [7, 1], [8, 2], [7, 0], [8, 0], [8, 1],
        ],
        [[4, 5], [4, 6], [4, 7], [4, 8], [4, 0], [4, 1], [4, 2], [4, 3]],
        [
            [2, 8], [3, 8], [4, 8], [5, 8], [6, 8],
            [3, 7], [5, 7], [4, 7], [4, 6]
        ],
        [[0, 4], [1, 4], [2, 4], [3, 4], [5, 4], [6, 4], [7, 4], [8, 4]],
        [
            [0, 4], [1, 4], [2, 4], [3, 4], [5, 4], [6, 4], [7, 4], [8, 4],
            [4, 5], [4, 6], [4, 7], [4, 8], [4, 0], [4, 1], [4, 2], [4, 3]
        ],
        [
            [3, 8], [4, 8], [5, 8], [3, 1], [4, 1], [5, 1],
            [3, 7], [4, 7], [5, 7], [3, 0], [4, 0], [5, 0],
            [0, 5], [1, 5], [2, 5], [6, 5], [7, 5], [8, 5],
            [0, 4], [1, 4], [2, 4], [6, 4], [7, 4], [8, 4],
            [0, 3], [1, 3], [2, 3], [6, 3], [7, 3], [8, 3]
        ],
        [
            [0, 2], [1, 2], [2, 2], [6, 2], [7, 2], [8, 2], [0, 8], [1, 8], [2, 8], [6, 8], [7, 8], [8, 8],
            [0, 1], [1, 1], [2, 1], [6, 1], [7, 1], [8, 1], [0, 7], [1, 7], [2, 7], [6, 7], [7, 7], [8, 7],
            [0, 0], [1, 0], [2, 0], [6, 0], [7, 0], [8, 0], [0, 6], [1, 6], [2, 6], [6, 6], [7, 6], [8, 6]
        ],
        [
            [0, 5], [1, 5], [2, 5], [6, 5], [7, 5], [8, 5],
            [0, 4], [1, 4], [2, 4], [6, 4], [7, 4], [8, 4],
            [0, 3], [1, 3], [2, 3], [6, 3], [7, 3], [8, 3]
        ],
        [
            [0, 0], [1, 0], [2, 1], [3, 1], [4, 2], [5, 2], [6, 3], [7, 3], [8, 4], [6, 5], [7, 5], [4, 6], [5, 6], [2, 7], [3, 7], [0, 8], [1, 8]
        ],
    ]

}

export let gameLogic: GameLogic = new GameLogic();