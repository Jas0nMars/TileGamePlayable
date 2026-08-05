import { _decorator, Component, EventTouch, Input, instantiate, Node, Prefab, SpriteFrame, UITransform, Vec2, Vec3 } from 'cc';
import { PreBlockAction } from './PreBlockAction';
import { GameState } from './GameState';
import { LayerRootAction } from './LayerRootAction';
const { ccclass, property } = _decorator;

@ccclass('Layer1Action')
export class Layer1Action extends Component {

    @property({ type:Prefab })
    per_block:Prefab = null;

    @property({ type:SpriteFrame })
    types_array:SpriteFrame[] = []

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
    // 添加
    add_block_by_world_position(world:Vec3){
        let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(world);
        return this.add_block_by_local_position(local)
    }

    add_block_by_local_position(local:Vec3){
        let block = instantiate(this.per_block);
        block.setPosition(local);
        block.setParent(this.node);
        return block.getComponent(PreBlockAction)
    }
    // 删除
    subtract_block(world:Vec3){
        let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(world);
        for( let i=this.node.children.length-1;i>=0;i-- ){
            if( this.node.children[i].getComponent(PreBlockAction).get_bounding_box().contains(new Vec2(local.x,local.y))){
                this.node.children[i].removeFromParent()
                break;
            }
        }
    }

    // 更新阴影
    refrush_shadow(){
        for( let i=0;i<this.node.children.length;i++ ){
            let ele_1 = this.node.children[i].getComponent(PreBlockAction);
            if( !ele_1.node.active ){
                continue;
            }
            ele_1.show();

            for( let j=i+1;j<this.node.children.length;j++ ){
                let ele_2 = this.node.children[j].getComponent(PreBlockAction);
                if( !ele_2.node.active ){
                    continue;
                }
                if( ele_1.get_coustom_bounding_box().intersects(ele_2.get_coustom_bounding_box()) ){
                    ele_1.hide()
                    break;
                }
            }
        }
    }
    // 获取子元素
    get_children():Node[]{
        return this.node.children;
    }

    clear_all(){
        this.node.removeAllChildren()
    }

    start_game(lvl:number){
        let lvl_data = GameState.get_data_by_lvl(lvl);
        let types_random_index_arr = this.get_random_index_array(lvl_data.types);
        let current_index = 0;

        for(let index = 0;index<lvl_data.list.length;index++){
            let ele = lvl_data.list[index];
            if( index>0&&index%3==0 ){
                current_index++;
                if( current_index>=types_random_index_arr.length ){
                    current_index = 0;
                }
            }
            let pre_block_action = this.add_block_by_local_position(new Vec3(ele.x,ele.y))
            pre_block_action.init(types_random_index_arr[current_index],this.types_array);
            pre_block_action.refrush_sprite(true)
            
        }
        this.refrush_shadow()
        this.random_blocks();
    }

    get_random_index_array(types:number):number[]{
        let arr:number[] = []
        for(let i=0;i<this.types_array.length;i++){
            arr.push(i)
        }
        arr.sort(()=>{
            return 0.5-Math.random();
        })
        arr.splice(0,arr.length-types);
        return arr;
    }

    random_blocks(){
        let temp:PreBlockAction[] = [];
        for(let ele of this.node.children){
            let action = ele.getComponent(PreBlockAction);
            if( !action.node.active ){
                continue;
            }
            temp.push(action)
        }
        for (const element of temp) {
            let othen = temp[Math.floor(Math.random()*temp.length)];
            let othen_index = othen.get_sprite_index();

            othen.set_sprite_index(element.get_sprite_index());
            element.set_sprite_index(othen_index);
            othen.refrush_sprite(true);
            element.refrush_sprite(true);
        }
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
        // 如果 layer3中的block数量7个 逻辑需要终止
        if( this.node.getParent().getComponent(LayerRootAction).get_layer3_size()>=7 ){
            return
        }

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
        // 播放click音效
        this.node.parent.getComponent(LayerRootAction).play_sound(0)
        // 把block放入的熬 layer root中
        this.node.parent.getComponent(LayerRootAction).to_3_from_1(this.cur_block_action,this.per_block)
    }

    /**
     * 取消触控
     * @param e 
     */
    touch_cancel(e:EventTouch){
        if( this.cur_block_action ){
            this.cur_block_action.play_end_tween()
        }
    }

    get_block_size():number{
        return this.node.children.length;
    }
}


