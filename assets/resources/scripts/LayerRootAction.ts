import { _decorator, AudioClip, AudioSource, Component, Node, Prefab, tween, UITransform, Vec3 } from 'cc';
import { Layer1Action } from './Layer1Action';
import { Layer2Action } from './Layer2Action';
import { Layer3Action } from './Layer3Action';
import { GameState } from './GameState';
import { PreBlockAction } from './PreBlockAction';
import { MainAction } from './MainAction';
import { EventDispatcher } from './EventDispatcher';
const { ccclass, property } = _decorator;

@ccclass('LayerRootAction')
export class LayerRootAction extends Component {

    layer_1_action:Layer1Action = null;

    @property({ type:Layer2Action }) 
    layer_2_action:Layer2Action = null;

    @property({ type:Layer3Action }) 
    layer_3_action:Layer3Action = null;

    aduio_source:AudioSource = null;

    @property({ type:[AudioClip] })
    audio_clip_array:AudioClip[] = [];
    
    start() {
        this.load_layer_1_action();

        this.aduio_source = this.node.getComponent(AudioSource);
        EventDispatcher.get_target().on(EventDispatcher.REMOVE_ACTION,this.remove,this)
    }

    update(deltaTime: number) {
        
    }
    /**
     * 加载 Layer1Action
     */
    private load_layer_1_action(){
        if( !this.layer_1_action ){
            this.layer_1_action = this.node.getChildByName("layer1").getComponent(Layer1Action)
        }
    }

    /**
     * 开始游戏
     */
    start_game(){
        this.load_layer_1_action();

        this.layer_1_action.clear_all()
        this.layer_2_action.clear_all()
        this.layer_3_action.clear_all()

        this.layer_1_action.start_game(GameState.cur_lvl);
    }
    // 回退一步
    click_redo(){
        if( GameState.ad_redo_times<=0 ){
            EventDispatcher.get_target().emit(EventDispatcher.TIPS_MSG,"redo times is 0")
            return
        }
        let reset_order = this.layer_3_action.get_redo_block();
        if( !reset_order ){
            return;
        }
        // 更新次数
        GameState.ad_redo_times -=1;
        EventDispatcher.get_target().emit(EventDispatcher.REFRESH_BUTTONS)

        reset_order.node.setParent(this.node);
        reset_order.node.setPosition(this.node.getComponent(UITransform).convertToNodeSpaceAR(reset_order.get_temp_pos()))

        // 世界坐标转为 
        let target_pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(reset_order.original.node.getWorldPosition())
        tween(reset_order.node)
        .to(0.15,{ position:target_pos })
        .call(()=>{
            reset_order.original.node.active = true;
            this.layer_1_action.refrush_shadow()
        })
        .removeSelf()
        .start()

        this.layer_3_action.reset_order()
    }

    // 移除三个
    click_remove(){
        if( this.layer_3_action.get_block_size()==0 ){
            return;
        }

        {
            if( GameState.ad_remove_times<=0 ){
                EventDispatcher.get_target().emit(EventDispatcher.TIPS_MSG,"remove times is 0")
                return
            }else{
                GameState.ad_remove_times -=1;
                EventDispatcher.get_target().emit(EventDispatcher.REFRESH_BUTTONS)
            }
        }

        this.remove()
    }

    /**
     * 点击随机
     * @returns 
     */
    clcik_random(){
        {
            if( GameState.ad_random_times<=0 ){
                EventDispatcher.get_target().emit(EventDispatcher.TIPS_MSG,"remove times is 0")
                return
            }else{
                GameState.ad_random_times -=1;
                EventDispatcher.get_target().emit(EventDispatcher.REFRESH_BUTTONS)
            }
        }

        this.layer_1_action.random_blocks();
    }

    public remove(){
        let temp = this.layer_3_action.get_remove_block();
        if( temp.length==0 ){
            return
        }
        this.layer_3_action.reset_order()
        let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(this.layer_2_action.get_zero_word_position());
        for (const ele of temp) {
            ele.node.setParent(this.node);
            ele.node.setPosition(this.node.getComponent(UITransform).convertToNodeSpaceAR(ele.get_temp_pos()));

            tween(ele.node)
            .to(0.1,{ position:local })
            .call(()=>{
                this.layer_2_action.add_block(ele)
            }).start()
        }
    }

    // 坐标 从 1 - 3转换
    public to_3_from_1(block:PreBlockAction,per_block:Prefab){
        let clone_block = block.clone_block(this.node,per_block);
        this.layer_1_action.refrush_shadow();
        
        let slot_pos = this.layer_3_action.get_slot_position(clone_block);
        let local_pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(slot_pos);

        tween(clone_block.node).to(0.15,{ position:local_pos }).call(()=>{
            this.layer_3_action.add(clone_block);
            let is_del = this.layer_3_action.del_sane_block();
            if( is_del ){
                this.play_sound(1)
                if( 
                    this.layer_1_action.get_block_size()==0&&
                    this.layer_2_action.get_block_size()==0&&
                    this.layer_3_action.get_block_size()==0 
                ){
                    this.node.getParent().getComponent(MainAction).next_game()
                }
            }
            this.check_over()
        }).start()
    }

    public to_3_from_2(block:PreBlockAction){
        block.node.setParent(this.node);
        block.node.setPosition(this.node.getComponent(UITransform).convertToNodeSpaceAR(block.get_temp_pos()))
        
        let slot_pos = this.layer_3_action.get_slot_position(block);
        let local_pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(slot_pos);

        tween(block.node).to(0.15,{ position:local_pos }).call(()=>{
            this.layer_3_action.add(block);
            
            let is_del = this.layer_3_action.del_sane_block();
            if( is_del ){
                this.play_sound(1)
                if( 
                    this.layer_1_action.get_block_size()==0&&
                    this.layer_2_action.get_block_size()==0&&
                    this.layer_3_action.get_block_size()==0 
                ){
                    this.node.getParent().getComponent(MainAction).next_game()
                }
            }
            this.check_over()
        }).start()
    }

    check_over(){
        if( this.get_layer3_size()>=7 ){
            EventDispatcher.get_target().emit(EventDispatcher.OPEN_REVIVE)
        }
    }

    get_layer3_size():number{
        return this.layer_3_action.get_block_size()
    }

    play_sound(index:number):void{
        this.aduio_source.playOneShot(this.audio_clip_array[index]);
    }
}


