import { _decorator, input, Input, Vec2, geometry, Camera, PhysicsSystem, EventTouch, v3 } from 'cc';
import { BaseNodeCmpt } from './baseNodeCmpt';
import { eventMgt, EventName } from './eventManager';


const { ccclass, property } = _decorator;
/**
 * 射线碰撞检测
 * Ray collision detection
 */
@ccclass('screenRayCmpt')
export class screenRayCmpt extends BaseNodeCmpt {
    private isCanDo: boolean = true;
    onLoad() {
        super.onLoad();
    }
    start() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    onTouchStart(event: EventTouch) {
        if (!this.isCanDo) {
            this.isCanDo = true;
            return;
        }
        eventMgt.emit(EventName.TouchStart, event.getUILocation());
    }

    onTouchMove(event: EventTouch) {
        if (!this.isCanDo) return;
        eventMgt.emit(EventName.TouchMove, event.getUILocation());
    }


    onTouchEnd(event: EventTouch) {
        this.isCanDo = true;
        eventMgt.emit(EventName.TouchEnd, event.getUILocation());
    }
}