import { _decorator, Component, Node, UITransform, Vec3, view, Widget } from 'cc';
import { MainAction } from './MainAction';
const { ccclass, property } = _decorator;

/**
 * 单个节点的横竖屏坐标数据
 * 在编辑器中为每个节点配置竖屏和横屏的位置与缩放
 */
@ccclass('LayoutItem')
export class LayoutItem {
    @property({ type: Node })
    node: Node = null;

    // ---- 竖屏坐标 ----
    @property
    p_pos_x: number = 0;
    @property
    p_pos_y: number = 0;
    @property
    p_scale_x: number = 1;
    @property
    p_scale_y: number = 1;
    @property({ tooltip: '竖屏宽度 (0=不修改)' })
    p_width: number = 0;
    @property({ tooltip: '竖屏高度 (0=不修改)' })
    p_height: number = 0;

    // ---- 横屏坐标 ----
    @property
    l_pos_x: number = 0;
    @property
    l_pos_y: number = 0;
    @property
    l_scale_x: number = 1;
    @property
    l_scale_y: number = 1;
    @property({ tooltip: '横屏宽度 (0=不修改)' })
    l_width: number = 0;
    @property({ tooltip: '横屏高度 (0=不修改)' })
    l_height: number = 0;
}

/**
 * 横竖屏管理器
 *
 * 原理：
 *   监听 canvas-resize 事件，检测横竖屏后动态交换设计分辨率的宽高
 *   然后根据 LayoutItem 配置设置对应方向的坐标和缩放
 *
 * 使用方式：
 *   1. 在 Canvas 节点上添加 ScreenLayoutManager 组件
 *   2. 在 layout_items 中拖入需要适配的节点
 *   3. 配置每个节点的竖屏坐标和横屏坐标
 */
@ccclass('ScreenLayoutManager')
export class ScreenLayoutManager extends Component {

    @property({ type: [LayoutItem] })
    layout_items: LayoutItem[] = [];

    @property({ type: Node, tooltip: 'cash_info 节点，竖屏时使用 Widget 左右对齐' })
    cash_info: Node = null;

    is_landscape: boolean = false;
    private _origin_design_w: number = 0;
    private _origin_design_h: number = 0;

    start() {
        // 保存原始设计分辨率（编辑器中设置的值，不再从 view 中读取已修改的值）
        let design = view.getDesignResolutionSize();
        this._origin_design_w = design.width;
        this._origin_design_h = design.height;

        this.check_orientation();
        // 初始状态下也需要应用 cash_info 的 Widget 布局
        this.apply_cash_info_layout();
        view.on('canvas-resize', this.on_canvas_resize, this);
    }

    onDestroy() {
        view.off('canvas-resize', this.on_canvas_resize, this);
    }

    on_canvas_resize() {
        this.check_orientation();
    }

    check_orientation() {
        let size = view.getVisibleSize();
        let new_is_landscape = size.width > size.height;
        if (new_is_landscape !== this.is_landscape) {
            this.is_landscape = new_is_landscape;

            // 关键：基于原始设计分辨率交换宽高，而不是从 view 中读取（因为 view 中的值可能已被修改）
            if (this.is_landscape) {
                // 横屏：交换宽高（如 750x1560 → 1560x750）
                view.setDesignResolutionSize(this._origin_design_h, this._origin_design_w, view.getResolutionPolicy());
            } else {
                // 竖屏：恢复原始设计分辨率
                view.setDesignResolutionSize(this._origin_design_w, this._origin_design_h, view.getResolutionPolicy());
            }

            // 应用坐标布局
            this.apply_layout();

            // 通知 MainAction 切换横竖屏状态（切换 cash_info / lb_cash_num 的横竖屏子节点）
            let main = this.node.getComponent(MainAction);
            if (main) {
                main.set_orientation(this.is_landscape);
            }

            // cash_info 特殊处理：竖屏用 Widget 左右对齐，横屏关闭 Widget
            this.apply_cash_info_layout();

            console.log(`[ScreenLayoutManager] 切换为${this.is_landscape ? '横屏' : '竖屏'}模式`);
        }
    }

    /** 应用横竖屏坐标、缩放和宽高 */
    apply_layout() {
        for (let item of this.layout_items) {
            if (!item || !item.node) continue;
            if (this.is_landscape) {
                item.node.setPosition(new Vec3(item.l_pos_x, item.l_pos_y, 0));
                item.node.setScale(item.l_scale_x, item.l_scale_y, 1);
                if (item.l_width > 0 && item.l_height > 0) {
                    let ui = item.node.getComponent(UITransform) || item.node.addComponent(UITransform);
                    ui.setContentSize(item.l_width, item.l_height);
                }
            } else {
                item.node.setPosition(new Vec3(item.p_pos_x, item.p_pos_y, 0));
                item.node.setScale(item.p_scale_x, item.p_scale_y, 1);
                if (item.p_width > 0 && item.p_height > 0) {
                    let ui = item.node.getComponent(UITransform) || item.node.addComponent(UITransform);
                    ui.setContentSize(item.p_width, item.p_height);
                }
            }
        }
    }

    /**
     * cash_info 特殊处理：
     *   竖屏 → 启用 Widget，左右各预留 50px
     *   横屏 → 禁用 Widget，使用 LayoutItem 配置的坐标
     */
    apply_cash_info_layout() {
        if (!this.cash_info) return;
        if (this.is_landscape) {
            // 横屏：重置 Widget 对齐为 None，使用 LayoutItem 配置的坐标
            let widget = this.cash_info.getComponent(Widget);
            if (widget) {
                widget.isAlignLeft = false;
                widget.isAlignRight = false;
                widget.isAlignTop = false;
                widget.isAlignBottom = false;
                widget.isAlignHorizontalCenter = false;
                widget.isAlignVerticalCenter = false;
                widget.enabled = false;
            }
        } else {
            // 竖屏：启用 Widget，左右各预留 50px
            let widget = this.cash_info.getComponent(Widget) || this.cash_info.addComponent(Widget);
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
            widget.left = 50;
            widget.right = 50;
            widget.enabled = true;
            widget.updateAlignment();
        }
        // 刷新所有子节点的 Widget
        this.refresh_children_widget(this.cash_info);
    }

    /** 递归刷新节点下所有子节点的 Widget */
    refresh_children_widget(parent: Node) {
        for (let child of parent.children) {
            let child_widget = child.getComponent(Widget);
            if (child_widget) {
                child_widget.updateAlignment();
            }
            this.refresh_children_widget(child);
        }
    }
}
