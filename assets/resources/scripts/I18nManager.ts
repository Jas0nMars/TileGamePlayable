import { _decorator, Component, resources, JsonAsset, Node, director } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 语言类型
 */
export type LanguageType = 'en' | 'id' | 'pt-BR';

/**
 * 多语言管理器
 *
 * 使用方式：
 *   1. 在游戏启动时调用 I18nManager.init('en') 初始化
 *   2. 使用 I18nManager.get('key') 获取翻译文本
 *   3. 使用 I18nManager.set_language('id') 切换语言
 *
 * 语言数据存放在 resources/i18n/ 目录下：
 *   - en.json
 *   - id.json
 *   - pt-BR.json
 *
 * JSON 格式：{ "key": "翻译文本", ... }
 */
@ccclass('I18nManager')
export class I18nManager extends Component {

    private static _instance: I18nManager = null;
    private _current_language: LanguageType = 'en';
    private _language_data: Map<string, Map<string, string>> = new Map(); // lang -> (key -> text)
    private _listeners: Set<() => void> = new Set(); // 语言变化监听器

    /** 获取单例 */
    static get instance(): I18nManager {
        return I18nManager._instance;
    }

    /** 获取当前语言 */
    static get current_language(): LanguageType {
        return I18nManager._instance?._current_language ?? 'en';
    }

    /**
     * 初始化语言管理器
     * @param default_lang 默认语言
     */
    static init(default_lang: LanguageType = 'en') {
        if (!I18nManager._instance) {
            let node = new Node();
            node.name = 'I18nManager';
            I18nManager._instance = node.addComponent(I18nManager) as I18nManager;
            // 添加到常驻节点（不被场景切换销毁）
            // 如果需要跨场景，取消下面注释
            // director.addPersistRootNode(node);
        }
        I18nManager._instance._load_language(default_lang);
    }

    /**
     * 获取翻译文本
     * @param key 翻译键
     * @param args 可选参数，用于替换 {0}, {1}, ... 占位符
     */
    static get(key: string, ...args: any[]): string {
        if (!I18nManager._instance) return key;
        let lang_data = I18nManager._instance._language_data.get(I18nManager._instance._current_language);
        if (!lang_data) return key;
        let text = lang_data.get(key);
        if (!text) return key;
        // 替换占位符
        if (args.length > 0) {
            for (let i = 0; i < args.length; i++) {
                text = text.replace(`{${i}}`, String(args[i]));
            }
        }
        return text;
    }

    /**
     * 切换语言
     * @param lang 新语言
     */
    static set_language(lang: LanguageType) {
        if (!I18nManager._instance) return;
        I18nManager._instance._load_language(lang);
    }

    /**
     * 注册语言变化监听器
     */
    static on_language_change(callback: () => void) {
        if (!I18nManager._instance) return;
        I18nManager._instance._listeners.add(callback);
    }

    /**
     * 取消语言变化监听器
     */
    static off_language_change(callback: () => void) {
        if (!I18nManager._instance) return;
        I18nManager._instance._listeners.delete(callback);
    }

    /** 加载语言数据 */
    private _load_language(lang: LanguageType) {
        // 立即设置当前语言（不等待异步加载）
        this._current_language = lang;
        // 如果已加载，直接通知
        if (this._language_data.has(lang)) {
            this._notify_listeners();
            return;
        }
        // 从 resources 加载 JSON
        resources.load(`i18n/${lang}`, JsonAsset, (err, json_asset) => {
            if (err) {
                console.error(`[I18nManager] 加载语言文件失败: ${lang}`, err);
                return;
            }
            let data = json_asset.json as { [key: string]: string };
            let map = new Map<string, string>();
            for (let key in data) {
                map.set(key, data[key]);
            }
            this._language_data.set(lang, map);
            this._notify_listeners();
            console.log(`[I18nManager] 已加载语言: ${lang}`);
        });
    }

    /** 通知所有监听器 */
    private _notify_listeners() {
        for (let listener of this._listeners) {
            listener();
        }
    }
}
