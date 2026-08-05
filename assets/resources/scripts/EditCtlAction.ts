import { _decorator, Button, Color, color, Component, EditBox, EventTouch, Label, Node, Size, UITransform, Vec3 } from 'cc';
import { GameState } from './GameState';
import { Layer1Action } from './Layer1Action';
import { EventDispatcher } from './EventDispatcher';
import { EditAction } from './EditAction';
const { ccclass, property } = _decorator;

@ccclass('EditCtlAction')
export class EditCtlAction extends Component {

    @property({ type:Label  })
    label_model_value:Label = null;

    @property({ type:Label  })
    label_block_size:Label = null;
    
    @property({ type:Label  })
    label_position:Label = null;
    
    @property({ type:Label  })
    label_msg:Label = null;

    @property({ type:EditBox  })
    position_x:EditBox = null;
    @property({ type:EditBox  })
    position_y:EditBox = null;
    @property({ type:EditBox  })
    position_data:EditBox = null;

    @property({ type:Layer1Action })
    layer_1_action:Layer1Action = null;

    start() {
        this.refush_model()
        EventDispatcher.get_target().on(EventDispatcher.UPDATE_BLOCK_SIZE,this.update_block_size,this)
    }

    refush_model(){
        switch(GameState.edit_model){
            case 1:
                this.label_model_value.string = "Add Block Model";
                break;
            case 2:
                this.label_model_value.string = "Del Block Model";
                break;
            case 3:
                this.label_model_value.string = "Add Grid Model";
                break;
            case 4:
                this.label_model_value.string = "Del Grid Model";
                break;
        }
    }

    click_model(e:EventTouch,args:string){
        GameState.edit_model = Number(args);

        this.refush_model()
    }

    update(deltaTime: number) {
        
    }

    click_import(){
        let data = this.position_data.string;
        if( data.trim().length<5 ){
            this.label_msg.string  ="data is null";
            return 
        }
        this.click_clear_all();

        let arr = JSON.parse(data)
        for (let ele of arr) {
            this.layer_1_action.add_block_by_local_position(new Vec3(ele.x,ele.y))
        }
        this.layer_1_action.refrush_shadow();
        this.update_block_size();
        EventDispatcher.get_target().emit(EventDispatcher.TIPS_MSG,"导入成功")
    }

    click_export(){
        let children = this.layer_1_action.get_children();

        this.label_msg.string = "";

        if( !children.length ){
            this.label_msg.string = "块不可为空";
            return
        }
        if( children.length%3!=0&&children.length!=0 ){
            this.label_msg.string = "块数量必须是3的倍数";
            return
        }

        let arr:any[] = [];
        for (let ele of children) {
            let pos = ele.getPosition();
            console.log("pos",pos)
            arr.push({ x:Math.ceil(pos.x),y:Math.ceil(pos.y) })
        }
        let ret = JSON.stringify(arr)
        this.position_data.string = ret;
        EventDispatcher.get_target().emit(EventDispatcher.TIPS_MSG,"导出成功")
    }

    click_clear_all(){
        this.layer_1_action.clear_all();
        this.update_block_size()
        EventDispatcher.get_target().emit(EventDispatcher.TIPS_MSG,'操作成功')
    }

    click_custom_grid(){
        let x = this.position_x.string;
        let y = this.position_y.string;
        console.log(x,y)
        if( !x||!y ){
            EventDispatcher.get_target().emit(EventDispatcher.TIPS_MSG,'x y 不可为空')
            return
        }
        this.node.parent.getChildByName("edit").getComponent(EditAction).add_grid(Number(x),Number(y),new Size(10))
    }

    update_block_size() {
        let size = this.layer_1_action.get_children().length;
        let color = null;
        
        if( size%3 ==0 ){
            color = new Color(255,255,255,255);
        }else{
            color = new Color(255,0,0,255)
        }
        this.label_block_size.string = ''+size;
        this.label_block_size.color = color;
    }

    set_pos(x:number,y:number){
        this.label_position.string = "{" + x + "," + y + "}";
    }
}


