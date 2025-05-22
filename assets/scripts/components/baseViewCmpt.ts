import { _decorator, Node, Enum, v3, tween, Widget, Sprite, BlockInputEvents, Color, UITransform, EventTouch, Material, Component, Button, TweenAction, easing, EditBox, Layers, director, view, } from 'cc';
import { CocosHelper } from './cocosHelper';
import { eventMgt } from './eventManager';
const { ccclass, property } = _decorator;

/** 点击按钮等待时间 */
/** Button click wait time */
const CLICK_WAIT_TIME = 0;
/**
 * 处理基本窗口
 * Handle basic window
 */
@ccclass("baseViewCmpt")
export class BaseViewCmpt extends Component {
    // @property({ displayName: '是否遍历所有节点' })
    @property({ displayName: 'Whether to traverse all nodes' })
    protected isSelectNode: boolean = true;

    /** 当前所有的节点 */
    /** Current all nodes */
    protected viewList: Map<string, Node> = new Map<string, Node>();

    // @property({ displayName: '是否添加全屏Widget' })
    @property({ displayName: 'Whether to add full screen Widget' })
    protected isAddFullWidget = false;

    // @property({ displayName: '是否遮罩' })
    @property({ displayName: 'Whether to add mask' })
    protected isMask = false;

    // @property({ displayName: '点击空白地方是否关闭窗口' })
    @property({ displayName: 'Whether to close window when clicking empty space' })
    protected isTouchSpaceClose = false;

    // @property({ displayName: '是否播放打开界面动画,animNode为播放动画的节点' })
    @property({ displayName: 'Whether to play open animation, animNode is the node that plays the animation' })
    protected isPlayOpenAnim = false;

    // @property({ displayName: '是否截屏模糊背景' })
    @property({ displayName: 'Whether to blur background with screenshot' })
    protected isScreeShoot = false;

    private maskPanel: Node;
    private closeCallBack: Function;
    protected extraData: any;

    /** 是否在小游戏中 */
    /** Whether in mini game */
    protected isInGame: boolean = false;

    protected onLoad() {
        // 如果需要遍历所有节点，则调用 selectChild 方法
        // If need to traverse all nodes, call selectChild method
        if (this.isSelectNode) {
            this.selectChild(this.node);
        }

        if (this.isPlayOpenAnim) {
            this.openAnim();
        }
        this.addEvents();
        if (this.isAddFullWidget) {
            // 适配
            // Adaptation
            let widget = this.node.addComponent(Widget);
            widget.isAlignTop = true;
            widget.top = 0;
            widget.isAlignBottom = true;
            widget.bottom = 0;
            widget.isAlignLeft = true;
            widget.left = 0;
            widget.isAlignRight = true;
            widget.right = 0;
        }

        if (this.isMask) {
            // 添加遮罩
            // Add mask
            this.addMask();
        }

        if (this.isTouchSpaceClose) {
            this.addSpaceEvent();
        }

        if (this.isScreeShoot) {
            this.screeShot();
        }
    }

    /** 加载额外的数据 */
    /** Load extra data */
    loadExtraData(...args) {
        this.extraData = args
    }

    protected addEvents() {
    }

    /** 设置屏蔽层显示 */
    /** Set mask visibility */
    protected setMaskVis(visible: boolean) {
        if (!this.maskPanel) return
        this.maskPanel.active = visible;
    }

    /** 取消屏蔽事件 */
    /** Cancel block input */
    cancelBlockInput() {
        if (!this.maskPanel) return
        this.maskPanel.getComponent(BlockInputEvents)
            && this.maskPanel.removeComponent(BlockInputEvents);
    }

    /** 设置关闭回调 */
    /** Set close callback */
    setCloseFunc(callback: Function) {
        this.closeCallBack = callback;
    }

    onClose() {
        this.closeCallBack && this.closeCallBack.bind(this)(this);
        if (this.node) {
            this.node.removeFromParent();
            this.destroy();
        }
    }

    /** 添加空白点击事件 */
    /** Add empty space click event */
    protected addSpaceEvent() {
        let maskNode = new Node();
        maskNode.layer = Layers.Enum.UI_2D
        maskNode.addComponent(UITransform);
        let trans = maskNode.getComponent(UITransform);

        trans.setContentSize(view.getVisibleSize());
        this.node.addChild(maskNode);
        maskNode.setSiblingIndex(-1);

        maskNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.target == maskNode && this.onTouchSpace();
        })
    }

    /** 点击空白地方 */
    /** Click empty space */
    protected onTouchSpace() {
        this.onClick_closeBtn();
    }

    /** 默认关闭按钮 */
    /** Default close button */
    protected onClick_closeBtn() {
        this.onClose();
    }

    protected onDestroy() {
        eventMgt.offAll(this);
    }

    protected openAnim(cb?: Function) {
        let animNode = this.viewList.get('animNode')
        if (animNode) {
            animNode.scale = v3(0, 0, 0)
            tween(animNode).to(0.2, { scale: v3(1, 1, 1) }, { easing: easing.backOut }).call(() => { cb && cb() }).start();
            // const scaleTo = scaleTo(0.2, 1).easing(easeBackOut());
            // tween(animNode).then(scaleTo).call(() => { cb && cb() }).start();
        }
    }

    /** 截屏模糊遮罩 */
    /** Screenshot blur mask */
    protected async screeShot() {
    }

    addMask() {
    }

    /**
     * 遍历所有子节点，将节点存储到 viewList 中
     * Traverse all child nodes, store nodes in viewList
     * @param node 当前节点 Current node
     * @param pName 当前节点的路径 Current node path
     */
    private selectChild(node: Node, pName = '') {
        // 使用一个栈来遍历所有节点，避免递归调用带来的性能问题。
        // Use a stack to traverse all nodes, avoiding performance issues from recursive calls.
        const stack: [Node, string][] = [[node, pName]];
        while (stack.length > 0) {
            const [curNode, curPath] = stack.pop()!;
            // 将节点存储到 viewList 中，以当前节点的路径作为键
            // Store node in viewList, using current node path as key
            this.viewList.set(curPath, curNode);
            // 绑定按钮事件
            // Bind button events
            this._bingButton(curNode);
            // 绑定输入框事件
            // Bind input box events
            this._bingEditBox(curNode);

            const children = curNode.children;
            // 遍历当前节点的所有子节点，并将其添加到栈中
            // Traverse all child nodes of current node and add them to stack
            for (let i = children.length - 1; i >= 0; i--) {
                const childNode = children[i];
                const childPath = curPath ? `${curPath}/${childNode.name}` : childNode.name;
                // 将子节点添加到栈中
                // Add child node to stack
                stack.push([childNode, childPath]);
            }
        }
    }

    /**
     * 为按钮绑定事件
     * Bind events for button
     * @param node 节点 Node
     * @returns 
     */
    private _bingButton(node: Node) {
        if (!node.getComponent(Button)) return
        let btn = node.getComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.95;
        if (this['onClick_' + node.name + "_Start"]) {
            CocosHelper.addButtonLister(node, Node.EventType.TOUCH_START, this['onClick_' + node.name + "_Start"].bind(this, node), this, CLICK_WAIT_TIME);
        }
        if (this['onClick_' + node.name + "_End"]) {
            CocosHelper.addButtonLister(node, Node.EventType.TOUCH_END, this['onClick_' + node.name + "_End"].bind(this, node), this, CLICK_WAIT_TIME);
        }
        if (this['onClick_' + node.name]) {
            CocosHelper.addButtonLister(node, Node.EventType.TOUCH_END, this['onClick_' + node.name].bind(this, node), this, CLICK_WAIT_TIME);
        }
    }

    /**
     * 为输入框绑定回调事件
     * Bind callback events for input box
     * @param node 节点 Node
     * @returns 
     */
    private _bingEditBox(node: Node) {
        if (!node.getComponent(EditBox)) return

        if (this['onEditEnd_' + node.name]) {
            CocosHelper.addEditBoxLister(node, this['onEditEnd_' + node.name].bind(this, node.getComponent(EditBox)), this, CLICK_WAIT_TIME, "editing-did-ended");
        }
        if (this['onEditChange_' + node.name]) {
            CocosHelper.addEditBoxLister(node, this['onEditChange_' + node.name].bind(this, node.getComponent(EditBox)), this, CLICK_WAIT_TIME, "text-changed");
        }
    }
}

