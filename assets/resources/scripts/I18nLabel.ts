import { _decorator, Component, Label } from 'cc';
import { I18nManager } from './I18nManager';
const { ccclass, property } = _decorator;

/**
 * 多语言标签组件
 *
 * 使用方式：
 *   1. 在带有 Label 组件的节点上添加 I18nLabel
 *   2. 在 Inspector 中设置 text_key（翻译键）
 *   3. 语言切换时自动更新文本
 *
 * 示例：
 *   text_key = "common.start" → 显示 "Start" / "Mulai" / "Começar"
 *   text_key = "reward.coins" → 显示 "Coins: {0}" 并传入参数
 */
@ccclass('I18nLabel')
export class I18nLabel extends Component {

    @property({ tooltip: '翻译键，如 common.start' })
    text_key: string = '';

    private _label: Label = null;
    private _args: any[] = []; // 可选参数

    onEnable() {
        this._label = this.node.getComponent(Label);
        this.update_text();
        I18nManager.on_language_change(this._on_language_change);
    }

    onDisable() {
        I18nManager.off_language_change(this._on_language_change);
    }

    /**
     * 设置翻译参数（用于带占位符的文本）
     * @param args 参数列表，替换 {0}, {1}, ...
     */
    set_args(...args: any[]) {
        this._args = args;
        this.update_text();
    }

    /** 更新文本 */
    update_text() {
        if (!this._label || !this.text_key) return;
        this._label.string = I18nManager.get(this.text_key, ...this._args);
    }

    /** 语言变化回调 */
    private _on_language_change = () => {
        this.update_text();
    };
}
