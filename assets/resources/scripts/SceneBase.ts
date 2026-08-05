import { _decorator, Component, Node,Button,AudioSource } from 'cc';
const { ccclass, property } = _decorator;
import { GameState } from "./GameState";

@ccclass('SceneBase')
export class SceneBase extends Component {
    
    @property({ type:Button })
    btn_sound:Button = null;
    audio_source:AudioSource = null;

    start() {

    }

    update(deltaTime: number) {
        
    }

    init_bg_sound(){
        this.audio_source = this.node.getComponent(AudioSource)
        this.on_off_sound();
    }

    private on_off_sound(){
        if( GameState.sound_state ){
            this.btn_sound.node.getChildByName("mm_on").active = true;
            this.btn_sound.node.getChildByName("mm_off").active = false;
        }else{
            this.btn_sound.node.getChildByName("mm_on").active = false;
            this.btn_sound.node.getChildByName("mm_off").active = true;
        }
        if( GameState.sound_state ){
            this.audio_source.play()
            this.audio_source.loop = true;
            this.audio_source.volume = 0.1;
        }else{
            if( this.audio_source.playing ){
                this.audio_source.stop()
                this.audio_source.loop = false;
            }else{

            }
        }
    }

    stop_bg_sound(){
        if( this.audio_source.playing ){
            this.audio_source.stop();
            this.audio_source.loop = false;
        }
    }

    change_sound(){
        GameState.sound_state = !GameState.sound_state;
        this.on_off_sound();
        console.log("切换音乐")
    }
}


