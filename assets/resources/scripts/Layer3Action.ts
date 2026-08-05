import { _decorator, Component, instantiate, Node, Prefab, tween, UITransform, Vec3 } from 'cc';
import { PreBlockAction } from './PreBlockAction';
const { ccclass, property } = _decorator;

@ccclass('Layer3Action')
export class Layer3Action extends Component {

    @property({ type:Node })
    slot_arr:Node[] = [];

    @property({ type:Prefab })
    per_del:Prefab = null;

    order_list:PreBlockAction[] = [];

    start() {

    }

    update(deltaTime: number) {
        
    }


    reset_order(){
        for( let i=0;i<this.order_list.length;i++ ){
            let ele = this.order_list[i];
            ele.set_temp_pos(this.slot_arr[i].getPosition());

            if( ele.node.getParent() == this.node ){
                tween(ele.node).to(0.1,{ position:ele.get_temp_pos() }).start()
            }
        }
    }

    get_slot_position(action:PreBlockAction):Vec3{
        let temp:PreBlockAction[] = [];
        let find:boolean = false;
        let insert_complete:boolean = false;
        for( let ele of this.order_list ){
            if( ele.get_sprite_index() == action.get_sprite_index() ){
                find  = true;
                temp.push(ele)
            }else{
                if( find&&!insert_complete ){
                    temp.push(action);
                    insert_complete = true;
                }
                temp.push(ele)
            }
        }
        if( !insert_complete ){
            temp.push(action)
        }
        this.order_list.splice(0,this.order_list.length)
        this.order_list = temp;
        this.reset_order();
        // 转为世界坐标
        return this.node.getComponent(UITransform).convertToWorldSpaceAR(action.get_temp_pos())

    }

    // 添加
    add(action:PreBlockAction){
        let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(action.node.getWorldPosition());
        action.node.setParent(this.node);
        action.node.setPosition(local)

        action.set_add_layer3_time();
    }

    // 删除
    del_sane_block():boolean{
        let temp:PreBlockAction[] = [];
        for( let ele of this.order_list){
            if( temp.length==0 ){
                temp.push(ele)
            }else{
                if( temp[0].get_sprite_index()==ele.get_sprite_index() ){
                    temp.push(ele)
                }else{
                    temp.splice(0,temp.length)
                    temp.push(ele)
                }
            }
            if( temp.length>=3 ){
                break
            }
        }
        if( temp.length>=3 ){
            for( let ele of temp ){
                // 创建预加载资源
                let del_ani = instantiate(this.per_del);
                del_ani.setParent(this.node);
                del_ani.setPosition(ele.node.getPosition());
                tween(del_ani).delay(0.4).removeSelf().start();

                let index = this.order_list.indexOf(ele);
                this.order_list.splice(index,1);

                ele.node.removeFromParent();
                ele.original?.node.removeFromParent();
            }
            this.scheduleOnce(()=>{
                this.reset_order()
            },0.3)
            return true
        }
        return false;
    }

    get_block_size():number{
        return this.order_list.length
    }

    get_remove_block():PreBlockAction[]{
        let temp:PreBlockAction[] = [];
        for(let ele of this.order_list){
            temp.push(ele);
            if( temp.length>=3 ){
                break
            }
        }
        for( let ele of temp ){
            let index = this.order_list.indexOf(ele)
            if( index>=0 ){
                this.order_list.splice(index,1);
                ele.set_temp_pos(ele.node.getWorldPosition());
                ele.node.removeFromParent();
            }
        }
        return temp;
    }

    
    get_redo_block():PreBlockAction{
        let ret:PreBlockAction = null;
        for( let ele of this.order_list ){
            if( !ret ){
                ret = ele;
            }else{
                if( ele.get_add_layer3_tiem()>ret.get_add_layer3_tiem() ){
                    ret = ele;
                }
            }
        }
        if( ret ){
            let index = this.order_list.indexOf(ret);
            if( index>=0 ){
                this.order_list.splice(index,1);
                ret.set_temp_pos(ret.node.getWorldPosition());
                ret.node.removeFromParent()
            }
        }
        return ret;
    }

    clear_all(){
        for( let ele of this.order_list ){
            ele.node.removeFromParent()
        }
        this.order_list.splice(0,this.order_list.length)
    }
}


