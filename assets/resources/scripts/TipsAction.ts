import { _decorator, Component, Label, Node, tween, Vec3 } from 'cc';
import { EventDispatcher } from './EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('TipsAction')
export class TipsAction extends Component {

    @property({ type:Label })
    lable_msg:Label = null;

    start() {
        this.node.setPosition(0,-1000);

        EventDispatcher.get_target().on(EventDispatcher.TIPS_MSG,this.show_tips,this)
    }

    update(deltaTime: number) {
        
    }
    
    show_tips(msg:string) {
        this.lable_msg.string = msg;

        this.node.setPosition(0,0);
        tween(this.node)
        .to(0.2,{ position:new Vec3(0,0,0) })
        .to(0.6,{ position:new Vec3(0,20,0) })
        .to(0.3,{ position:new Vec3(0,700,0) })
        .call(()=>{
            this.node.setPosition(0,-1000)
        }).start()
    }
}


