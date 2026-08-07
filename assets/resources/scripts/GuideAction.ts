import { _decorator, Component, Input, Node, UITransform, Vec3, tween, view } from 'cc';
import { LayerRootAction } from './LayerRootAction';
const { ccclass, property } = _decorator;

/**
 * 新手引导组件
 *
 * 使用方式：
 *   1. 在编辑器中创建 guide_tips 节点（含遮罩等 UI），挂载 GuideAction
 *   2. guide_tips 应作为 Canvas 的子节点，位于 layer_root 之后（渲染在上层）
 *   3. guide_tips 默认设为 inactive
 *   4. MainAction 的 guide_tips 属性指向该节点
 *
 * 原理：
 *   show_guide 时设置 Layer1Action.is_guide_mode = true，引导期间只允许点击高亮 block。
 *   高亮 block 被 reparent 到 guide_tips 下，利用渲染层级实现高亮效果。
 *   点击高亮 block 后，hide_guide 设置 is_guide_mode = false，其他 block 才能点击。
 */
@ccclass('GuideAction')
export class GuideAction extends Component {

    private _highlighted_block: Node = null;
    private _layer_root: LayerRootAction = null;
    private _block_local_pos: Vec3 = null; // block 在 layer1 局部空间的原始坐标

    @property({ type:Node })
    guide_hand:Node = null;

    /** 显示引导 */
    show_guide(target_block: Node, layer_root: LayerRootAction) {
        if (!target_block) return;
        this._highlighted_block = target_block;
        this._layer_root = layer_root;

        // 保存 block 在 layer1 局部空间的原始坐标（用于横竖屏切换时还原）
        let layer1 = (this._layer_root as any).layer_1_action;
        if (layer1) {
            let layer1_ui = layer1.node.getComponent(UITransform);
            if (layer1_ui) {
                this._block_local_pos = layer1_ui.convertToNodeSpaceAR(target_block.getWorldPosition());
            }
        }

        // 保存世界位置
        let world_pos = target_block.getWorldPosition();

        // reparent 到 guide_tips
        target_block.setParent(this.node);

        // 手动恢复世界位置（转为 guide_tips 的局部坐标）
        let ui_transform = this.node.getComponent(UITransform);
        let local_pos = ui_transform.convertToNodeSpaceAR(world_pos);
        target_block.setPosition(local_pos);

        // 确保 guide_tips 有 UITransform 且尺寸正确
        let ui = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        ui.setContentSize(750, 1560);

        // 激活 guide_tips（遮罩显示）
        this.node.active = true;

        // 设置引导模式标记
        if (layer1) {
            layer1.is_guide_mode = true;
        }

        // 定位 guide_hand 到高亮 block 右下角
        if (this.guide_hand) {
            // 确保 guide_hand 在 block 之上渲染（兄弟索引更大 = 后渲染 = 上层）
            this.guide_hand.setSiblingIndex(this.node.children.length - 1);

            let block_size = target_block.getComponent(UITransform)?.contentSize;
            if (block_size) {
                let hand_pos = local_pos.clone();
                hand_pos.x += block_size.width / 2;
                hand_pos.y -= block_size.height / 2;
                this.guide_hand.setPosition(hand_pos);
            }
            // 0 到 -45 度循环摆动动画
            this.guide_hand.angle = 0;
            tween(this.guide_hand)
                .to(0.6, { angle: 15 })
                .to(0.6, { angle: 0 })
                .union()
                .repeatForever()
                .start();
        }
    }

    /** 隐藏引导 */
    hide_guide() {
        // 停止 guide_hand 动画
        if (this.guide_hand) {
            tween(this.guide_hand).stop();
        }

        this.node.active = false;
        this._highlighted_block = null;

        // 恢复 layer1 的触控处理
        if (this._layer_root) {
            let layer1 = (this._layer_root as any).layer_1_action;
            if (layer1) {
                layer1.is_guide_mode = false;
            }
        }
    }

    /**
     * 横竖屏切换时重新定位高亮 block
     * 原理：利用保存的 layer1 局部坐标，通过 layer1 当前的世界变换算出新的世界位置，再转为 guide_tips 局部坐标
     */
    on_orientation_change() {
        if (!this._highlighted_block || !this._layer_root || !this._block_local_pos) return;

        let block = this._highlighted_block;
        let layer1 = (this._layer_root as any).layer_1_action;
        if (!layer1) return;

        // 用 layer1 当前的世界变换，将保存的局部坐标转为新的世界坐标
        let layer1_ui = layer1.node.getComponent(UITransform);
        if (!layer1_ui) return;
        let new_world_pos = layer1_ui.convertToWorldSpaceAR(new Vec3(this._block_local_pos.x, this._block_local_pos.y, 0));

        // 更新 guide_tips 的 contentSize 以匹配新方向
        let visible_size = view.getVisibleSize();
        let w = Math.min(visible_size.width, visible_size.height);
        let h = Math.max(visible_size.width, visible_size.height);
        let ui = this.node.getComponent(UITransform);
        if (ui) {
            ui.setContentSize(w, h);
        }

        // 将新的世界坐标转为 guide_tips 局部坐标
        let local_pos = this.node.getComponent(UITransform).convertToNodeSpaceAR(new_world_pos);
        block.setPosition(local_pos);

        // 更新 guide_hand 位置
        if (this.guide_hand) {
            let block_size = block.getComponent(UITransform)?.contentSize;
            if (block_size) {
                let hand_pos = local_pos.clone();
                hand_pos.x += block_size.width / 2;
                hand_pos.y -= block_size.height / 2;
                this.guide_hand.setPosition(hand_pos);
            }
        }
    }
}
