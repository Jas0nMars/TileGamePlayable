import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 试玩广告完成弹窗
 * 第一关通过后由 MainAction 直接激活显示
 * 预留接口供外部调用
 */
@ccclass('TrialCompleteAction')
export class TrialCompleteAction extends Component {

    /**
     * 点击"再玩一次"按钮
     * 预留接口：可对接广告跳转、下载链接等
     */
    click_replay() {
        this.node.active = false;
        // TODO: 对接试玩广告结束后的跳转逻辑
        // 例如：跳转下载页、调用 JSB 接口等
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
