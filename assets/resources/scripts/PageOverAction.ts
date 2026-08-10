import { _decorator, Component, director, Label, Node } from 'cc';
import { EventDispatcher } from './EventDispatcher';
import { GameState } from './GameState';
const { ccclass, property } = _decorator;

// 声明 MRAID 全局变量（试玩广告平台运行时注入）
declare const mraid: { open: () => void } | undefined;

@ccclass('PageOverAction')
export class PageOverAction extends Component {

    @property({ type:Label })
    challenge_label:Label = null;

    start() {
        this.node.active = false;
        EventDispatcher.get_target().on(EventDispatcher.OPEN_OVER,this.open_over,this)
    }

    update(deltaTime: number) {
        
    }

    open_over(){
        this.node.active = true;
        this.challenge_label.string = "x" + GameState.cur_lvl;
    }

    // 重新开始
    click_replay(){
        this.node.active = false;
        
        EventDispatcher.get_target().emit(EventDispatcher.REPLAY_GAME)
    }

    click_back(){
        this.node.active = false;
        // AppLovin 试玩广告：点击返回时调用 mraid.open() 跳转下载
        if (typeof mraid !== 'undefined' && mraid.open) {
            mraid.open();
        }
    }
}


