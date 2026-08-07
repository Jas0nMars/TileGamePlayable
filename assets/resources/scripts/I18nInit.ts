import { _decorator, Component, Label, Node } from 'cc';
import { I18nManager, LanguageType } from './I18nManager';
const { ccclass, property } = _decorator;

/**
 * 多语言初始化组件
 * 
 * 使用方式：
 *   1. 在场景根节点或 Canvas 上添加 I18nInit 组件
 *   2. 在 Inspector 中选择默认语言
 *   3. 场景启动时自动初始化多语言系统
 *   4. 自动扫描所有子节点的 Label，用初始文本作为翻译键
 * 
 * 自动翻译规则：
 *   - Label 的初始文本作为翻译键（如 "Start"）
 *   - JSON 中需要有对应的 key（如 "Start": "Mulai"）
 *   - 语言切换时自动更新所有 Label
 */
@ccclass('I18nInit')
export class I18nInit extends Component {

    @property({ type: String, tooltip: '默认语言: en(英语), id(印尼语), pt-BR(巴西葡萄牙语)' })
    default_language: string = 'en';

    @property({ type: Node, tooltip: '扫描此节点下的所有 Label（留空则扫描整个场景）' })
    scan_root: Node = null;

    private _label_map: Map<Label, string> = new Map(); // Label -> 原始文本（作为翻译键）

    start() {
        let lang = this.default_language as LanguageType;
        // 验证语言类型
        if (lang !== 'en' && lang !== 'id' && lang !== 'pt-BR') {
            console.warn(`[I18nInit] 无效的语言类型: ${lang}，使用默认英语`);
            lang = 'en';
        }
        I18nManager.init(lang);
        console.log(`[I18nInit] 已初始化多语言: ${lang}`);

        // 扫描并注册所有 Label
        this.scheduleOnce(() => {
            this.scan_labels();
            I18nManager.on_language_change(this._on_language_change);
        }, 0);
    }

    onDestroy() {
        I18nManager.off_language_change(this._on_language_change);
    }

    /** 扫描所有 Label 并记录原始文本 */
    scan_labels() {
        this._label_map.clear();
        let root = this.scan_root || this.node;
        this._scan_node(root);
        console.log(`[I18nInit] 已扫描 ${this._label_map.size} 个 Label`);
    }

    /** 递归扫描节点 */
    private _scan_node(node: Node) {
        let label = node.getComponent(Label);
        if (label && label.string && label.string.trim()) {
            // 用原始文本作为翻译键
            this._label_map.set(label, label.string);
        }
        // 递归扫描子节点
        for (let child of node.children) {
            this._scan_node(child);
        }
    }

    /** 语言变化时更新所有 Label */
    private _on_language_change = () => {
        for (let [label, key] of this._label_map) {
            if (label && label.isValid) {
                let text = I18nManager.get(key);
                // 如果找不到翻译，保持原文
                if (text !== key) {
                    label.string = text;
                }
            }
        }
    };
}
