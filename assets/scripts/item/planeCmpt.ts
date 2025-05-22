import { _decorator, Component, Node, tween, v3, Vec2, Vec3 } from 'cc';
import { BaseNodeCmpt } from '../components/baseNodeCmpt';
import { Bomb } from '../enumConst';
import { CocosHelper } from '../components/cocosHelper';
const { ccclass, property } = _decorator;

@ccclass('rocketCmpt')
export class planeCmpt extends BaseNodeCmpt {
    onLoad() {
        super.onLoad();
    }

    initData(target = v3(0, 0, 0), special: number = -1, gridPos: Vec2 = null, callback: (gridPos: Vec2, special: number) => Promise<void>) {
        let time = Vec3.distance(this.node.position, target) / 600;
        
        // Create a parallel tween for position and scale
        tween(this.node)
            .parallel(
                tween().to(time, { position: target }),
                tween()
                    .to(time * 0.4, { scale: v3(2, 2, 2) })  // Scale up quickly at start
                    .to(time * 0.6, { scale: v3(1, 1, 1) })        // Return to normal size during flight
            )
            .call(async() => {
                this.node.destroy();
                callback && await callback(gridPos, special);
                // await CocosHelper.delayTime(0.2);
            })
            .start();
    }
}


