import { _decorator, Button, Component, instantiate, Label, Node, Prefab, tween, UITransform, Vec3 } from 'cc';
import { SceneBase } from './SceneBase';
import { GameState } from './GameState';
import { EditAction } from './EditAction';
import { LayerRootAction } from './LayerRootAction';
import { EventDispatcher } from './EventDispatcher';
import { GuideAction } from './GuideAction';
import { I18nManager } from './I18nManager';
import { I18nInit } from './I18nInit';
const { ccclass, property } = _decorator;

// 声明 MRAID 全局变量（试玩广告平台运行时注入）
declare const mraid: { open: () => void } | undefined;

@ccclass('MainAction')
export class MainAction extends SceneBase {

    @property({ type:Node })
    eidt_root:Node = null;

    @property({ type:Node })
    lb_cash_num_portrait:Node = null;

    @property({ type:Node })
    lb_cash_num_landscape:Node = null;

    @property({ type:Node })
    cash_info_portrait:Node = null;

    @property({ type:Node })
    cash_info_landscape:Node = null;

    @property({ type:Prefab })
    cash_fly:Prefab = null;

    @property({ type:Node })
    guide_tips:Node = null;

    @property({ type:Node })
    btn_wd_portrait:Node = null;

    @property({ type:Node })
    btn_wd_landscape:Node = null;

    cash_amount:number = 0;
    cash_display:number = 0;
    pending_popup:boolean = false;
    cash_flying_count:number = 0; // 正在飞行中的现金数量
    is_landscape:boolean = false;

    start() {
        // 最先初始化多语言系统（修改此处切换默认语言）
        I18nInit.init_and_scan('en', this.node);

        this.init_bg_sound();

        if( GameState.game_model==0 ){
            this.eidt_root.active = false;
            GameState.cur_lvl = 1;
            // 试玩广告：直接进入游戏，跳过首页
            this.start_game_direct()

            EventDispatcher.get_target().on(EventDispatcher.REPLAY_GAME,this.replay_game,this)
            EventDispatcher.get_target().on(EventDispatcher.CASH_ELIMINATED,this.on_cash_eliminated,this)

            // 初始化现金显示
            this.cash_amount = 0;
            this.cash_display = 0;
            this.cash_flying_count = 0;
            this.pending_popup = false;
            this.update_cash_label();
        }else{
            this.eidt_root.active = true;
            this.eidt_root.getChildByName("edit").getComponent(EditAction).start_grid()
        }

    }

    update(deltaTime: number) {
        // 现金滚动动画
        if( Math.abs(this.cash_display - this.cash_amount) > 0.5 ){
            this.cash_display += (this.cash_amount - this.cash_display) * 5 * deltaTime;
            this.update_cash_label();
        }else if( this.cash_display != this.cash_amount ){
            this.cash_display = this.cash_amount;
            this.update_cash_label();
        }
        // 等所有现金飞到且滚动完毕后，再弹出弹窗
        if( this.pending_popup && this.cash_flying_count == 0 && this.cash_display == this.cash_amount ){
            this.pending_popup = false;
            this.show_trial_popup();
        }
    }

    /** 获取当前方向下活跃的现金标签节点 */
    get_active_cash_label():Node {
        return this.is_landscape ? this.lb_cash_num_landscape : this.lb_cash_num_portrait;
    }

    /** 横竖屏切换时由 ScreenLayoutManager 调用 */
    set_orientation(is_landscape:boolean) {
        this.is_landscape = is_landscape;
        // 切换 cash_info 横竖屏子节点
        if( this.cash_info_portrait ) this.cash_info_portrait.active = !is_landscape;
        if( this.cash_info_landscape ) this.cash_info_landscape.active = is_landscape;
        // 切换 lb_cash_num 横竖屏节点
        if( this.lb_cash_num_portrait ) this.lb_cash_num_portrait.active = !is_landscape;
        if( this.lb_cash_num_landscape ) this.lb_cash_num_landscape.active = is_landscape;
        // 切换 btn_wd 横竖屏节点
        if( this.btn_wd_portrait ) this.btn_wd_portrait.active = !is_landscape;
        if( this.btn_wd_landscape ) this.btn_wd_landscape.active = is_landscape;
        // 通知引导组件重新定位高亮 block
        if( this.guide_tips ){
            let guide = this.guide_tips.getComponent(GuideAction);
            if( guide ){
                guide.on_orientation_change();
            }
        }
    }

    update_cash_label(){
        let symbol = this.get_currency_symbol();
        let str = symbol + this.format_cash(Math.floor(this.cash_display));
        // 同时更新横竖屏两个标签
        if( this.lb_cash_num_portrait ){
            let label = this.lb_cash_num_portrait.getComponent(Label);
            if( label ) label.string = str;
        }
        if( this.lb_cash_num_landscape ){
            let label = this.lb_cash_num_landscape.getComponent(Label);
            if( label ) label.string = str;
        }
    }

    /** 根据当前语言获取货币符号 */
    get_currency_symbol():string {
        let lang = I18nManager.current_language;
        if( lang === 'id' ) return 'Rp';
        if( lang === 'pt-BR' ) return 'R$';
        return '$';
    }

    /** 根据当前语言获取随机奖励金额 */
    get_random_reward():number {
        let lang = I18nManager.current_language;
        if( lang === 'id' ) return Math.floor(Math.random() * 20001) + 30000; // 30000~50000
        if( lang === 'pt-BR' ) return Math.floor(Math.random() * 301) + 500; // 500~800
        return Math.floor(Math.random() * 101) + 100; // 100~200
    }

    format_cash(num:number):string{
        let str = Math.floor(num).toString();
        let lang = I18nManager.current_language;
        // 印尼和巴西省略千位分隔符（避免与小数点混淆），英语用 ,
        if( lang === 'id' || lang === 'pt-BR' ) return str;
        let result = '';
        let count = 0;
        for( let i = str.length - 1; i >= 0; i-- ){
            if( count > 0 && count % 3 == 0 ){
                result = ',' + result;
            }
            result = str[i] + result;
            count++;
        }
        return result;
    }

    on_cash_eliminated(positions:Vec3[]){
        let active_cash = this.get_active_cash_label();
        if( !active_cash || !this.cash_fly ) return;

        let ui_transform = this.node.getComponent(UITransform);
        let target_local = ui_transform.convertToNodeSpaceAR(active_cash.getWorldPosition());

        // 每次消除只给一次奖励，平均分给飞行的现金
        let total_reward = this.get_random_reward();
        let reward_per_fly = Math.floor(total_reward / positions.length);

        for( let i = 0; i < positions.length; i++ ){
            let pos = positions[i];
            // 飞到计数器的现金
            let fly = instantiate(this.cash_fly);
            fly.setParent(this.node);
            let start_local = ui_transform.convertToNodeSpaceAR(pos);
            fly.setPosition(start_local);
            this.cash_flying_count++;

            // 最后一张钞票补上取整差额
            let reward = (i == positions.length - 1) ? (total_reward - reward_per_fly * i) : reward_per_fly;

            tween(fly)
                .to(0.5, { position: target_local, scale: new Vec3(0.3,0.3,1) })
                .call(()=>{
                    fly.removeFromParent();
                    this.cash_amount += reward;
                    this.cash_flying_count--;
                })
                .start();
        }
    }

    replay_game(){
        GameState.cur_lvl = 1;
        this.start_game_direct()
    }

    /**
     * 试玩广告：直接进入游戏（无羊驼动画）
     */
    start_game_direct(){
        GameState.reset_ad_times();
        let layer_root = this.node.getChildByName("layer_root").getComponent(LayerRootAction)
        layer_root.start_game()

        // 第一关显示新手引导，延迟等待方块入场动画完成
        if( GameState.cur_lvl == 1 && this.guide_tips ){
            this.scheduleOnce(()=>{
                this.show_guide();
            }, 0.5);
        }
    }

    show_guide(){
        let layer_root = this.node.getChildByName("layer_root").getComponent(LayerRootAction);
        let layer1 = layer_root.layer_1_action;
        if( !layer1 ) return;
        let children = layer1.get_children();
        if( children.length == 0 ) return;
        // 第一个子节点即左上角的 block
        let first_block = children[0];
        let guide = this.guide_tips.getComponent(GuideAction);
        if( guide ){
            guide.show_guide(first_block, layer_root);
        }
    }

    hide_guide(){
        if( this.guide_tips ){
            let guide = this.guide_tips.getComponent(GuideAction);
            if( guide ) guide.hide_guide();
        }
    }

    /**
     * 下一关（试玩广告模式下等待滚动完成后弹出完成弹窗）
     */
    next_game(){
        this.pending_popup = true;
    }

    show_trial_popup(){
        let popup = this.node.getChildByName("trial_complete_popup");
        if( popup ){
            popup.active = true;
            console.log("[TrialComplete] 弹窗已显示");
        }else{
            console.warn("[TrialComplete] 未找到 trial_complete_popup 节点");
        }
    }

    /**
     * BtnWd 点击事件：调用 mraid.open() 跳转应用商店
     */
    click_btn_wd(){
        if (typeof mraid !== 'undefined' && mraid.open) {
            mraid.open();
        }
    }

}


