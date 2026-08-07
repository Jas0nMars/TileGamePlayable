import { _decorator, Component, resources, Sprite, SpriteFrame } from 'cc';
import { I18nManager } from './I18nManager';
const { ccclass, property } = _decorator;

/**
 * 多语言图片自动切换组件（由 I18nInit 自动挂载）
 *
 * 资源命名规则：
 *   放在 resources/i18n/sprites/{key}/ 目录下
 *   文件名为语言代码：en.png, id.png, pt-BR.png
 *
 * 示例：
 *   节点名 = "cash_title"
 *   资源路径：
 *     resources/i18n/sprites/cash_title/en.png
 *     resources/i18n/sprites/cash_title/id.png
 *     resources/i18n/sprites/cash_title/pt-BR.png
 */
@ccclass('I18nSpriteAuto')
export class I18nSpriteAuto extends Component {

    private _res_key: string = '';
    private _sprite: Sprite = null;
    private _cache: Map<string, SpriteFrame> = new Map();
    private _failed_langs: Set<string> = new Set();

    /** 初始化：设置资源键名 */
    init_data(key: string) {
        this._res_key = key;
        this._sprite = this.node.getComponent(Sprite);
        // 如果 onEnable 已经执行过，立即刷新
        if (this.enabled && this._sprite) {
            this._update_frame();
        }
    }

    onEnable() {
        // 可能先于 init_data 执行，此时 _sprite 为 null
        if (this._sprite) {
            this._update_frame();
        }
        I18nManager.on_language_change(this._on_lang_change);
    }

    onDisable() {
        I18nManager.off_language_change(this._on_lang_change);
    }

    private _on_lang_change = () => {
        this._update_frame();
    }

    /** 根据当前语言加载并切换图片 */
    private _update_frame() {
        if (!this._sprite || !this._res_key) return;
        let lang = I18nManager.current_language;

        // 检查缓存
        let cached = this._cache.get(lang);
        if (cached) {
            this._sprite.spriteFrame = cached;
            return;
        }

        // 已尝试加载过但失败，不再重复
        if (this._failed_langs.has(lang)) return;

        // 从 resources 加载
        let path = `i18n/sprites/${this._res_key}/${lang}`;
        resources.load(path, SpriteFrame, (err, sprite_frame) => {
            if (err || !sprite_frame) {
                // 加载失败，记录并保留原图
                this._failed_langs.add(lang);
                return;
            }
            this._cache.set(lang, sprite_frame);
            if (this._sprite && this._sprite.isValid) {
                this._sprite.spriteFrame = sprite_frame;
            }
        });
    }
}
