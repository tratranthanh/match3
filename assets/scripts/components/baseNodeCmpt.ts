import { _decorator, Component, Node, Button, EditBox } from 'cc';
import { CocosHelper } from './cocosHelper';
const { ccclass, property } = _decorator;

/** 点击按钮等待时间 */
/** Button click wait time */
const CLICK_WAIT_TIME = 0;
/**
 * 处理基本节点
 * Handle basic node
 */
@ccclass("baseNodeCmpt")
export class BaseNodeCmpt extends Component {
    // @property({ displayName: '是否遍历所有节点' })
    @property({ displayName: 'Whether to traverse all nodes' })
    protected isSelectNode: boolean = true;

    /** 当前所有的节点 */
    /** Current all nodes */
    protected viewList: Map<string, Node> = new Map<string, Node>();

    /**
     * 组件加载时调用
     * Called when component is loaded
     */
    protected onLoad(): void {
        // 如果需要遍历所有节点，则调用 selectChild 方法
        // If need to traverse all nodes, call selectChild method
        if (this.isSelectNode) {
            this.selectChild(this.node);
        }
        this.addEvent();
    }

    protected addEvent() {

    }

    onDestroy() {
        this.node.destroy();
    }

    /**
     * 根据节点名称获取节点
     * Get node by node name
     * @param name 节点名称 Node name
     * @returns 返回指定名称的节点，如果不存在则返回 null
     * @returns Returns node with specified name, returns null if not found
     */
    protected getNodeByName(name: string): Node | null {
        return this.viewList.get(name) || null;
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
        // App.audio.play('button_click')
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
