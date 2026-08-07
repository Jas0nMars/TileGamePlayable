import { _decorator, Component, Input, Node, UITransform, Vec3, tween } from 'cc';
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

    @property({ type:Node })
    guide_hand:Node = null;

    /** 显示引导 */
    show_guide(target_block: Node, layer_root: LayerRootAction) {
        if (!target_block) return;
        this._highlighted_block = target_block;
        this._layer_root = layer_root;

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
        let layer1 = (this._layer_root as any).layer_1_action;
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
}
