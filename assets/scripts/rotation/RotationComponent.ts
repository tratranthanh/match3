import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, v3, Vec2, Vec3} from 'cc';
import { EventName } from '../components/eventManager';
import { eventMgt } from '../components/eventManager';
import { ScreenOrientation, ScreenOrientationType } from './ScreenOrientation';
const { ccclass, property } = _decorator;

@ccclass('RotationComponent')
export class RotationComponent extends Component {

    @property(Boolean)
    private positionResponsive: boolean = true;

    @property(Vec3)
    private horPosition: Vec3 = new Vec3(0, 0, 0);

    @property(Vec3)
    private verPosition: Vec3 = new Vec3(0, 0, 0);
    
    @property(Boolean)
    private spriteResponsive: boolean = true;

    @property(SpriteFrame)
    private horSpriteFrame: SpriteFrame = null;

    @property(SpriteFrame)
    private verSpriteFrame: SpriteFrame = null;

    @property(Boolean)
    private transformResponsive: Boolean = false;

    @property(Vec2)
    private horSize: Vec2 = new Vec2(0, 0);

    @property(Vec2)
    private verSize: Vec2 = new Vec2(0, 0);

    @property(Boolean)
    private isScale: Boolean = false;

    @property(Vec2)
    private horScale: Vec2 = new Vec2(0, 0);

    @property(Vec2)
    private verScale: Vec2 = new Vec2(0, 0);
    
    onEnable() {
        this.onScreenOrientationChange(ScreenOrientation._ins.CurrentOrientation);
        eventMgt.on(EventName.ScreenOrientationChange, this.onScreenOrientationChange, this);
    }

    onDisable() {
        eventMgt.off(EventName.ScreenOrientationChange, this);
    }

    onScreenOrientationChange(orientation: ScreenOrientationType) {
        console.log(orientation);
        if (orientation === ScreenOrientationType.Landscape) {
            if (this.positionResponsive) {
                this.node.setPosition(this.horPosition);
            }
            if (this.spriteResponsive) {
                this.node.getComponent(Sprite).spriteFrame = this.horSpriteFrame;
            }
            if (this.transformResponsive) {
                this.node.getComponent(UITransform).setContentSize(this.horSize.x, this.horSize.y);
            }
            if (this.isScale) {
                this.node.scale = v3(this.horScale.x, this.horScale.y, 1);
            }
        } else {
            if (this.positionResponsive) {
                this.node.setPosition(this.verPosition);
            }
            if (this.spriteResponsive) {
                this.node.getComponent(Sprite).spriteFrame = this.verSpriteFrame;
            }
            if (this.transformResponsive) {    
                this.node.getComponent(UITransform).setContentSize(this.verSize.x, this.verSize.y);
            }
            if (this.isScale) {
                this.node.scale = v3(this.verScale.x, this.verScale.y, 1);
            }
        }
    }
}


