import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { I18nManager } from './I18nManager';
const { ccclass, property } = _decorator;

/**
 * 多语言图片组件
 * 
 * 使用方式：
 *   1. 在带有 Sprite 组件的节点上添加 I18nSprite
 *   2. 在 Inspector 中为每种语言设置对应的 SpriteFrame
 *   3. 语言切换时自动更换图片
 */
@ccclass('I18nSprite')
export class I18nSprite extends Component {

    @property({ type: SpriteFrame, tooltip: '英语图片' })
    frame_en: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: '印尼语图片' })
    frame_id: SpriteFrame = null;

    @property({ type: SpriteFrame, tooltip: '巴西葡萄牙语图片' })
    frame_pt_BR: SpriteFrame = null;

    private _sprite: Sprite = null;

    onEnable() {
        this._sprite = this.node.getComponent(Sprite);
        // 尝试注册监听，如果 I18nManager 还未初始化则延迟重试
        this._try_register();
    }

    /** 尝试注册语言变化监听，未初始化时延迟重试 */
    private _try_register() {
        if (!I18nManager.instance) {
            // I18nManager 还未初始化，延迟重试（由 I18nInit 最终刷新）
            this.scheduleOnce(this._try_register, 0.05);
            return;
        }
        this.update_frame();
        I18nManager.on_language_change(this._on_language_change);
    }

    onDisable() {
        I18nManager.off_language_change(this._on_language_change);
    }

    /** 根据当前语言切换图片 */
    update_frame() {
        if (!this._sprite) return;
        let lang = I18nManager.current_language;
        let frame: SpriteFrame = null;

        if (lang === 'en') {
            frame = this.frame_en;
        } else if (lang === 'id') {
            frame = this.frame_id;
        } else if (lang === 'pt-BR') {
            frame = this.frame_pt_BR;
        }

        if (frame) {
            this._sprite.spriteFrame = frame;
        }
    }

    /** 语言变化回调 */
    private _on_language_change = () => {
        this.update_frame();
    };
}
