import {_decorator, Component, view, Node, Vec3, Animation, Camera, Vec2, View} from 'cc';
import { EventName } from '../components/eventManager';
import { eventMgt } from '../components/eventManager';

const {ccclass, property} = _decorator;

@ccclass('ScreenOrientation')
export class ScreenOrientation extends Component {
    public static _ins: ScreenOrientation;

    public static get instance(): ScreenOrientation {
        return this._ins || new ScreenOrientation;
    }

    onLoad() {
        ScreenOrientation._ins = this;
    }

    @property(Node)
    mainCam: Node = null;

    @property(Node)
    spriteHorizontal: Node = null;

    @property(Node)
    spriteVertical: Node = null;

    @property(Node)
    titleGame: Node = null;

    private currentOrientation: ScreenOrientationType = ScreenOrientationType.Landscape;

    public get CurrentOrientation(): ScreenOrientationType {
        return this.currentOrientation;
    }

    isRotated: boolean = false;

    checkOrientation() {
        const frameSize = view.getFrameSize();
        const newOrientation = frameSize.width > frameSize.height ? ScreenOrientationType.Landscape : ScreenOrientationType.Portrait;

        if (this.currentOrientation !== newOrientation) {
            this.currentOrientation = newOrientation;
            eventMgt.emit(EventName.ScreenOrientationChange, newOrientation);
            // this.mainCam.getComponent(Camera).fovAxis = newOrientation === ScreenOrientationType.Landscape ? Camera.FOVAxis.HORIZONTAL : Camera.FOVAxis.VERTICAL;
            // this.mainCam.getComponent(Camera).fov = 90;
            console.log(frameSize);
            this.setDesignResolution(frameSize.width * 2.5, frameSize.height * 2.5);
        }
    }


    setDesignResolution(width: number, height: number) {
        const policy = view.getResolutionPolicy();
        view.setDesignResolutionSize(width, height, policy);
        console.log(`Design Resolution set to: ${width}x${height}`);
    }

    onEnable() { 
        this.checkOrientation();
        view.on('canvas-resize', this.checkOrientation, this);
    }

    onDisable() {
        view.off('canvas-resize', this.checkOrientation, this);
    }

    update(dt: number) {
        this.checkOrientation();
    }
}

export enum ScreenOrientationType {
    Landscape = "Landscape",
    Portrait = "Portrait"
}
