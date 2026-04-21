/**
 * ConfirmDialog.js
 * 범용 확인 다이얼로그 (Yes/No)
 *
 * 사용:
 *   const dialog = new ConfirmDialog(scene);
 *   dialog.show({
 *     title: '도전 포기',
 *     message: '현재 도전을 포기하시겠습니까?\n인벤토리 블럭이 사라집니다.',
 *     confirmLabel: '포기',
 *     cancelLabel: '취소',
 *     onConfirm: () => { ... },
 *     onCancel: () => { ... },
 *   });
 */
class ConfirmDialog {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.uiObjects = [];
    }

    show(opts) {
        if (this.isOpen) return;
        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 400;

        const title = opts.title || '확인';
        const message = opts.message || '';
        const confirmLabel = opts.confirmLabel || '확인';
        const cancelLabel = opts.cancelLabel || '취소';
        const confirmColor = opts.confirmColor !== undefined ? opts.confirmColor : 0xc0392b;

        const dw = 300;
        const dh = 200;
        const dx = (gw - dw) / 2;
        const dy = (gh - dh) / 2;

        // 오버레이
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, gw, gh);
        overlay.setDepth(depthBase);
        this.uiObjects.push(overlay);

        const overlayZone = this.scene.add.zone(gw / 2, gh / 2, gw, gh);
        overlayZone.setInteractive();
        overlayZone.setDepth(depthBase);
        overlayZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
        });
        this.uiObjects.push(overlayZone);

        // 박스
        const box = this.scene.add.graphics();
        box.fillStyle(0x233554, 1);
        box.lineStyle(2, 0x5c6b8c, 1);
        box.fillRoundedRect(dx, dy, dw, dh, 10);
        box.strokeRoundedRect(dx, dy, dw, dh, 10);
        box.setDepth(depthBase + 1);
        this.uiObjects.push(box);

        // 타이틀
        const titleText = this.scene.add.text(
            dx + dw / 2, dy + 20,
            title, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '17px',
                color: '#f39c12',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(titleText);

        // 메시지
        const msgText = this.scene.add.text(
            dx + dw / 2, dy + 60,
            message, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: dw - 40 },
                lineSpacing: 5,
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(msgText);

        // 버튼 2개
        const btnW = 110;
        const btnH = 38;
        const btnGap = 12;
        const totalW = btnW * 2 + btnGap;
        const btnY = dy + dh - btnH - 20;
        const btnStartX = dx + (dw - totalW) / 2;

        // 취소 (왼쪽)
        this._createButton(
            btnStartX, btnY, btnW, btnH,
            cancelLabel, 0x7f8c8d, '#ffffff',
            depthBase,
            () => this._close(() => { if (opts.onCancel) opts.onCancel(); }),
        );

        // 확인 (오른쪽)
        this._createButton(
            btnStartX + btnW + btnGap, btnY, btnW, btnH,
            confirmLabel, confirmColor, '#ffffff',
            depthBase,
            () => this._close(() => { if (opts.onConfirm) opts.onConfirm(); }),
        );
    }

    _createButton(bx, by, w, h, label, color, textColor, depthBase, onTap) {
        const bg = this.scene.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(bx, by, w, h, 6);
        bg.setDepth(depthBase + 2);
        this.uiObjects.push(bg);

        const text = this.scene.add.text(bx + w / 2, by + h / 2, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: textColor,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(depthBase + 3);
        this.uiObjects.push(text);

        const zone = this.scene.add.zone(bx + w / 2, by + h / 2, w, h);
        zone.setInteractive({ useHandCursor: true });
        zone.setDepth(depthBase + 4);
        zone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            if (onTap) onTap();
        });
        this.uiObjects.push(zone);
    }

    _close(afterClose) {
        if (!this.isOpen) return;
        this.isOpen = false;

        for (const obj of this.uiObjects) {
            if (obj) obj.destroy();
        }
        this.uiObjects = [];

        if (afterClose) afterClose();
    }

    destroy() {
        this._close(null);
    }
}