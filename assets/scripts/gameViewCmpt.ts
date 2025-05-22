import { _decorator, Component, Node, Prefab, Label, input, Input } from 'cc';
import { GameBoardManager } from './managers/GameBoardManager';
import { BombManager } from './managers/BombManager';
import { TouchManager } from './managers/TouchManager';
import { GameStateManager } from './managers/GameStateManager';
import { Constants } from './enumConst';
import {gridManagerCmpt} from "db://assets/scripts/gridManagerCmpt";
import {goalComponent} from "db://assets/scripts/components/goalComponent";

const { ccclass, property } = _decorator;

@ccclass('GameViewCmpt')
export class GameViewCmpt extends Component {
    @property(Node)
    gridNode: Node = null!;

    @property(Prefab)
    gridPre: Prefab = null!;

    @property(Node)
    effNode: Node = null!;

    @property(Prefab)
    rocketPre: Prefab = null!;

    @property(Prefab)
    planePre: Prefab = null!;

    @property(Prefab)
    particlePre: Prefab = null!;

    @property(Label)
    lbStep: Label = null!;

    @property(gridManagerCmpt)
    gridManagerCmpt: gridManagerCmpt = null

    @property([goalComponent])
    private goals: goalComponent[] = [];

    private gameBoard: GameBoardManager;
    private bombManager: BombManager;
    public touchManager: TouchManager;
    private gameState: GameStateManager;

    async start() {
        await this.initializeManagers();
        this.setupEventListeners();
    }

    private async initializeManagers() {
        const dimensions = { H: Constants.layCount, V: Constants.layCount };
        await this.gridManagerCmpt.initGrid();
        this.gameBoard = new GameBoardManager(this.gridNode, this.effNode, this.gridPre, this.particlePre, this.goals, dimensions, this);
        this.bombManager = new BombManager(this.effNode, this.rocketPre, this.planePre, this.particlePre, this.gameBoard);
        this.gameState = new GameStateManager(this.lbStep);
        this.touchManager = new TouchManager(this.gameBoard, this.bombManager, this.gameState);
    }

    private setupEventListeners() {
        input.on(Input.EventType.TOUCH_START, this.touchManager.onTouchStart.bind(this.touchManager));
        input.on(Input.EventType.TOUCH_END, this.touchManager.onTouchEnd.bind(this.touchManager));
        input.on(Input.EventType.TOUCH_MOVE, this.touchManager.onTouchMove.bind(this.touchManager));
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START);
        this.node.off(Node.EventType.TOUCH_MOVE);
        this.node.off(Node.EventType.TOUCH_END);
        this.gameBoard.clearData();
    }
}