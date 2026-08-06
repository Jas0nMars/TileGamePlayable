import { _decorator, Component, Label, Node, tween } from 'cc';
import { MainAction } from './MainAction';
const { ccclass, property } = _decorator;

/**
 * 试玩广告完成弹窗
 * 第一关通过后由 MainAction 直接激活显示
 * 预留接口供外部调用
 */
@ccclass('TrialCompleteAction')
export class TrialCompleteAction extends Component {

    @property({ type:Node })
    lb_cash_num:Node = null;

    @property({ type:Node })
    img_glow:Node = null;

    onEnable() {
        // 同步 MainAction 中的现金数值
        this.sync_cash();
        // 启动光晕旋转动画
        this.start_glow_rotate();
    }

    sync_cash() {
        if( !this.lb_cash_num ) return;
        let main = this.node.parent.getComponent(MainAction);
        if( !main ) return;
        let label = this.lb_cash_num.getComponent(Label);
        if( label ){
            label.string = main.lb_cash_num.getComponent(Label).string;
        }
    }

    start_glow_rotate() {
        if( !this.img_glow ) return;
        this.img_glow.angle = 0;
        tween(this.img_glow)
            .by(6, { angle: -360 })
            .union()
            .repeatForever()
            .start();
    }

    /**
     * 点击"再玩一次"按钮
     * 预留接口：可对接广告跳转、下载链接等
     */
    click_replay() {
        this.node.active = false;
        // TODO: 对接试玩广告结束后的跳转逻辑
        console.log("[TrialComplete] 点击再玩一次，预留接口调用");
    }

    /**
     * 点击"关闭"按钮
     */
    click_close() {
        this.node.active = false;
        // TODO: 对接试玩广告关闭逻辑
        console.log("[TrialComplete] 点击关闭，预留接口调用");
    }
}
