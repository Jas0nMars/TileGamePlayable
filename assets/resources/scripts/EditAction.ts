import { __private, _decorator, Component, EventTouch, Input, instantiate, Node, Prefab, Size, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

import { GameState } from './GameState';
import { Layer1Action } from './Layer1Action';
import { EventDispatcher } from './EventDispatcher';
import { EditCtlAction } from './EditCtlAction';

@ccclass('EditAction')
export class EditAction extends Component {

    @property({ type:Prefab })
    pre_grid:Prefab = null;

    @property({ type:Layer1Action })
    layer_1_action:Layer1Action = null;

    @property({ type:EditCtlAction })
    edit_ctl_action:EditCtlAction = null;

    cur_grid:Node = null;

    start() {

    }

    update(deltaTime: number) {
        
    }

    private init_grid(){
        this.node.removeAllChildren();

        let start_x = this.node.getComponent(UITransform).width/2*-1;
        let start_y = this.node.getComponent(UITransform).height/2 + 10;

        for( let i=0;i<15;i++ ){
            let x = start_x + ( 38.5*(i+1) );
            for(let j=0;j<17;j++){
                let y = start_y + ( 40*(j+1)*-1 );
                this.add_grid(x,y);
            }
        }
    }

    add_grid(x:number,y:number,size?:Size){
        let grid = instantiate(this.pre_grid);
        grid.setPosition(x,y);
        grid.setParent(this.node);
        if(size){
            grid.getComponent(UITransform).setContentSize(size);
        }
    }

    start_grid(){
        this.init_grid();
        this.node.on(Input.EventType.TOUCH_START,this.touch_start,this)
        this.node.on(Input.EventType.TOUCH_MOVE,this.touch_move,this)

        this.node.on(Input.EventType.TOUCH_END,this.mouse_move,this)

    }

    touch_move(e:EventTouch){
        let wp = e.getUILocation();
        let local_pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(wp.x,wp.y));
        if( GameState.edit_model!=1 ) return;
        for( let i=this.node.children.length-1;i>=0;i-- ){
            let grid = this.node.children[i];

            if( this.cur_grid==grid ){
                continue;
            }
            if( grid&&grid.getComponent(UITransform).getBoundingBox().contains(new Vec2(local_pos.x,local_pos.y)) ){
                // 当前自己
                this.cur_grid = grid;
                this.layer_1_action.add_block_by_world_position(grid.getWorldPosition())
                this.layer_1_action.refrush_shadow();
                EventDispatcher.get_target().emit(EventDispatcher.UPDATE_BLOCK_SIZE)
                break;
            }
        }
    }

    touch_start(e:EventTouch){
        let wp = e.getUILocation();
        let local_pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(wp.x,wp.y));
        
        switch(GameState.edit_model){
            case 1:
                for( let i=this.node.children.length-1;i>=0;i-- ){
                    let grid = this.node.children[i];
                    if( this.cur_grid==grid ){
                        continue;
                    }
                    if( grid&&grid.getComponent(UITransform).getBoundingBox().contains(new Vec2(local_pos.x,local_pos.y)) ){
                        
                        this.cur_grid = grid;
                        this.layer_1_action.add_block_by_world_position(grid.getWorldPosition())
                        this.layer_1_action.refrush_shadow();
                        break;
                    }
                }
                EventDispatcher.get_target().emit(EventDispatcher.UPDATE_BLOCK_SIZE)
                break;
            case 2:
                this.layer_1_action.subtract_block(new Vec3(wp.x,wp.y));
                this.layer_1_action.refrush_shadow();
                EventDispatcher.get_target().emit(EventDispatcher.UPDATE_BLOCK_SIZE)
                break;
            case 3:
                this.add_grid(local_pos.x,local_pos.y,new Size(10,10));
                break;
            case 4:
                for(let i=this.node.children.length-1;i>=0;i--){
                    let grid = this.node.children[i];
                    if( grid&&grid.getComponent(UITransform).getBoundingBox().contains(new Vec2(local_pos.x,local_pos.y)) ){
                        grid.removeFromParent()
                    }
                }
                break;
        }
    }

    mouse_move(e:EventTouch){
        let x = e.getUILocation().x;
        let y = e.getUILocation().y;
        let local = this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(x,y));
        this.edit_ctl_action.set_pos(Math.floor(local.x),Math.floor(local.y))
    }
}


