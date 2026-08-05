import { _decorator, Component, instantiate, Node, Prefab, Rect, Sprite, SpriteFrame, tween, UITransform, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PreBlockAction')
export class PreBlockAction extends Component {

    private sprite_index:number = 0;

    private types_array:SpriteFrame[] = [];

    private temp_pos:Vec3 = null;

    private time_for_add_layer3:number = 0;

    original:PreBlockAction = null;

    start() {

    }

    update(deltaTime: number) {
        
    }

    get_bounding_box():Rect{
        return this.node.getComponent(UITransform).getBoundingBox()
    }

    get_coustom_bounding_box():Rect{
        let rec_1 = this.get_bounding_box();
        let num = 15;
        let rect_1 = this.get_bounding_box();
        let rect_2 = new Rect(rec_1.x+num,rec_1.y+num,rec_1.width-num*2,rec_1.height-num*2)
        return rect_2;
    }

    hide(){
        this.node.getChildByName("y_shadow").active = true;
    }
    show(){
        this.node.getChildByName("y_shadow").active = false;
    }

    init(sprite_index:number,types_array:SpriteFrame[]){
        this.sprite_index = sprite_index;
        this.types_array = types_array;
    }

    refrush_sprite(play_tween:boolean){
        if( play_tween ) {
            this.temp_pos = this.node.getPosition()
            tween(this.node)
            .to(0.2,{ position:new Vec3(0,0,0) })
            .call(()=>{
                this.node.getChildByName("y_body").getComponent(Sprite).spriteFrame = this.types_array[this.sprite_index]
            })
            .to(0.2,{ position:this.temp_pos })
            .start()
        }else{
            this.node.getChildByName("y_body").getComponent(Sprite).spriteFrame = this.types_array[this.sprite_index]
        }
    }

    /**
     * name
     */
    public get_sprite_index():number {
        return this.sprite_index
    }
    /**
     * set_sprite_index
     */
    public set_sprite_index(value:number) {
        this.sprite_index = value;
    }

    can_touch():boolean{
        return !this.node.getChildByName("y_shadow").active;
    }

    play_start_tween(){
        tween(this.node)
        .to(0.1,{ scale:new Vec3(1.2,1.2,1) })
        .start();
    }

    play_end_tween(){
        tween(this.node)
        .to(0.1,{ scale:new Vec3(1,1,1) })
        .start();
    }


    clone_block(parent:Node,per_block:Prefab):PreBlockAction{
        let new_block = instantiate(per_block);
        let action = new_block.getComponent(PreBlockAction);
        new_block.setParent(parent);
        let pos_world = this.node.getWorldPosition();
        let parent_local_pos = parent.getComponent(UITransform).convertToNodeSpaceAR(pos_world);
        new_block.setPosition(parent_local_pos)
        action.show()
        action.init(this.sprite_index,this.types_array);
        action.refrush_sprite(false)
        action.original = this;
        this.node.active = false;

        return action;
    }

    set_temp_pos(v:Vec3){
        this.temp_pos = v;
    }

    get_temp_pos():Vec3{
        return this.temp_pos;
    }

    set_add_layer3_time(){
        this.time_for_add_layer3 = new Date().getTime()
    }

    get_add_layer3_tiem(){
        return this.time_for_add_layer3;
    }
}


