import { _decorator, Component, Node, Vec3, UITransform, Label } from 'cc';
import { CocosHelper } from '../components/cocosHelper';
import { gameLogic } from '../gameLogic';
import { Constants } from '../enumConst';
import { Bomb } from '../enumConst';
const { ccclass, property } = _decorator;

@ccclass('gridCmpt')
export class gridCmpt extends Component {
    /** 横纵轴编号 */
    // h, v is the positionposition
    public h: number = 0;
    public v: number = 0;
    public type: number = -1;
    public obstacleValue: number = 0;
    public data: { h: number, v: number }

    public initData(h: number, v: number, type: number = -1) {
        this.h = h;
        this.v = v;
        this.data = { h: h, v: v }
        if (type > -1) {
            this.type = type;
        }
        if (this.type == -1) {
            this.type = Math.floor(Math.random() * gameLogic.blockCount);
            // this.type = Math.floor(Math.random() * 2);
        }
        this.node.getChildByName('icon').children.forEach(item => {
            item.active = false;
            if (item.name == `Match${this.type}`) {
                item.active = true;
            }
            if (item.name == this.type + "") {
                item.active = true;
            }
        });
        this.showPos(h, v);
    }
    onDisable() {
        this.type = -1;
    }

    showPos(h: number = this.h, v: number = this.v) {
        let lb = this.node.getChildByName('lb');
        // lb.getComponent(Label).string = `(${h},${v})`;
        lb.active = false;
    }

    isInside(pos: Vec3): boolean {
        let width = this.node.getComponent(UITransform).width;
        let curPos = this.node.position;
        if (Math.abs(pos.x - curPos.x) <= width / 2 && Math.abs(pos.y - curPos.y) <= width / 2) return true;
        return false;
    }

    /** 选中状态 */
    setSelected(bool: boolean) {
        if (!this.isValid) return;
        this.node.getChildByName('icon').children.forEach(item => {
            if (item.active && item.getChildByName('s')) {
                item.getChildByName('s').active = bool;
            }
        })
    }

    getMoveState() {
        return false;
    }

    setType(type: number) {
        if (!this.isValid) return;
        this.type = type;
        this.node.getChildByName('icon').children.forEach(item => {
            item.active = false;
            if (item.name == `Match${this.type}`) {
                item.active = true;
                if (this.type >= Bomb.ver && this.type <= Bomb.allSame) {
                }
            }
            if (item.name == this.type + "") {
                item.active = true;
            }
        });
    }
    setCount(count: number) {
        let lb = this.node.getChildByName('lb');
        lb.getComponent(Label).string = `${count}`;
        if (count == 0) {
            this.node.getChildByName('ok').active = true;
        }
    }
    showGou(bool: boolean) {
        this.node.getChildByName('gou').active = bool;
    }

    /** 显示提示 */
    async showTips() {
        this.node.getChildByName("selected").active = true;
        await CocosHelper.delayTime(2);
        if (this.isValid) {
            this.node.getChildByName("selected").active = false;
        }
    }

    /** 是否已经移除 */
    public isDeleted: boolean = false;

}