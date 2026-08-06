import { _decorator, Button, Component, Node, Sprite } from 'cc';
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

    @property({ type:Button })
    btn_redo:Button = null;

    @property({ type:Button })
    btn_remove:Button = null;

    @property({ type:Button })
    btn_random:Button = null;

    @property({ type:Node })
    sheeps_node:Node = null;

    start() {
        this.init_bg_sound();

        if( GameState.game_model==0 ){
            this.eidt_root.active = false;
            GameState.cur_lvl = 1;
            // 试玩广告：直接进入游戏，跳过首页
            this.start_game_direct()

            EventDispatcher.get_target().on(EventDispatcher.REPLAY_GAME,this.replay_game,this)
            EventDispatcher.get_target().on(EventDispatcher.REFRESH_BUTTONS,this.refresh_buttons,this)
        }else{
            this.sheeps_node.active = false;
            this.eidt_root.active = true;
            this.eidt_root.getChildByName("edit").getComponent(EditAction).start_grid()
        }

    }

    update(deltaTime: number) {
        
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
     * 下一关（试玩广告模式下弹出完成弹窗）
     */
    next_game(){
        // 试玩广告模式下，第一关通过后弹出完成弹窗
        // 直接查找弹窗节点并激活，不依赖弹窗自身生命周期
        let popup = this.node.getChildByName("trial_complete_popup");
        if( popup ){
            popup.active = true;
            console.log("[TrialComplete] 弹窗已显示");
        }else{
            console.warn("[TrialComplete] 未找到 trial_complete_popup 节点");
        }
    }

}


