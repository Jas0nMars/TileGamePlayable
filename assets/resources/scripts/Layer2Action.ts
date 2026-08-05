import { _decorator, Component, EventTouch, Input, Node, Prefab, UITransform, Vec2, Vec3 } from 'cc';
import { PreBlockAction } from './PreBlockAction';
import { GameState } from './GameState';
import { LayerRootAction } from './LayerRootAction';
const { ccclass, property } = _decorator;

@ccclass('Layer2Action')
export class Layer2Action extends Component {

    cur_block_action:PreBlockAction = null;

    start() {
        if( GameState.game_model==1 ){
            return;
        }
        this.node.on(Input.EventType.TOUCH_START,this.touch_start,this)
        this.node.on(Input.EventType.TOUCH_END,this.touch_end,this)
        this.node.on(Input.EventType.TOUCH_CANCEL,this.touch_cancel,this)
    }


    update(deltaTime: number) {
        
    }
    
    clear_all(){
        this.node.removeAllChildren()
    }

    get_block_size():number{
        return this.node.children.length;
    }

    get_zero_word_position():Vec3{
        return this.node.getComponent(UITransform).convertToWorldSpaceAR(new Vec3(0,0,0))
    }

    add_block(block_action:PreBlockAction){
        block_action.node.setParent(this.node)
        block_action.node.setPosition(0,0);
    }

    
    get_touch_block(pos_world:Vec2):PreBlockAction{
        // 将世界坐标点 转为 局部坐标点
        let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(pos_world.x,pos_world.y))
        for( let  i = this.node.children.length-1;i>=0;i-- ){
            let ele  = this.node.children[i];
            if( !ele.active ){
                continue;
            }
            let block_action = ele.getComponent(PreBlockAction)
            if( !block_action.can_touch() ){
                continue;
            }
            if( block_action.get_bounding_box().contains(new Vec2(local.x,local.y)) ){
                return block_action;
            }
        }
        return null;
    }
    
    /**
     * touch start 方法
     * @param e 
     */
    touch_start(e:EventTouch){
        console.log(111)
        let pos = e.getUILocation();
        // 根据坐标获取 触控到的block
        let block_action = this.get_touch_block(pos);
        this.cur_block_action = block_action;
        if( this.cur_block_action ){
            // 播放该block放大的动画
            this.cur_block_action.play_start_tween()
        }
    }
    
    /**
     * touch end 方法
     * @param e 
     * @returns 
     */
    touch_end(e:EventTouch){
        console.log(2222)
        // 获取坐标
        let pos = e.getUILocation()
        if( this.cur_block_action ){
            // 播放缩小的动画
            this.cur_block_action.play_end_tween()
        }else{
            return
        }
        // 根据坐标获取 触控到的block
        let block_action = this.get_touch_block(pos);
        // 离开的位置在自己身上
        if( this.cur_block_action!=block_action ){
            return
        }
        // 给block设置一个临时的坐标 （改坐标是block在当前node中的世界坐标）
        this.cur_block_action.set_temp_pos(this.cur_block_action.node.getWorldPosition())
        // 播放触控声音
        this.node.getParent().getComponent(LayerRootAction).play_sound(0)
        // 把block放入到 layer root中
        this.node.getParent().getComponent(LayerRootAction).to_3_from_2(this.cur_block_action)
    }

    touch_cancel(e:EventTouch){
        console.log(444)
        if( this.cur_block_action ){
            this.cur_block_action.play_end_tween()
        }
    }
}


