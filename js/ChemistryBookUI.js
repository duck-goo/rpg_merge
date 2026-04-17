/**
 * ChemistryBookUI.js
 * 케미 도감 팝업
 * 등록된 모든 케미 조합을 재료+효과와 함께 표시
 */
class ChemistryBookUI {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;

        // UI 참조
        this.overlay = null;
        this.overlayZone = null;
        this.panel = null;
        this.panelZone = null;
        this.titleText = null;
        this.closeBtn = null;
        this.closeBtnText = null;
        this.closeBtnZone = null;
        this.entries = [];        // { bg, icons, nameText, effectText } 배열
        this.scrollContainer = null;

        this._calculateLayout();
    }

    // ─── 레이아웃 ─────────────────────────────

    _calculateLayout() {
        const { width: gw, height: gh } = this.scene.scale;

        // 패널 크기 (화면의 80% 너비, 70% 높이)
        this.panelW = Math.floor(gw * 0.88);
        this.panelH = Math.floor(gh * 0.75);
        this.panelX = (gw - this.panelW) / 2;
        this.panelY = (gh - this.panelH) / 2;

        // 항목 영역
        this.headerH = 40;             // 제목 영역
        this.entryH = 60;              // 각 케미 항목 높이
        this.entryPadding = 8;
        this.entryMarginX = 10;
    }

    // ─── 열기/닫기 ─────────────────────────────

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 100;

        // 오버레이
        this.overlay = this.scene.add.graphics();
        this.overlay.fillStyle(0x000000, 0.7);
        this.overlay.fillRect(0, 0, gw, gh);
        this.overlay.setDepth(depthBase);

        const overlayZone = this.scene.add.zone(gw / 2, gh / 2, gw, gh);
        overlayZone.setInteractive();
        overlayZone.setDepth(depthBase);
        overlayZone.on('pointerdown', () => this.close());
        this.overlayZone = overlayZone;

        // 패널
        this.panel = this.scene.add.graphics();
        this.panel.fillStyle(CONFIG.COLORS.INV_PANEL, 1);
        this.panel.fillRoundedRect(this.panelX, this.panelY, this.panelW, this.panelH, 10);
        this.panel.setDepth(depthBase + 1);

        const panelZone = this.scene.add.zone(
            this.panelX + this.panelW / 2,
            this.panelY + this.panelH / 2,
            this.panelW, this.panelH
        );
        panelZone.setInteractive();
        panelZone.setDepth(depthBase + 1);
        panelZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
        });
        this.panelZone = panelZone;

        // 제목
        this.titleText = this.scene.add.text(
            this.panelX + this.panelW / 2, this.panelY + 12,
            '케미 도감', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);

        // 닫기 버튼
        this._createCloseButton(depthBase);

        // 케미 항목들
        this._createEntries(depthBase);
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        // 항목 파괴
        for (const entry of this.entries) {
            if (entry.bg) entry.bg.destroy();
            if (entry.icons) {
                for (const icon of entry.icons) {
                    if (icon) icon.destroy();
                }
            }
            if (entry.arrowText) entry.arrowText.destroy();
            if (entry.nameText) entry.nameText.destroy();
            if (entry.effectText) entry.effectText.destroy();
        }
        this.entries = [];

        // 공통 UI 파괴
        const objs = [
            this.overlay, this.overlayZone,
            this.panel, this.panelZone,
            this.titleText,
            this.closeBtn, this.closeBtnText, this.closeBtnZone,
        ];
        for (const obj of objs) {
            if (obj) obj.destroy();
        }
        this.overlay = null;
        this.overlayZone = null;
        this.panel = null;
        this.panelZone = null;
        this.titleText = null;
        this.closeBtn = null;
        this.closeBtnText = null;
        this.closeBtnZone = null;
    }

    // ─── 내부 ─────────────────────────────

    _createCloseButton(depthBase) {
        const btnSize = 28;
        const bx = this.panelX + this.panelW - btnSize - 8;
        const by = this.panelY + 8;

        this.closeBtn = this.scene.add.graphics();
        this.closeBtn.fillStyle(0xc0392b, 1);
        this.closeBtn.fillRoundedRect(bx, by, btnSize, btnSize, 4);
        this.closeBtn.setDepth(depthBase + 2);

        this.closeBtnText = this.scene.add.text(bx + btnSize / 2, by + btnSize / 2, 'X', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(depthBase + 3);

        const zone = this.scene.add.zone(bx + btnSize / 2, by + btnSize / 2, btnSize, btnSize);
        zone.setInteractive({ useHandCursor: true });
        zone.setDepth(depthBase + 4);
        zone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this.close();
        });
        this.closeBtnZone = zone;
    }

    /**
     * 케미 항목들 생성
     */
    _createEntries(depthBase) {
        const recipes = CONFIG.CHEMISTRY;
        if (!recipes || recipes.length === 0) {
            this._createEmptyMessage(depthBase);
            return;
        }

        const entryStartY = this.panelY + this.headerH;
        const entryAvailW = this.panelW - this.entryMarginX * 2;

        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            const y = entryStartY + i * (this.entryH + this.entryPadding);
            const x = this.panelX + this.entryMarginX;

            const entry = this._createSingleEntry(recipe, x, y, entryAvailW, depthBase);
            this.entries.push(entry);
        }
    }

    /**
     * 단일 케미 항목 생성
     */
    _createSingleEntry(recipe, x, y, width, depthBase) {
        const entry = {
            bg: null,
            icons: [],
            arrowText: null,
            nameText: null,
            effectText: null,
        };

        // 배경
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x233554, 1);
        bg.fillRoundedRect(x, y, width, this.entryH, 6);
        bg.setDepth(depthBase + 2);
        entry.bg = bg;

        // 재료 블럭 미니 아이콘 (왼쪽)
        const iconSize = 36;
        const iconGap = 4;
        const iconStartX = x + 10;
        const iconY = y + this.entryH / 2;

        for (let j = 0; j < recipe.blocks.length; j++) {
            const blockKey = recipe.blocks[j];
            const blockType = this._findBlockType(blockKey);
            if (!blockType) continue;

            const ix = iconStartX + j * (iconSize + iconGap) + iconSize / 2;
            const icon = new Block(
                this.scene, ix, iconY,
                iconSize,
                blockType, 1      // Lv1로 표시 (등급 무관 케미이므로 대표값)
            );
            icon.disableInteractive();   // 클릭 불가
            this.scene.input.setDraggable(icon, false);
            icon.setDepth(depthBase + 3);
            entry.icons.push(icon);
        }

        // "+" 기호 사이에 넣고 싶으면 추후 개선. 지금은 생략.

        // 조합 이름 (오른쪽 상단)
        const textX = iconStartX + recipe.blocks.length * (iconSize + iconGap) + 16;
        entry.nameText = this.scene.add.text(
            textX, y + 10,
            recipe.name, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0, 0).setDepth(depthBase + 3);

        // 효과 설명 (오른쪽 하단)
        const effectLabel = this._formatEffect(recipe.effect);
        entry.effectText = this.scene.add.text(
            textX, y + 30,
            effectLabel, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#f1c40f',
                wordWrap: { width: width - (textX - x) - 10 },
            }
        ).setOrigin(0, 0).setDepth(depthBase + 3);

        return entry;
    }

    _createEmptyMessage(depthBase) {
        const y = this.panelY + this.panelH / 2;
        const text = this.scene.add.text(
            this.panelX + this.panelW / 2, y,
            '등록된 조합이 없습니다', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#888888',
            }
        ).setOrigin(0.5).setDepth(depthBase + 2);

        this.entries.push({ nameText: text });
    }

    // ─── 유틸리티 ─────────────────────────────

    /**
     * 블럭 key → blockType 객체 조회
     */
    _findBlockType(key) {
        const types = CONFIG.BLOCK.TYPES;
        for (const k in types) {
            if (types[k].key === key) {
                return types[k];
            }
        }
        console.warn(`[ChemistryBook] 알 수 없는 블럭 key: ${key}`);
        return null;
    }

    /**
     * effect 객체 → 사람이 읽는 문장
     */
    _formatEffect(effect) {
        if (!effect) return '';

        switch (effect.type) {
            case 'add_damage':
                return `데미지 +${effect.value}`;
            case 'mult_damage':
                return `데미지 ${effect.value}배`;
            case 'add_heal':
                return `회복 +${effect.value}`;
            case 'mult_heal':
                return `회복 ${effect.value}배`;
            default:
                return `알 수 없는 효과: ${effect.type}`;
        }
    }
}