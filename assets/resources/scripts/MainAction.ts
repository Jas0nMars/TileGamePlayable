import { _decorator, Button, Component, instantiate, Label, Node, Prefab, Sprite, tween, UITransform, Vec3 } from 'cc';
import { SceneBase } from './SceneBase';
import { GameState } from './GameState';
import { EditAction } from './EditAction';
import { LayerRootAction } from './LayerRootAction';
import { EventDispatcher } from './EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('MainAction')
export class MainAction extends SceneBase {

    @property({ type:Node })
    eidt_root:Node = null;

    @property({ type:Node })
    lb_cash_num:Node = null;

    @property({ type:Prefab })
    cash_fly:Prefab = null;

    cash_amount:number = 0;
    cash_display:number = 0;
    pending_popup:boolean = false;

    start() {
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
        // 滚动完毕后弹出弹窗
        if( this.pending_popup && this.cash_display == this.cash_amount ){
            this.pending_popup = false;
            this.show_trial_popup();
        }
    }

    update_cash_label(){
        if( !this.lb_cash_num ) return;
        let label = this.lb_cash_num.getComponent(Label);
        if( label ){
            label.string = "rp" + this.format_cash(Math.floor(this.cash_display));
        }
    }

    format_cash(num:number):string{
        let str = num.toString();
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
        if( !this.lb_cash_num || !this.cash_fly ) return;

        let ui_transform = this.node.getComponent(UITransform);
        let target_local = ui_transform.convertToNodeSpaceAR(this.lb_cash_num.getWorldPosition());

        for( let pos of positions ){
            let fly = instantiate(this.cash_fly);
            fly.setParent(this.node);
            let start_local = ui_transform.convertToNodeSpaceAR(pos);
            fly.setPosition(start_local);

            tween(fly)
                .to(0.5, { position: target_local, scale: new Vec3(0.3,0.3,1) })
                .call(()=>{
                    fly.removeFromParent();
                    // 飞到终点后才增加金额，开始数字滚动
                    let add = Math.floor(Math.random() * 20001) + 30000;
                    this.cash_amount += add;
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

}


