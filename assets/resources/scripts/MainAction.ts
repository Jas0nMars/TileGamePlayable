import { _decorator, Button, Component, director, Node, Sprite, tween, Vec3 } from 'cc';
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
            this.start_game()

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

    click_back(){
        this.stop_bg_sound();
        
        director.loadScene("home")
    }

    replay_game(){
        GameState.cur_lvl = 1;
        this.start_game()
    }

    private sheeps_tween(callback:Function){
        this.sheeps_node.active = true;
        this.sheeps_node.setPosition(350,0)
        this.sheeps_node.setScale(2,2);

        tween(this.sheeps_node)
        .to(0.8,{ position:new Vec3(-350,0) })
        .call(()=>{
            callback()
        })
        .to(0.6,{ position:new Vec3(-1000,0) })
        .call(()=>{
            this.sheeps_node.active = false;
        })
        .start()
    }

    start_game(){
        this.sheeps_tween(()=>{
            GameState.reset_ad_times();
            this.refresh_buttons();
    
            let layer_root = this.node.getChildByName("layer_root").getComponent(LayerRootAction)
            layer_root.start_game()
        })
    }
    
    /**
     * 下一关
     */
    next_game(){
        // 当前关卡 +1
        GameState.cur_lvl+=1;
        if( GameState.cur_lvl>GameState.get_max_lvl() ){
            GameState.cur_lvl = 1;
        }
        // 开始游戏
        this.start_game()
    }

    /**
     * 刷新按钮样式 模式样式或是灰度渲染
     */
    refresh_buttons(){
        // 判断道具次数
        if( GameState.ad_redo_times<=0 ){
            // 如果道具次数<=0 进行灰度渲染 按钮为灰色
            this.btn_redo.getComponent(Sprite).grayscale = true;
        }else{
            // 正常的渲染
            this.btn_redo.getComponent(Sprite).grayscale = false;
        }
        if( GameState.ad_remove_times<=0 ){
            this.btn_remove.getComponent(Sprite).grayscale = true;
        }else{
            this.btn_remove.getComponent(Sprite).grayscale = false;
        }

        if( GameState.ad_random_times<=0 ){
            this.btn_random.getComponent(Sprite).grayscale = true;
        }else{
            this.btn_random.getComponent(Sprite).grayscale = false;
        }
    }
}


