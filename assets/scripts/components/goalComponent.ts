import { _decorator, CCInteger, Component, Label, Node } from 'cc';
import { Bomb, Constants } from '../enumConst';
import { EventName } from './eventManager';
import { eventMgt } from './eventManager';

const { ccclass, property } = _decorator;

@ccclass('goalComponent')
export class goalComponent extends Component {
    @property(Label)
    private lb: Label = null;

    @property([CCInteger])
    private type: number = 0;

    private goal: number = 20;

    getGoalType(): number {
        return this.type;
    }

    getGoal(): number {
        return this.goal;
    }

    setGoal(goal: number) {
        this.goal = goal;
        this.lb.string = `${this.goal}`;
    }

    onLoad() {
        this.goal = Constants.GoalCount;
        this.lb.string = `${this.goal}`;
    }

    collect() {
        if (this.goal <= 0) return;
        this.goal--;
        this.lb.string = `${this.goal}`;
        if (this.goal <= 0) {
            eventMgt.emit(EventName.ChangeCarSkin, this.type);
        }
    }
}


