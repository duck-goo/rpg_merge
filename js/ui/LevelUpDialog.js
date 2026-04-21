/**
 * LevelUpDialog.js
 * 레벨업 축하 팝업
 *
 * 표시 내용:
 * - "LEVEL UP" 타이틀
 * - Lv.oldLevel → Lv.newLevel
 * - 이번 레벨업으로 해금된 건물 목록
 * - 확인 버튼
 *
 * 사용:
 *   const dialog = new LevelUpDialog(scene);
 *   dialog.show({ oldLevel: 1, newLevel: 3, unlockedBuildings: ['lumberyard', 'quarry'] });
 */
class LevelUpDialog {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.uiObjects = [];
    }

    /**
     * 팝업 표시
     * @param {{ oldLevel, newLevel, unlockedBuildings }} data
     * @param {function} [onClose]
     */
    show(data, onClose) {
        if (this.isOpen) return;
        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 500;   // 최상위

        const unlocked = data.unlockedBuildings || [];
        const hasUnlocks = unlocked.length > 0;

        // 팝업 크기 (해금 건물 수에 따라 가변)
        const dw = 300;
        const baseH = 220;
        const perItemH = 26;
        const dh = baseH + (hasUnlocks ? (unlocked.length * perItemH + 40) : 0);
        const dx = (gw - dw) / 2;
        const dy = (gh - dh) / 2;

        // ─── 오버레이 ───
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

        // ─── 박스 (금색 테두리로 특별함 강조) ───
        const box = this.scene.add.graphics();
        box.fillStyle(0x1a2540, 1);
        box.lineStyle(3, 0xf1c40f, 1);
        box.fillRoundedRect(dx, dy, dw, dh, 12);
        box.strokeRoundedRect(dx, dy, dw, dh, 12);
        box.setDepth(depthBase + 1);
        this.uiObjects.push(box);

        // ─── 타이틀 ───
        const titleY = dy + 24;
        const title = this.scene.add.text(
            dx + dw / 2, titleY,
            '✨ LEVEL UP ✨',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '20px',
                color: '#f1c40f',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 2);
        this.uiObjects.push(title);

        // ─── 레벨 변화 ───
        const levelY = titleY + 44;
        const levelText = this.scene.add.text(
            dx + dw / 2, levelY,
            `Lv.${data.oldLevel}  →  Lv.${data.newLevel}`,
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 2);
        this.uiObjects.push(levelText);

        // ─── 구분선 ───
        const divLine = this.scene.add.graphics();
        divLine.lineStyle(1, 0x3a4559, 1);
        divLine.lineBetween(dx + 30, levelY + 30, dx + dw - 30, levelY + 30);
        divLine.setDepth(depthBase + 2);
        this.uiObjects.push(divLine);

        // ─── 해금 건물 영역 ───
        let nextY = levelY + 48;
        if (hasUnlocks) {
            const header = this.scene.add.text(
                dx + dw / 2, nextY,
                '🏗️ 새로 해금된 건물',
                {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '13px',
                    color: '#aaaaaa',
                }
            ).setOrigin(0.5).setDepth(depthBase + 2);
            this.uiObjects.push(header);
            nextY += 28;

            for (const id of unlocked) {
                const def = CONFIG.LOBBY_BUILDINGS.find(b => b.id === id);
                if (!def) continue;

                const itemText = this.scene.add.text(
                    dx + dw / 2, nextY,
                    `${def.icon}  ${def.name}`,
                    {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        color: '#2ecc71',
                        fontStyle: 'bold',
                    }
                ).setOrigin(0.5).setDepth(depthBase + 2);
                this.uiObjects.push(itemText);
                nextY += perItemH;
            }
            nextY += 10;
        } 
        
        // ─── 확인 버튼 ───
        const btnW = 140;
        const btnH = 42;
        const btnX = dx + (dw - btnW) / 2;
        const btnY = dy + dh - btnH - 20;

        const btnBg = this.scene.add.graphics();
        btnBg.fillStyle(0xf1c40f, 1);
        btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
        btnBg.setDepth(depthBase + 2);
        this.uiObjects.push(btnBg);

        const btnText = this.scene.add.text(
            btnX + btnW / 2, btnY + btnH / 2,
            '확인',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                color: '#1a2540',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 3);
        this.uiObjects.push(btnText);

        const btnZone = this.scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH);
        btnZone.setInteractive({ useHandCursor: true });
        btnZone.setDepth(depthBase + 4);
        btnZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this._close(onClose);
        });
        this.uiObjects.push(btnZone);
    }

    _close(onCloseCallback) {
        if (!this.isOpen) return;
        this.isOpen = false;
        for (const obj of this.uiObjects) {
            if (obj) obj.destroy();
        }
        this.uiObjects = [];
        if (onCloseCallback) onCloseCallback();
    }

    destroy() {
        this._close(null);
    }
}