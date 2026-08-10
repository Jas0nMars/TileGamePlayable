import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

// 声明全局 SDK 方法类型
declare const mraid: { open: () => void } | undefined;

interface Window {
    gameReady?: () => void;
    gameEnd?: () => void;
    showAd?: (adType: string) => void;
    hideAd?: (adType: string) => void;
    install?: () => void;
    getSDKVersion?: () => string;
}

/**
 * SDK管理器
 * 用于管理游戏与SDK的交互
 */
@ccclass('SDKManager')
export class SDKManager extends Component {
    private static _instance: SDKManager = null!;
    private _isInitialized: boolean = false;

    @property(Boolean)
    private isApplovin: boolean = false;

    /**
     * 获取SDK管理器单例
     */
    public static get instance(): SDKManager {
        return this._instance;
    }

    onLoad() {
        if (SDKManager._instance === null) {
            SDKManager._instance = this;
        } else {
            this.node.destroy();
            return;
        }
    }

    /**
     * 初始化SDK
     * 在游戏启动时调用
     */
    public initSDK(): void {
        if (this.isApplovin) {
            return;
        }
        if (this._isInitialized) {
            console.log('SDK already initialized');
            return;
        }

        try {
            // 调用SDK初始化方法
            if ((window as any).gameReady) {
                (window as any).gameReady();
                console.log('SDK initialized successfully');
            } else {
                console.warn('SDK initialization method not found');
            }

            this._isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize SDK:', error);
        }
    }

    /**
     * 开始游戏
     * 在游戏开始时调用
     */
    public gameStart(): void {
        console.log('gameStart');
    }

    /**
     * 结束游戏
     * 在游戏结束时调用
     */
    public gameClose(): void {
        console.log('gameClose');
    }

    /**
     * 关闭游戏
     * 在游戏关闭时调用
     */
    public gameEnd(): void {
        if (this.isApplovin) {
            return;
        }
        try {
            // 调用SDK关闭游戏方法
            if ((window as any).gameEnd) {
                (window as any).gameEnd();
                console.log('Game gameEnd in SDK');
            } else {
                console.warn('SDK gameEnd method not found');
            }
        } catch (error) {
            console.error('Failed to gameEnd in SDK:', error);
        }
    }

    /**
     * 显示广告
     * @param adType 广告类型
     */
    public showAd(adType: string): void {
        if (this.isApplovin) {
            return;
        }
        try {
            // 调用SDK显示广告方法
            if ((window as any).showAd) {
                (window as any).showAd(adType);
                console.log(`Ad of type ${adType} shown`);
            } else {
                console.warn('SDK showAd method not found');
            }
        } catch (error) {
            console.error('Failed to show ad:', error);
        }
    }

    /**
     * 隐藏广告
     * @param adType 广告类型
     */
    public hideAd(adType: string): void {
        try {
            // 调用SDK隐藏广告方法
            if ((window as any).hideAd) {
                (window as any).hideAd(adType);
                console.log(`Ad of type ${adType} hidden`);
            } else {
                console.warn('SDK hideAd method not found');
            }
        } catch (error) {
            console.error('Failed to hide ad:', error);
        }
    }

    /**
     * 触发下载
     * 调用SDK的下载方法
     */
    public triggerDownload(): void {
        if (this.isApplovin) {
            if (typeof mraid !== 'undefined' && mraid.open) {
                mraid.open();
            }
        } else {
            try {
                // 调用SDK下载方法
                if ((window as any).install) {
                    (window as any).install();
                    console.log('Download triggered');
                } else {
                    console.warn('SDK install method not found');
                }
            } catch (error) {
                console.error('Failed to trigger download:', error);
            }
        }
    }

    /**
     * 获取SDK版本
     * @returns SDK版本号
     */
    public getSDKVersion(): string {
        try {
            // 调用SDK获取版本方法
            if ((window as any).getSDKVersion) {
                return (window as any).getSDKVersion();
            } else {
                console.warn('SDK getSDKVersion method not found');
                return 'unknown';
            }
        } catch (error) {
            console.error('Failed to get SDK version:', error);
            return 'unknown';
        }
    }

    onDestroy() {
        if (SDKManager._instance === this) {
            SDKManager._instance = null!;
        }
    }
}
