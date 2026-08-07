import { _decorator, Component, Label, Node, Sprite, SpriteFrame, tween, UIOpacity, UITransform, Vec3 } from 'cc';
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

    @property({ type:[SpriteFrame] })
    cash_frames:SpriteFrame[] = [];

    @property({ type:Node })
    spray_origin:Node = null; // 喷射起点节点（编辑器拖放控制位置和层级）

    onEnable() {
        // 同步 MainAction 中的现金数值
        this.sync_cash();
        // 启动光晕旋转动画
        this.start_glow_rotate();
        // 持续喷射现金（类似粒子效果）
        this.play_cash_spray();
        this.schedule(this.play_cash_spray, 0.25);
    }

    onDisable() {
        this.unschedule(this.play_cash_spray);
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

    /** 喷现金效果：从 spray_origin 位置喷出多张钞票 */
    play_cash_spray() {
        if( this.cash_frames.length == 0 ) return;

        // 钞票生成在 spray_origin 下（继承其层级），否则生成在 this.node 下
        let parent_node = this.spray_origin || this.node;
        let parent_ui = parent_node.getComponent(UITransform);
        if( !parent_ui ) return;

        // 喷射起点在父节点局部坐标的原点
        let origin = new Vec3(0, 0, 0);

        // 下落到屏幕底部 + 100像素（设计分辨率 750x1560，底部 y = -780 - 100 = -880）
        let screen_bottom_world = new Vec3(0, -880, 0);
        // 假设父节点的父级有 UITransform（如 Canvas），将屏幕底部转为世界坐标
        let grandparent_ui = parent_node.parent?.getComponent(UITransform);
        if( grandparent_ui ){
            screen_bottom_world = grandparent_ui.convertToWorldSpaceAR(new Vec3(0, -780, 0));
        }
        let final_y = parent_ui.convertToNodeSpaceAR(screen_bottom_world).y;

        let count = 5 + Math.floor(Math.random() * 3); // 每次喷出 5~7 张

        for( let i = 0; i < count; i++ ){
            let cash = new Node("cash_spray");
            cash.setParent(parent_node);
            cash.setPosition(origin);

            let sp = cash.addComponent(Sprite);
            sp.spriteFrame = this.cash_frames[Math.floor(Math.random() * this.cash_frames.length)];

            let ui_opacity = cash.addComponent(UIOpacity);
            ui_opacity.opacity = 255;

            // 随机大小 0.6~1.4
            let s = 0.6 + Math.random() * 0.8;
            cash.setScale(s, s, 1);

            // 随机旋转
            cash.angle = Math.random() * 360;

            // 随机方向：向上喷射，小角度扇形散开（CC 3.x Y轴向上，90°为正上方）
            let angle = 90 + (Math.random() - 0.5) * 70; // 55° ~ 125°，更宽的向上锥形
            let speed = 500 + Math.random() * 300;
            let rad = angle * Math.PI / 180;
            let vx = Math.cos(rad) * speed;
            let vy = Math.sin(rad) * speed; // 正值，向上

            // 两阶段动画：先上升减速，再下落加速（模拟真实抛物线）
            // CC 3.x Y轴向上，重力方向为负，公式：y = vy*t - 0.5*g*t²
            let gravity = 1200;
            let t_up = vy / gravity; // 到达顶点时间
            let peak_y = origin.y + vy * t_up - 0.5 * gravity * t_up * t_up; // 顶点 y
            let total_duration = 1.2 + Math.random() * 0.6;
            let t_down = total_duration - t_up; // 下落时间
            // 下落到屏幕底部 + 100px
            let final_x = origin.x + vx * total_duration;
            let rot_delta = (Math.random() - 0.5) * 360;
            let total_rot = cash.angle + rot_delta;
            let up_ratio = t_up / total_duration;

            // 下落 2/3 距离的时间点（quadIn: distance_ratio = time_ratio²）
            // 2/3 距离对应 time_ratio = sqrt(2/3)
            let sqrt_23 = Math.sqrt(2/3);
            let t_down_1 = t_down * sqrt_23; // 下落前 2/3 距离
            let t_down_2 = t_down * (1 - sqrt_23); // 下落后 1/3 距离
            // 2/3 距离处的中间位置
            let mid_y = peak_y + (final_y - peak_y) * (2/3);
            let mid_x = (origin.x + vx * t_up) + (final_x - (origin.x + vx * t_up)) * (2/3);
            let mid_rot = (cash.angle + total_rot * up_ratio) + (total_rot - (cash.angle + total_rot * up_ratio)) * (2/3);

            tween(cash)
                // 阶段1：上升到顶点
                .to(t_up, {
                    position: new Vec3(origin.x + vx * t_up, peak_y, 0),
                    angle: cash.angle + total_rot * up_ratio
                }, {
                    easing: 'quadOut',
                    onUpdate: (target, ratio) => {
                        ui_opacity.opacity = 255;
                    }
                })
                // 阶段2a：下落前 2/3 距离（quadIn 从静止加速，不渐隐）
                .to(t_down_1, {
                    position: new Vec3(mid_x, mid_y, 0),
                    angle: mid_rot
                }, {
                    easing: 'quadIn',
                    onUpdate: (target, ratio) => {
                        ui_opacity.opacity = 255;
                    }
                })
                // 阶段2b：下落后 1/3（渐隐到 0）
                .to(t_down_2, {
                    position: new Vec3(final_x, final_y, 0),
                    angle: total_rot
                }, {
                    easing: 'linear',
                    onUpdate: (target, ratio) => {
                        ui_opacity.opacity = Math.floor(255 * (1 - ratio));
                    }
                })
                .call(()=>{ cash.removeFromParent(); })
                .start();
        }
    }

    /**
     * 点击"再玩一次"按钮
     * 预留接口：可对接广告跳转、下载链接等
     */
    click_replay() {
        // this.node.active = false;
        // TODO: 对接试玩广告结束后的跳转逻辑
        console.log("[TrialComplete] 点击再玩一次，预留接口调用");
    }

    /**
     * 点击"关闭"按钮
     */
    click_close() {
        // this.node.active = false;
        // TODO: 对接试玩广告关闭逻辑
        console.log("[TrialComplete] 点击关闭，预留接口调用");
    }
}
