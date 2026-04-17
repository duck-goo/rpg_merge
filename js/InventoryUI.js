/**
 * InventoryUI.js
 * 인벤토리 창 렌더링 + 인벤↔보드 드래그 처리
 * 창이 열릴 때만 Block 객체 생성, 닫힐 때 파괴
 */
class InventoryUI {
    /**
     * @param {Phaser.Scene} scene
     * @param {InventoryManager} invManager
     */
    constructor(scene, invManager) {
        this.scene = scene;
        this.invManager = invManager;

        this.isOpen = false;

        // 창 구성 요소
        this.overlay = null;
        this.panel = null;
        this.slotGraphics = null;
        this.countText = null;
        this.slotBlocks = [];
        this.slotPositions = [];

        // 선택 상태
        this.selectedSlot = -1;        // 현재 선택된 슬롯 인덱스
        this.selectionGraphics = null; // 선택 표시 테두리

        // 하단 삭제 버튼
        this.deleteBtnBg = null;
        this.deleteBtnText = null;
        this.deleteBtnZone = null;

        this._calculateLayout();
    }

    // ─── 레이아웃 ─────────────────────────────

    _calculateLayout() {
        const inv = CONFIG.INVENTORY;
        const { width: gw, height: gh } = this.scene.scale;

        this.cols = inv.COLS;
        this.cellSize = inv.CELL_SIZE;
        this.cellGap = inv.CELL_GAP;
        this.rows = Math.ceil(this.invManager.maxSlots / this.cols);

        // 패널 크기
        const padding = 12;
        this.panelW = this.cols * this.cellSize + (this.cols - 1) * this.cellGap + padding * 2;
        this.panelH = this.rows * this.cellSize + (this.rows - 1) * this.cellGap + padding * 2 + 40;

        // 패널 위치 (화면 중앙)
        this.panelX = (gw - this.panelW) / 2;
        this.panelY = (gh - this.panelH) / 2;

        // 각 슬롯 화면 좌표 계산
        this.slotPositions = [];
        for (let i = 0; i < this.invManager.maxSlots; i++) {
            const col = i % this.cols;
            const row = Math.floor(i / this.cols);
            const x = this.panelX + padding + col * (this.cellSize + this.cellGap) + this.cellSize / 2;
            const y = this.panelY + padding + 40 + row * (this.cellSize + this.cellGap) + this.cellSize / 2;
            this.slotPositions.push({ x, y });
        }
    }

    // ─── 창 열기/닫기 ─────────────────────────────

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;

        // 반투명 오버레이
        this.overlay = this.scene.add.graphics();
        this.overlay.fillStyle(CONFIG.COLORS.INV_OVERLAY, 0.7);
        this.overlay.fillRect(0, 0, gw, gh);
        this.overlay.setDepth(100);

        // 오버레이 클릭하면 창 닫기
        const overlayZone = this.scene.add.zone(gw / 2, gh / 2, gw, gh);
        overlayZone.setInteractive();
        overlayZone.setDepth(100);
        overlayZone.on('pointerdown', () => this.close());
        this.overlayZone = overlayZone;

        // 패널
        this.panel = this.scene.add.graphics();
        this.panel.fillStyle(CONFIG.COLORS.INV_PANEL, 1);
        this.panel.fillRoundedRect(this.panelX, this.panelY, this.panelW, this.panelH, 10);
        this.panel.setDepth(101);

        // 패널 클릭 차단 (오버레이 닫기 방지)
        const panelZone = this.scene.add.zone(
            this.panelX + this.panelW / 2,
            this.panelY + this.panelH / 2,
            this.panelW, this.panelH
        );
        panelZone.setInteractive();
        panelZone.setDepth(101);
        // 패널 내부 클릭은 오버레이로 전파 차단 (창 자동 닫힘 방지)
        panelZone.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
        });
        this.panelZone = panelZone;

        // 제목 + 카운트
        this.titleText = this.scene.add.text(
            this.panelX + this.panelW / 2, this.panelY + 10,
            '인벤토리', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(102);

        this.countText = this.scene.add.text(
            this.panelX + this.panelW / 2, this.panelY + 30,
            '', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#aaaaaa',
            }
        ).setOrigin(0.5, 0).setDepth(102);

        // 닫기 버튼
        this._createCloseButton();

        // 슬롯 배경
        this._drawSlotBackgrounds();

        // 블럭 생성
        this._createSlotBlocks();

        // 카운트 갱신
        this._updateCountText();

        // 하단 선택 삭제 버튼
        this._createDeleteButton();
    }

    close() {
        if (!this.isOpen) return;

        this.isOpen = false;

        // 선택 해제
        this._clearSelection();

        // 슬롯 블럭 파괴
        for (const block of this.slotBlocks) {
            if (block) block.destroy();
        }
        this.slotBlocks = [];

        // 삭제 버튼 파괴
        if (this.deleteBtnBg) { this.deleteBtnBg.destroy(); this.deleteBtnBg = null; }
        if (this.deleteBtnText) { this.deleteBtnText.destroy(); this.deleteBtnText = null; }
        if (this.deleteBtnZone) { this.deleteBtnZone.destroy(); this.deleteBtnZone = null; }

        // UI 요소 파괴
        if (this.overlay) { this.overlay.destroy(); this.overlay = null; }
        if (this.overlayZone) { this.overlayZone.destroy(); this.overlayZone = null; }
        if (this.panel) { this.panel.destroy(); this.panel = null; }
        if (this.panelZone) { this.panelZone.destroy(); this.panelZone = null; }
        if (this.titleText) { this.titleText.destroy(); this.titleText = null; }
        if (this.countText) { this.countText.destroy(); this.countText = null; }
        if (this.closeBtn) { this.closeBtn.destroy(); this.closeBtn = null; }
        if (this.closeBtnText) { this.closeBtnText.destroy(); this.closeBtnText = null; }
        if (this.closeBtnZone) { this.closeBtnZone.destroy(); this.closeBtnZone = null; }
        if (this.slotBgGraphics) { this.slotBgGraphics.destroy(); this.slotBgGraphics = null; }
    }
    // ─── 내부 그리기 ─────────────────────────────

    _createCloseButton() {
        const btnSize = 28;
        const bx = this.panelX + this.panelW - btnSize - 8;
        const by = this.panelY + 8;

        this.closeBtn = this.scene.add.graphics();
        this.closeBtn.fillStyle(0xc0392b, 1);
        this.closeBtn.fillRoundedRect(bx, by, btnSize, btnSize, 4);
        this.closeBtn.setDepth(102);

        this.closeBtnText = this.scene.add.text(bx + btnSize / 2, by + btnSize / 2, 'X', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(103);

        // 히트 존
        const closeZone = this.scene.add.zone(bx + btnSize / 2, by + btnSize / 2, btnSize, btnSize);
        closeZone.setInteractive({ useHandCursor: true });
        closeZone.setDepth(104);
        closeZone.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.close();
        });
        this.closeBtnZone = closeZone;
    }

    _drawSlotBackgrounds() {
        this.slotBgGraphics = this.scene.add.graphics();
        this.slotBgGraphics.setDepth(101);

        for (let i = 0; i < this.invManager.maxSlots; i++) {
            const pos = this.slotPositions[i];
            this.slotBgGraphics.fillStyle(CONFIG.COLORS.INV_SLOT_EMPTY, 1);
            this.slotBgGraphics.fillRoundedRect(
                pos.x - this.cellSize / 2,
                pos.y - this.cellSize / 2,
                this.cellSize, this.cellSize, 4
            );
        }
    }

    _createSlotBlocks() {
        this.slotBlocks = [];

        for (let i = 0; i < this.invManager.maxSlots; i++) {
            const data = this.invManager.items[i];
            if (data === null) {
                this.slotBlocks.push(null);
                continue;
            }

            const pos = this.slotPositions[i];
            const block = new Block(
                this.scene, pos.x, pos.y,
                this.cellSize - 4,
                data.blockType, data.grade
            );
            block.location = 'inventory';
            block.inventorySlot = i;
            block.setDepth(102);

            // ★ 핵심: Phaser 드래그 플러그인에서 완전 제거
            this.scene.input.setDraggable(block, false);

            // 탭 이벤트 (선택)
            block.off('pointerdown');
            block.on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                this._selectSlot(i);
            });

            this.slotBlocks.push(block);
        }
    }

    _updateCountText() {
        if (!this.countText) return;
        const used = this.invManager.getUsedCount();
        const max = this.invManager.maxSlots;
        this.countText.setText(`${used} / ${max}`);
    }

    // ─── 선택 및 삭제 버튼 ─────────────────────────────

    /**
     * 슬롯 선택 토글
     */
    _selectSlot(slotIndex) {
        // 같은 슬롯 다시 탭 → 선택 해제
        if (this.selectedSlot === slotIndex) {
            this._clearSelection();
            return;
        }

        this.selectedSlot = slotIndex;
        this._drawSelectionHighlight();
        this._updateDeleteButton();
    }

    _clearSelection() {
        this.selectedSlot = -1;
        if (this.selectionGraphics) {
            this.selectionGraphics.destroy();
            this.selectionGraphics = null;
        }
        this._updateDeleteButton();
    }

    /**
     * 선택된 슬롯에 노란 테두리 그리기
     */
    _drawSelectionHighlight() {
        if (this.selectionGraphics) {
            this.selectionGraphics.destroy();
            this.selectionGraphics = null;
        }

        if (this.selectedSlot < 0) return;

        const pos = this.slotPositions[this.selectedSlot];
        const g = this.scene.add.graphics();
        g.lineStyle(3, 0xf1c40f, 1);
        g.strokeRoundedRect(
            pos.x - this.cellSize / 2,
            pos.y - this.cellSize / 2,
            this.cellSize, this.cellSize, 4
        );
        g.setDepth(103);  // 슬롯 블럭(102)보다 위
        this.selectionGraphics = g;
    }

    /**
     * 하단 "선택 삭제" 버튼 생성 (open 시 1회)
     */
    _createDeleteButton() {
        const btnW = 120;
        const btnH = 32;
        const btnX = this.panelX + (this.panelW - btnW) / 2;
        const btnY = this.panelY + this.panelH - btnH - 12;

        this.deleteBtnBg = this.scene.add.graphics();
        this.deleteBtnBg.setDepth(102);

        this.deleteBtnText = this.scene.add.text(
            btnX + btnW / 2, btnY + btnH / 2,
            '선택 삭제',
            { fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#ffffff', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(103);

        const zone = this.scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH);
        zone.setInteractive({ useHandCursor: true });
        zone.setDepth(104);
        zone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this._executeDelete();
        });
        this.deleteBtnZone = zone;

        // 버튼 위치/크기 저장 (색상 갱신용)
        this._deleteBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };

        // 초기 상태 (비활성)
        this._updateDeleteButton();
    }

    /**
     * 삭제 버튼 활성/비활성 상태 갱신
     */
    _updateDeleteButton() {
        if (!this.deleteBtnBg || !this._deleteBtnRect) return;

        const { x, y, w, h } = this._deleteBtnRect;
        const enabled = this.selectedSlot >= 0;

        this.deleteBtnBg.clear();
        this.deleteBtnBg.fillStyle(enabled ? 0xc0392b : 0x555555, 1);
        this.deleteBtnBg.fillRoundedRect(x, y, w, h, 6);

        if (this.deleteBtnText) {
            this.deleteBtnText.setAlpha(enabled ? 1 : 0.5);
        }
    }

    /**
     * 삭제 실행 (선택된 슬롯)
     */
    _executeDelete() {
        if (this.selectedSlot < 0) return;

        const slotIndex = this.selectedSlot;
        const removed = this.invManager.removeItem(slotIndex);
        if (!removed) return;

        // 블럭 파괴
        const block = this.slotBlocks[slotIndex];
        if (block) {
            block.destroy();
            this.slotBlocks[slotIndex] = null;
        }

        // 선택 해제 및 UI 갱신
        this._clearSelection();
        this._updateCountText();

        console.log(`[Inventory] 삭제: ${removed.blockType.name} Lv${removed.grade}`);
    }

    // ─── 블럭 조회 (보드와 연계용) ─────────────────────────────

    /**
     * 화면 좌표가 인벤토리 창 내부인지
     */
    isInPanel(screenX, screenY) {
        return (
            this.isOpen &&
            screenX >= this.panelX && screenX <= this.panelX + this.panelW &&
            screenY >= this.panelY && screenY <= this.panelY + this.panelH
        );
    }

    /**
     * 인벤 블럭을 보드로 꺼낼 때: UI에서 제거 + 데이터에서 제거
     * @returns {object} 제거된 { blockType, grade }
     */
    popFromSlot(slotIndex) {
        const data = this.invManager.removeItem(slotIndex);

        // 슬롯 블럭은 이미 호출자가 참조 중이므로 배열에서만 제거
        this.slotBlocks[slotIndex] = null;
        this._updateCountText();

        return data;
    }
}