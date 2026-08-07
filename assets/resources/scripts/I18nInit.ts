import { Label, Node } from 'cc';
import { I18nManager, LanguageType } from './I18nManager';

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
     * 初始化多语言系统 + 扫描场景下所有 Label 自动翻译
     * @param lang 默认语言
     * @param scene_root 场景根节点（通常传 this.node）
     */
    static init_and_scan(lang: LanguageType = 'en', scene_root?: Node) {
        I18nInit.init(lang);

        if (scene_root) {
            // 延迟一帧等待场景节点就绪
            setTimeout(() => {
                I18nInit.scan_labels(scene_root);
                I18nManager.on_language_change(I18nInit._on_language_change);
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
