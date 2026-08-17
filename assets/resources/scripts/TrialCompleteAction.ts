import { _decorator, AudioClip, AudioSource, Component, Label, Node, Sprite, SpriteFrame, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { MainAction } from './MainAction';
import { SDKManager } from './SDKManager';
const { ccclass, property } = _decorator;

/**
 * 试玩广告完成弹窗
 * 第一关通过后由 MainAction 直接激活显示
 * 预留接口供外部调用
 */
@ccclass('TrialCompleteAction')
export class TrialCompleteAction extends Component {

    @property({ type:Node })
    mask:Node = null;           // 遮罩背景

    @property({ type:Node })
    board:Node = null;          // 弹窗底板

    @property({ type:Node })
    win_1:Node = null;          // 胜利图标1

    @property({ type:Node })
    win_2:Node = null;          // 胜利图标2

    @property({ type:Node })
    cash_board:Node = null;     // 现金展示区

    @property({ type:Node })
    cash_btn:Node = null;       // 现金按钮

    @property({ type:Node })
    lb_cash_num:Node = null;

    @property({ type:Node })
    img_glow:Node = null;

    @property({ type:[SpriteFrame] })
    cash_frames:SpriteFrame[] = [];

    @property({ type:Node })
    spray_origin:Node = null;   // 喷射起点节点

    @property({ type:AudioClip })
    reward_clip:AudioClip = null; // reward 音效

    private _breathing_tween_1: any = null;
    private _breathing_tween_2: any = null;
    private _audio_source: AudioSource = null;

    onEnable() {
        // 同步 MainAction 中的现金数值
        this.sync_cash();
        // 播放 reward 音效
        this.play_reward_sound();
        // 播放入场动画序列
        this.play_entrance_animation();
    }

    onDisable() {
        this.unschedule(this.play_cash_spray);
        this.stop_breathing();
    }

    /** 播放 reward 音效 */
    play_reward_sound() {
        if( !this.reward_clip ) return;
        if( !this._audio_source ) {
            this._audio_source = this.node.getComponent(AudioSource);
            if( !this._audio_source ) {
                this._audio_source = this.node.addComponent(AudioSource);
            }
        }
        this._audio_source.playOneShot(this.reward_clip);
    }

    /** 同步现金数值 */
    sync_cash() {
        if( !this.lb_cash_num ) return;
        let main = this.node.parent.getComponent(MainAction);
        if( !main ) return;
        let src_label = main.get_active_cash_label()?.getComponent(Label);
        if( !src_label ) return;
        let label = this.lb_cash_num.getComponent(Label);
        if( label ) label.string = src_label.string;
    }

    /** 启动光晕旋转动画 */
    start_glow_rotate() {
        if( !this.img_glow ) return;
        this.img_glow.angle = 0;
        tween(this.img_glow)
            .by(6, { angle: -360 })
            .union()
            .repeatForever()
            .start();
    }

    // ==================== 入场动画序列 ====================

    /** 播放完整的入场动画序列 */
    play_entrance_animation() {
        // 先隐藏所有节点，设置初始状态
        this._set_node_hidden(this.mask);
        this._set_node_hidden(this.board);
        this._set_node_hidden(this.win_1);
        this._set_node_hidden(this.win_2);
        this._set_node_hidden(this.cash_board);
        this._set_node_hidden(this.cash_btn);
        // img_glow 初始隐藏（保持原缩放，只隐藏透明度）
        if( this.img_glow ){
            let opacity = this.img_glow.getComponent(UIOpacity);
            if( !opacity ) opacity = this.img_glow.addComponent(UIOpacity);
            opacity.opacity = 0;
        }

        // 停止之前的呼吸动画
        this.stop_breathing();

        // 序列：mask → board → win_1 → win_2 → (呼吸) → cash_board → cash_btn → 喷钱
        let delay = 0;

        // 1. mask 淡入
        delay += this._fade_in(this.mask, delay, 0.15);

        // 2. board 缩放弹出
        delay += this._pop_in(this.board, delay, 0.2);

        // 2.5 flow(img_glow) 渐显
        delay += this._fade_in(this.img_glow, delay, 0.2);

        // 2.6 flow 渐显完成后开始旋转
        this.scheduleOnce(() => {
            this.start_glow_rotate();
        }, delay);

        // 3. win_1 弹出
        delay += this._pop_in(this.win_1, delay, 0.15);

        // 4. win_2 弹出
        delay += this._pop_in(this.win_2, delay, 0.15);

        // 5. win_1 和 win_2 开始交叉呼吸缩放
        this.scheduleOnce(() => {
            this.start_breathing();
        }, delay);

        // 6. cash_board 弹出（稍等呼吸动画开始）
        delay += 0.15;
        delay += this._pop_in(this.cash_board, delay, 0.15);

        // 7. cash_btn 弹出
        delay += this._pop_in(this.cash_btn, delay, 0.12);

        // 8. 开始喷钱
        this.scheduleOnce(() => {
            this.play_cash_spray();
            this.schedule(this.play_cash_spray, 0.25);
        }, delay);

        // 9. 所有动画播放完毕后调用 gameEnd
        this.scheduleOnce(() => {
            this.gameEnd();
        }, delay + 2);
    }

    /** 设置节点为隐藏状态（scale=0, opacity=0） */
    _set_node_hidden(node: Node) {
        if( !node ) return;
        node.setScale(0, 0, 1);
        let opacity = node.getComponent(UIOpacity);
        if( !opacity ) opacity = node.addComponent(UIOpacity);
        opacity.opacity = 0;
    }

    /**
     * 淡入动画
     * @returns 动画持续时间
     */
    _fade_in(node: Node, delay: number, duration: number): number {
        if( !node ) return duration;
        let opacity = node.getComponent(UIOpacity);
        if( !opacity ) opacity = node.addComponent(UIOpacity);
        opacity.opacity = 0;

        tween(opacity)
            .delay(delay)
            .to(duration, { opacity: 255 })
            .start();
        // 淡入时保持 scale=1
        node.setScale(1, 1, 1);
        return duration;
    }

    /**
     * 弹出动画（scale 0→1，带回弹效果）
     * @returns 动画持续时间
     */
    _pop_in(node: Node, delay: number, duration: number): number {
        if( !node ) return duration;
        node.setScale(0, 0, 1);

        tween(node)
            .delay(delay)
            .to(duration, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
        // 弹出时 opacity 设为 255
        let opacity = node.getComponent(UIOpacity);
        if( !opacity ) opacity = node.addComponent(UIOpacity);
        opacity.opacity = 255;

        return duration;
    }

    // ==================== 呼吸缩放动画 ====================

    /** 启动 win_1 和 win_2 的交叉呼吸缩放 */
    start_breathing() {
        if( !this.win_1 || !this.win_2 ) return;

        // win_1: 1.0 → 1.15 → 1.0（循环）
        this._breathing_tween_1 = tween(this.win_1)
            .to(0.6, { scale: new Vec3(1.15, 1.15, 1) }, { easing: 'sineInOut' })
            .to(0.6, { scale: new Vec3(1.0, 1.0, 1) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();

        // win_2: 与 win_1 反相（先缩小再放大）
        this.win_2.setScale(1.15, 1.15, 1);
        this._breathing_tween_2 = tween(this.win_2)
            .to(0.6, { scale: new Vec3(1.0, 1.0, 1) }, { easing: 'sineInOut' })
            .to(0.6, { scale: new Vec3(1.15, 1.15, 1) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    /** 停止呼吸动画 */
    stop_breathing() {
        if( this._breathing_tween_1 ) {
            this._breathing_tween_1.stop();
            this._breathing_tween_1 = null;
        }
        if( this._breathing_tween_2 ) {
            this._breathing_tween_2.stop();
            this._breathing_tween_2 = null;
        }
        // 恢复默认缩放
        if( this.win_1 ) this.win_1.setScale(1, 1, 1);
        if( this.win_2 ) this.win_2.setScale(1, 1, 1);
    }

    // ==================== 喷现金动画 ====================

    /** 喷现金效果：从 spray_origin 位置喷出多张钞票 */
    play_cash_spray() {
        if( this.cash_frames.length == 0 ) return;

        // 钞票生成在 spray_origin 下（继承其层级），否则生成在 this.node 下
        let parent_node = this.spray_origin || this.node;
        let parent_ui = parent_node.getComponent(UITransform);
        if( !parent_ui ) return;

        // 喷射起点在父节点局部坐标的原点
        let origin = new Vec3(0, 0, 0);

        // 下落到屏幕底部 + 100像素
        let screen_bottom_world = new Vec3(0, -880, 0);
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

            // 随机方向：向上喷射，小角度扇形散开
            let angle = 90 + (Math.random() - 0.5) * 70;
            let speed = 500 + Math.random() * 300;
            let rad = angle * Math.PI / 180;
            let vx = Math.cos(rad) * speed;
            let vy = Math.sin(rad) * speed;

            // 两阶段动画：先上升减速，再下落加速
            let gravity = 1200;
            let t_up = vy / gravity;
            let peak_y = origin.y + vy * t_up - 0.5 * gravity * t_up * t_up;
            let total_duration = 1.2 + Math.random() * 0.6;
            let t_down = total_duration - t_up;
            let final_x = origin.x + vx * total_duration;
            let rot_delta = (Math.random() - 0.5) * 360;
            let total_rot = cash.angle + rot_delta;
            let up_ratio = t_up / total_duration;

            let sqrt_23 = Math.sqrt(2/3);
            let t_down_1 = t_down * sqrt_23;
            let t_down_2 = t_down * (1 - sqrt_23);
            let mid_y = peak_y + (final_y - peak_y) * (2/3);
            let mid_x = (origin.x + vx * t_up) + (final_x - (origin.x + vx * t_up)) * (2/3);
            let mid_rot = (cash.angle + total_rot * up_ratio) + (total_rot - (cash.angle + total_rot * up_ratio)) * (2/3);

            tween(cash)
                .to(t_up, {
                    position: new Vec3(origin.x + vx * t_up, peak_y, 0),
                    angle: cash.angle + total_rot * up_ratio
                }, {
                    easing: 'quadOut',
                    onUpdate: (target, ratio) => {
                        ui_opacity.opacity = 255;
                    }
                })
                .to(t_down_1, {
                    position: new Vec3(mid_x, mid_y, 0),
                    angle: mid_rot
                }, {
                    easing: 'quadIn',
                    onUpdate: (target, ratio) => {
                        ui_opacity.opacity = 255;
                    }
                })
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
     */
    click_replay() {
        console.log("[TrialComplete clickrelay] 点击再玩一次");
        SDKManager.instance?.triggerDownload();
    }

    /**
     * 点击“关闭”按钮 / CTA 下载按钮
     */
    click_close() {
        console.log("[TrialComplete] 点击关闭/CTA");
        SDKManager.instance?.triggerDownload();
    }

    gameEnd() {
        SDKManager.instance?.gameEnd();
    }
}
