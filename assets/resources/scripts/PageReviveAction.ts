import { _decorator, Component, Game, Label, Node } from 'cc';
import { EventDispatcher } from './EventDispatcher';
import { GameState } from './GameState';
const { ccclass, property } = _decorator;

@ccclass('PageReviveAction')
export class PageReviveAction extends Component {

    @property({ type:Label })
    free_times:Label = null;

    start() {
        this.node.active = false;
        EventDispatcher.get_target().on(EventDispatcher.OPEN_REVIVE,this.open_page,this)
    }

    update(deltaTime: number) {
        
    }

    open_page(){
        this.node.active = true;
        this.free_times.string = `（${GameState.ad_free_times}/1）`
    }

    click_free(){
        if( GameState.ad_free_times>0 ){
            this.node.active = false;
            GameState.ad_free_times-=1;
            this.free_times.string = `{${GameState.ad_free_times}/1}`

            EventDispatcher.get_target().emit(EventDispatcher.REMOVE_ACTION,"free time is 0")
        }else{
            EventDispatcher.get_target().emit(EventDispatcher.TIPS_MSG,"free time is 0")
        }
    }
    
    click_thanks(){
        this.node.active = false;
        EventDispatcher.get_target().emit(EventDispatcher.OPEN_OVER)
    }
}


