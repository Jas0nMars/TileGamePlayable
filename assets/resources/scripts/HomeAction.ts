import { _decorator, AudioSource, Button, Component, Node,director } from 'cc';
const { ccclass, property } = _decorator;
import { SceneBase } from "./SceneBase";

@ccclass('HomeAction')
export class HomeAction extends SceneBase {


    start() {
        this.init_bg_sound();
    }

    update(deltaTime: number) {
        
    }

    click_start(){
        console.log("点击开始")
        director.loadScene("main")
        
        this.stop_bg_sound();
    }
}


