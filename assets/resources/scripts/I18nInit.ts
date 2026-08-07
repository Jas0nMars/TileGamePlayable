import { Label, Node, Sprite } from 'cc';
import { I18nManager, LanguageType } from './I18nManager';
import { I18nSpriteAuto } from './I18nSpriteAuto';
import { I18nSprite } from './I18nSprite';

/**
 * 多语言初始化工具（静态类，无需挂载到场景节点）
 *
 * 使用方式：
 *   在其他脚本的 start() 最前面调用 I18nInit.init('id')
 *   或调用 I18nInit.init_and_scan('id', this.node) 同时扫描 Label
 */
export class I18nInit {

    private static _label_map: Map<Label, string> = new Map();
    private static _inited: boolean = false;

    /**
     * 初始化多语言系统（不扫描 Label）
     * @param lang 默认语言: 'en' | 'id' | 'pt-BR'
     */
    static init(lang: LanguageType = 'en') {
        if (I18nInit._inited) return;
        I18nInit._inited = true;

        if (lang !== 'en' && lang !== 'id' && lang !== 'pt-BR') {
            console.warn(`[I18nInit] 无效的语言类型: ${lang}，使用默认英语`);
            lang = 'en';
        }
        I18nManager.init(lang);
        console.log(`[I18nInit] 已初始化多语言: ${lang}`);
    }

    /**
     * 初始化多语言系统 + 扫描场景下所有 Label 和 Sprite 自动翻译/切换
     * @param lang 默认语言
     * @param scene_root 场景根节点（通常传 this.node）
     */
    static init_and_scan(lang: LanguageType = 'en', scene_root?: Node) {
        I18nInit.init(lang);

        if (scene_root) {
            // 延迟一帧等待场景节点就绪
            setTimeout(() => {
                I18nInit.scan_labels(scene_root);
                I18nInit.scan_sprites(scene_root);
                I18nManager.on_language_change(I18nInit._on_language_change);
                // 主动刷新场景中所有已挂载的 I18nSprite
                I18nInit.refresh_all_i18n_sprites(scene_root);
            }, 0);
        }
    }

    /** 扫描节点下所有 Label，用原始文本作为翻译键 */
    static scan_labels(root: Node) {
        I18nInit._label_map.clear();
        I18nInit._scan_node(root);
        console.log(`[I18nInit] 已扫描 ${I18nInit._label_map.size} 个 Label`);
    }

    private static _scan_node(node: Node) {
        let label = node.getComponent(Label);
        if (label && label.string && label.string.trim()) {
            I18nInit._label_map.set(label, label.string);
        }
        for (let child of node.children) {
            I18nInit._scan_node(child);
        }
    }

    // ==================== Sprite 自动扫描 ====================

    private static _sprite_count: number = 0;

    /** 扫描节点下所有 Sprite，自动挂载 I18nSpriteAuto */
    static scan_sprites(root: Node) {
        I18nInit._sprite_count = 0;
        I18nInit._scan_sprite_node(root);
        console.log(`[I18nInit] 已扫描 ${I18nInit._sprite_count} 个 Sprite`);
    }

    private static _scan_sprite_node(node: Node) {
        let sprite = node.getComponent(Sprite);
        // 跳过已有 I18nSprite（手动配置）或 I18nSpriteAuto 的节点
        if (sprite && !node.getComponent(I18nSpriteAuto) && !node.getComponent(I18nSprite)) {
            let i18n_sp = node.addComponent(I18nSpriteAuto);
            i18n_sp.init_data(node.name);
            I18nInit._sprite_count++;
        }
        for (let child of node.children) {
            I18nInit._scan_sprite_node(child);
        }
    }

    /** 主动刷新场景中所有已挂载的 I18nSprite（解决初始化顺序问题） */
    private static refresh_all_i18n_sprites(root: Node) {
        let sprites = root.getComponentsInChildren(I18nSprite);
        for (let sp of sprites) {
            sp.update_frame();
        }
        console.log(`[I18nInit] 已刷新 ${sprites.length} 个 I18nSprite`);
    }

    /** 语言变化时更新所有 Label */
    private static _on_language_change = () => {
        for (let [label, key] of I18nInit._label_map) {
            if (label && label.isValid) {
                let text = I18nManager.get(key);
                if (text !== key) {
                    label.string = text;
                }
            }
        }
    };
}
