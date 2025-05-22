import { _decorator, Component, Node, UITransform, Vec2, Vec3, Camera, Label, isValid, v3, tween, } from 'cc';

// /**
//  * cocos相关方法
//  */
class Helper {
    /** 添加按钮点击事件 */
    addButtonLister(n: Node, event: string, callback: Function, target: any, waitTimeSec = 0, ...args) {
        n.off(event);
        n.on(event, () => {
            if (waitTimeSec) {
                // 防止连点，冷却时间
                let clickTime = n['clickTime'] || new Date().getTime();
                let nowTime = new Date().getTime();
                let offsetTime = (nowTime - clickTime) / 1000;
                if (offsetTime && offsetTime < waitTimeSec) return;
                n.attr({ clickTime: nowTime });
            }
            //需要自定义音效的按钮，末尾加入Audio字符串
            if (n.name.indexOf('Audio') < 0) {
                // App.audio.play(1000002);
            }
            callback.call(target, n, ...args);
        })
    }

    /** 添加输入框回调事件 */
    addEditBoxLister(n: Node, callback: Function, target: any, waitTimeSec = 0, eventName: string = "editing-did-ended", ...args) {
        n.off(eventName);
        n.on(eventName, () => {
            if (waitTimeSec) {
                // 防止连点，冷却时间
                let clickTime = n['clickTime'] || new Date().getTime();
                let nowTime = new Date().getTime();
                let offsetTime = (nowTime - clickTime) / 1000;
                if (offsetTime && offsetTime < waitTimeSec) return;
                n.attr({ clickTime: nowTime });
            }
            callback.call(target, n, ...args);
        })
    }

    /** 动态添加事件 */
    addEventHandler(n: Node, className: string, callFuncName: string, customData = '') {
        let handler = new Component.EventHandler();
        handler.target = n;
        handler.component = className;
        handler.handler = callFuncName;
        handler.customEventData = customData;
        return handler;
    }

    /**
    * 坐标转换
    * @param curNode 当前节点
    * @param targetNode 目标节点
    * @returns
    */
    convertToNodeSpaceAR(curNode: Node, targetNode: Node) {
        return targetNode.getComponent(UITransform).convertToNodeSpaceAR(curNode.parent.getComponent(UITransform).convertToWorldSpaceAR(curNode.getPosition()));
    }

    /**
     * 通过当前坐标转化为目标节点坐标
     * @param nodePos 节点当前坐标
     * @param nodeParent 节点父亲
     * @param targetNode 目标节点
     * @returns
     */
    convertToPosSpaceAR(nodePos: Vec2, nodeParent: Node, targetNode: Node) {
        return targetNode.getComponent(UITransform).convertToNodeSpaceAR(nodeParent.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(nodePos.x, nodePos.y, 0)));
    }

    /** 空间坐标转屏幕坐标
     * 
     */
    wordToScree(camera: Camera, wordPos: Vec3) {
        return camera.worldToScreen(wordPos);
    }

    /**
* 更新label文字
* **/
    updateLabelText(node: Node | Label, strKey: string | number, isI18n = false) {
        if (!isValid(node)) {
            return;
        }
        let label: Label = node instanceof Node ? node.getComponent(Label) : node
        if (!label) {
            return;
        }
        strKey = strKey + "";
        let newText = strKey;
        label.string = newText;
    }

    private index = 0;
    getIndex() {
        this.index++;
        return this.index;
    }



    public bezierTo(target: any, duration: number, c1: Vec3, c2: Vec3, to: Vec3, opts?: any) {
        opts = opts || Object.create(null);
        /*
        * @desc 二阶贝塞尔
        * @param {number} t 当前百分比
        * @param {} p1 起点坐标
        * @param {} cp 控制点
        * @param {} p2 终点坐标
        * @returns {any}
        */
        let twoBezier = (t: number, p1: Vec3, cp: Vec3, p2: Vec3) => {
            let x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;
            let y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
            return v3(x, y, 1);
        };
        opts.onUpdate = (arg: Vec3, ratio: number) => {
            target.position = twoBezier(ratio, c1, c2, to);
        };
        return tween(target).to(duration, {}, opts)
    }

    async delayTime(num: number) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve("");
            }, num * 1000)
        });
    }


}

export let CocosHelper = new Helper();