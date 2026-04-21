/**
 * RewardItemsDialog.js
 * 던전 클리어 보상 블럭 목록 팝업
 * 창고 탭 진입 시 대기 블럭이 있으면 자동 표시
 *
 * 사용:
 *   const dialog = new RewardItemsDialog(scene);
 *   dialog.show({ onConfirm: () => { ... } });
 */
class RewardItemsDialog {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.uiObjects = [];
    }

    show(opts = {}) {
        if (this.isOpen) return;

        const groups = StorageManager.getPendingGrouped();
        if (groups.length === 0) {
            // 아무것도 없으면 안 띄움
            if (opts.onConfirm) opts.onConfirm();
            return;
        }

        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 420;

        // 리스트 개수에 따라 팝업 높이 가변
        const headerH = 100;
        const itemH = 44;
        const footerH = 70;
        const maxVisibleItems = 6;   // 이보다 많으면 간단 요약만 (스크롤은 Phase 4)
        const visibleCount = Math.min(groups.length, maxVisibleItems);
        const dh = headerH + visibleCount * itemH + footerH;
        const dw = 300;
        const dx = (gw - dw) / 2;
        const dy = (gh - dh) / 2;

        // 오버레이
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
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
        box.fillStyle(0x1a2540, 1);
        box.lineStyle(2, 0xf1c40f, 1);   // 금색 테두리 (수집 이벤트)
        box.fillRoundedRect(dx, dy, dw, dh, 12);
        box.strokeRoundedRect(dx, dy, dw, dh, 12);
        box.setDepth(depthBase + 1);
        this.uiObjects.push(box);

        // 타이틀
        const titleText = this.scene.add.text(
            dx + dw / 2, dy + 20,
            '🎁 던전 클리어 보상', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '17px',
                color: '#f1c40f',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(titleText);

        // 서브
        const subText = this.scene.add.text(
            dx + dw / 2, dy + 50,
            '다음 블럭을 창고에 보관합니다', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#aaaaaa',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(subText);

        // 리스트
        const listStartY = dy + headerH;
        for (let i = 0; i < visibleCount; i++) {
            const g = groups[i];
            this._renderItemRow(dx, listStartY + i * itemH, dw, g, depthBase + 2);
        }

        // 초과분 요약 표시
        if (groups.length > maxVisibleItems) {
            const moreText = this.scene.add.text(
                dx + dw / 2, listStartY + visibleCount * itemH - 4,
                `… 외 ${groups.length - maxVisibleItems}종`, {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10px',
                    color: '#888888',
                }
            ).setOrigin(0.5, 0).setDepth(depthBase + 2);
            this.uiObjects.push(moreText);
        }

        // 확인 버튼
        const btnW = 160;
        const btnH = 40;
        const btnX = dx + (dw - btnW) / 2;
        const btnY = dy + dh - btnH - 18;

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x27ae60, 1);
        bg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
        bg.setDepth(depthBase + 2);
        this.uiObjects.push(bg);

        const label = this.scene.add.text(
            btnX + btnW / 2, btnY + btnH / 2,
            '확인', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '15px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 3);
        this.uiObjects.push(label);

        const zone = this.scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH);
        zone.setInteractive({ useHandCursor: true });
        zone.setDepth(depthBase + 4);
        zone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this._onConfirm(opts);
        });
        this.uiObjects.push(zone);
    }

    _renderItemRow(dx, y, dw, group, depth) {
        // 블럭 미니 타일
        const tileSize = 32;
        const tileX = dx + 24;

        const tileBg = this.scene.add.graphics();
        tileBg.fillStyle(group.blockType.color, 1);
        tileBg.fillRoundedRect(tileX, y, tileSize, tileSize, 4);
        tileBg.setDepth(depth);
        this.uiObjects.push(tileBg);

        const gradeText = this.scene.add.text(
            tileX + tileSize / 2, y + tileSize / 2,
            String(group.grade), {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depth + 1);
        this.uiObjects.push(gradeText);

        // 이름 + 등급
        const nameText = this.scene.add.text(
            tileX + tileSize + 14, y + 4,
            `${group.blockType.name} Lv.${group.grade}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setDepth(depth);
        this.uiObjects.push(nameText);

        // 개수 (우측)
        const countText = this.scene.add.text(
            dx + dw - 24, y + tileSize / 2,
            `×${group.count}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                color: '#f1c40f',
                fontStyle: 'bold',
            }
        ).setOrigin(1, 0.5).setDepth(depth);
        this.uiObjects.push(countText);
    }

    _onConfirm(opts) {
        const result = StorageManager.confirmPending();
        this._close(() => {
            if (opts.onConfirm) opts.onConfirm(result);
        });
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