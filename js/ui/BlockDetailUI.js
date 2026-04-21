/**
 * BlockDetailUI.js
 * 창고 블럭 상세 + 분해 팝업 (시안 5 기반)
 *
 * 사용:
 *   const dialog = new BlockDetailUI(scene, onShowToast);
 *   dialog.open(blockType, grade);
 *
 * 분해 후 해당 블럭이 0개가 되면 팝업 자동 닫힘.
 */
class BlockDetailUI {
    constructor(scene, onShowToast) {
        this.scene = scene;
        this.onShowToast = onShowToast;

        this.isOpen = false;
        this.currentType = null;
        this.currentGrade = 0;
        this.uiObjects = [];

        this._boundOnStorageChanged = null;
    }

    open(blockType, grade) {
        if (this.isOpen) this.close();
        if (!blockType) return;

        this.isOpen = true;
        this.currentType = blockType;
        this.currentGrade = grade;

        this._render();
        this._bindEvents();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.currentType = null;
        this.currentGrade = 0;

        this._unbindEvents();
        this._destroyUI();
    }

    _render() {
        this._destroyUI();

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 320;

        const dw = 300;
        const dh = 340;
        const dx = (gw - dw) / 2;
        const dy = (gh - dh) / 2;

        // 오버레이
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, gw, gh);
        overlay.setDepth(depthBase);
        this.uiObjects.push(overlay);

        const overlayZone = this.scene.add.zone(gw / 2, gh / 2, gw, gh);
        overlayZone.setInteractive();
        overlayZone.setDepth(depthBase);
        overlayZone.on('pointerdown', () => this.close());
        this.uiObjects.push(overlayZone);

        // 박스
        const box = this.scene.add.graphics();
        box.fillStyle(0x16213e, 1);
        box.lineStyle(2, 0x5c6b8c, 1);
        box.fillRoundedRect(dx, dy, dw, dh, 10);
        box.strokeRoundedRect(dx, dy, dw, dh, 10);
        box.setDepth(depthBase + 1);
        this.uiObjects.push(box);

        const boxZone = this.scene.add.zone(gw / 2, gh / 2, dw, dh);
        boxZone.setInteractive();
        boxZone.setDepth(depthBase + 1);
        boxZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
        });
        this.uiObjects.push(boxZone);

        this._createCloseButton(dx, dy, dw, depthBase);

        // 블럭 미니 미리보기 (좌상단)
        const miniSize = 64;
        const miniX = dx + 30;
        const miniY = dy + 30;
        const miniBg = this.scene.add.graphics();
        miniBg.fillStyle(this.currentType.color, 1);
        miniBg.fillRoundedRect(miniX, miniY, miniSize, miniSize, 6);
        miniBg.setDepth(depthBase + 2);
        this.uiObjects.push(miniBg);

        const miniGrade = this.scene.add.text(
            miniX + miniSize / 2, miniY + miniSize / 2,
            String(this.currentGrade), {
                fontFamily: 'Arial, sans-serif',
                fontSize: '28px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 3);
        this.uiObjects.push(miniGrade);

        // 이름 + 등급 (우상단)
        const infoX = miniX + miniSize + 16;
        const nameText = this.scene.add.text(
            infoX, miniY + 8,
            this.currentType.name, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setDepth(depthBase + 2);
        this.uiObjects.push(nameText);

        const gradeText = this.scene.add.text(
            infoX, miniY + 34,
            `Lv.${this.currentGrade}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#f1c40f',
            }
        ).setDepth(depthBase + 2);
        this.uiObjects.push(gradeText);

        // 구분선
        this._drawDivider(dx + 20, miniY + miniSize + 20, dw - 40, depthBase + 2);

        // 설명
        const descY = miniY + miniSize + 36;
        const descLabel = this.scene.add.text(
            dx + 20, descY,
            '설명', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#888888',
            }
        ).setDepth(depthBase + 2);
        this.uiObjects.push(descLabel);

        const descText = this.scene.add.text(
            dx + 20, descY + 18,
            this._getDescription(), {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: '#ffffff',
                wordWrap: { width: dw - 40 },
                lineSpacing: 4,
            }
        ).setDepth(depthBase + 2);
        this.uiObjects.push(descText);

        // 보유 수량
        const countY = descY + 80;
        this._drawDivider(dx + 20, countY, dw - 40, depthBase + 2);

        const group = StorageManager.getGroupedItems().find(
            g => g.blockType.key === this.currentType.key && g.grade === this.currentGrade
        );
        const count = group ? group.count : 0;

        const countText = this.scene.add.text(
            dx + 20, countY + 12,
            `보유 ${count}개`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setDepth(depthBase + 2);
        this.uiObjects.push(countText);

        // 분해 버튼
        this._renderDismantleButton(dx, dy + dh - 60, dw, count, depthBase + 2);
    }

    _renderDismantleButton(dx, y, dw, count, depth) {
        const btnW = 220;
        const btnH = 44;
        const bx = dx + (dw - btnW) / 2;

        const fragmentKey = StorageManager.BLOCK_TO_FRAGMENT[this.currentType.key];
        const yield_ = StorageManager.FRAGMENT_YIELD[this.currentGrade] || 0;
        const canDismantle = count > 0 && fragmentKey && yield_ > 0;

        // 영웅 블럭은 Phase 3-12에서 연결 예정 → 분해 불가
        const isHero = this.currentType.key === 'hero';

        const bg = this.scene.add.graphics();
        const color = (isHero || !canDismantle) ? 0x555555 : 0xe67e22;
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(bx, y, btnW, btnH, 8);
        bg.setDepth(depth);
        this.uiObjects.push(bg);

        let label;
        if (isHero) {
            label = '영웅 분해 (Phase 3-12에서 연결)';
        } else if (!canDismantle) {
            label = '분해 불가';
        } else {
            const fragLabel = this._fragmentLabel(fragmentKey);
            label = `분해 (+${yield_} ${fragLabel})`;
        }

        const text = this.scene.add.text(bx + btnW / 2, y + btnH / 2, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: (isHero || !canDismantle) ? '#aaaaaa' : '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(depth + 1);
        this.uiObjects.push(text);

        if (!isHero && canDismantle) {
            const zone = this.scene.add.zone(bx + btnW / 2, y + btnH / 2, btnW, btnH);
            zone.setInteractive({ useHandCursor: true });
            zone.setDepth(depth + 2);
            zone.on('pointerdown', (pointer, lx, ly, event) => {
                event.stopPropagation();
                this._onDismantleTap();
            });
            this.uiObjects.push(zone);
        }
    }

    _onDismantleTap() {
        const result = StorageManager.dismantle(this.currentType.key, this.currentGrade);
        if (!result.success) {
            this._toast(`❌ ${result.reason || '분해 실패'}`);
            return;
        }

        const fragLabel = this._fragmentLabel(result.fragmentKey);
        this._toast(`🔧 ${fragLabel} +${result.amount} 획득`);

        // 남은 개수 0이면 팝업 자동 닫기
        if (result.remaining <= 0) {
            this.close();
        }
        // EventBus로 자동 _refresh 호출
    }

    _getDescription() {
        const key = this.currentType.key;
        switch (key) {
            case 'hero':
                return '영웅 블럭입니다. 분해 시 영웅 조각을 획득하여 영웅 소환에 사용할 수 있습니다. (Phase 3-12 예정)';
            case 'equip':
                return '장비 블럭입니다. 영웅 승급 분기에 사용되며, 분해 시 장비 조각을 획득하여 장비 제작에 사용할 수 있습니다.';
            case 'potion_hp':
                return 'HP 물약 블럭입니다. 분해 시 물약 조각을 획득합니다.';
            case 'potion_mp':
                return 'MP 물약 블럭입니다. 분해 시 물약 조각을 획득합니다.';
            default:
                return '(설명 없음)';
        }
    }

    _fragmentLabel(key) {
        const labels = { hero: '영웅 조각', equip: '장비 조각', potion: '물약 조각' };
        return labels[key] || key;
    }

    _drawDivider(x, y, w, depth) {
        const line = this.scene.add.graphics();
        line.lineStyle(1, 0x3a4559, 1);
        line.lineBetween(x, y, x + w, y);
        line.setDepth(depth);
        this.uiObjects.push(line);
    }

    _createCloseButton(dx, dy, dw, depthBase) {
        const btnSize = 28;
        const bx = dx + dw - btnSize - 8;
        const by = dy + 8;

        const bg = this.scene.add.graphics();
        bg.fillStyle(0xc0392b, 1);
        bg.fillRoundedRect(bx, by, btnSize, btnSize, 4);
        bg.setDepth(depthBase + 2);
        this.uiObjects.push(bg);

        const text = this.scene.add.text(bx + btnSize / 2, by + btnSize / 2, 'X', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(depthBase + 3);
        this.uiObjects.push(text);

        const zone = this.scene.add.zone(bx + btnSize / 2, by + btnSize / 2, btnSize, btnSize);
        zone.setInteractive({ useHandCursor: true });
        zone.setDepth(depthBase + 4);
        zone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this.close();
        });
        this.uiObjects.push(zone);
    }

    _bindEvents() {
        this._boundOnStorageChanged = () => {
            if (!this.isOpen) return;
            this._render();
        };
        EventBus.on('storage:changed', this._boundOnStorageChanged);
    }

    _unbindEvents() {
        if (this._boundOnStorageChanged) {
            EventBus.off('storage:changed', this._boundOnStorageChanged);
            this._boundOnStorageChanged = null;
        }
    }

    _destroyUI() {
        for (const obj of this.uiObjects) {
            if (obj) obj.destroy();
        }
        this.uiObjects = [];
    }

    _toast(msg) {
        if (this.onShowToast) this.onShowToast(msg);
    }

    destroy() {
        this.close();
    }
}