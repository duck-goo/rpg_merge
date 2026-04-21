/**
 * StorageTab.js
 * 창고 탭 — 블럭 보관 + 분해 (Phase 3-10)
 *
 * 레이아웃:
 * - 상단: 조각 수량 3종 (영웅/장비/물약)
 * - 중앙: 카테고리 탭 (장비/물약/영웅)
 * - 그리드: 블럭 스택 (4열)
 *
 * 블럭 스택 탭 시 BlockDetailUI 오픈.
 */
class StorageTab {
    constructor(scene, area, callbacks = {}) {
        this.scene = scene;
        this.area = area;
        this.callbacks = callbacks;

        this.container = null;
        this.categoryTabs = [];   // { id, bgGraphics, labelText, zone }
        this.currentCategory = 'equip';

        this.fragmentTexts = {};  // { hero, equip, potion }
        this.itemObjects = [];    // 현재 렌더된 블럭 스택 객체들

        this.blockDetail = null;
        this._rewardDialog = null;    // ★ 추가

        this._boundOnStorageChanged = null;
        this._boundOnFragmentsChanged = null;

        this._build();
        this._bindEvents();
        this.hide();
    }

    _build() {
        this.container = this.scene.add.container(0, 0);

        const { x, y, width, height } = this.area;

        // ─── 상단: 조각 수량 바 ───
        this._renderFragmentBar(x, y);

        // ─── 카테고리 탭 ───
        this._renderCategoryTabs(x, y + 40);

        // ─── 그리드 영역 시작 y ───
        // (아이템 렌더링은 _refresh에서)
        this._gridStartY = y + 80;

        // 블럭 상세 팝업
        this.blockDetail = new BlockDetailUI(this.scene, (msg) => {
            if (this.callbacks.onShowToast) this.callbacks.onShowToast(msg);
        });

        this._refresh();
    }

    _renderFragmentBar(x, y) {
        const barH = 36;
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f1626, 1);
        bg.fillRect(x + 8, y + 4, this.area.width - 16, barH);
        bg.lineStyle(1, 0x3a4559, 1);
        bg.strokeRect(x + 8, y + 4, this.area.width - 16, barH);
        this.container.add(bg);

        const labels = [
            { key: 'hero',   icon: '👤', name: '영웅 조각' },
            { key: 'equip',  icon: '🗡️', name: '장비 조각' },
            { key: 'potion', icon: '🧪', name: '물약 조각' },
        ];

        const colW = (this.area.width - 16) / labels.length;
        for (let i = 0; i < labels.length; i++) {
            const l = labels[i];
            const cx = x + 8 + colW * i + colW / 2;
            const cy = y + 4 + barH / 2;

            const text = this.scene.add.text(
                cx, cy,
                '', {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12px',
                    color: '#ffffff',
                    align: 'center',
                }
            ).setOrigin(0.5);
            this.container.add(text);
            this.fragmentTexts[l.key] = { text, icon: l.icon };
        }

        this._updateFragmentBar();
    }

    _updateFragmentBar() {
        for (const key in this.fragmentTexts) {
            const entry = this.fragmentTexts[key];
            const count = StorageManager.getFragmentCount(key);
            entry.text.setText(`${entry.icon} ${formatCompactNumber(count)}`);
        }
    }

    _renderCategoryTabs(x, y) {
        const categories = [
            { id: 'equip',  label: '장비' },
            { id: 'potion', label: '물약' },
            { id: 'hero',   label: '영웅' },
        ];

        const tabW = 80;
        const tabH = 32;
        const gap = 8;
        const startX = x + 12;

        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            const bx = startX + i * (tabW + gap);

            const bgGraphics = this.scene.add.graphics();
            this.container.add(bgGraphics);

            const labelText = this.scene.add.text(
                bx + tabW / 2, y + tabH / 2,
                cat.label, {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '13px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                }
            ).setOrigin(0.5);
            this.container.add(labelText);

            const zone = this.scene.add.zone(bx + tabW / 2, y + tabH / 2, tabW, tabH);
            zone.setInteractive({ useHandCursor: true });
            zone.on('pointerdown', () => this._onCategoryTap(cat.id));
            this.container.add(zone);

            this.categoryTabs.push({
                id: cat.id,
                rect: { x: bx, y, w: tabW, h: tabH },
                bgGraphics, labelText, zone,
            });
        }

        // 총 개수 표시 (우측)
        this.totalCountText = this.scene.add.text(
            x + this.area.width - 12, y + tabH / 2,
            '', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#aaaaaa',
            }
        ).setOrigin(1, 0.5);
        this.container.add(this.totalCountText);

        this._applyCategoryActiveState();
    }

    _applyCategoryActiveState() {
        for (const tab of this.categoryTabs) {
            const active = tab.id === this.currentCategory;
            tab.bgGraphics.clear();
            tab.bgGraphics.fillStyle(active ? 0x2c3e50 : 0x1a2540, 1);
            tab.bgGraphics.lineStyle(1, active ? 0xf1c40f : 0x3a4559, 1);
            tab.bgGraphics.fillRoundedRect(tab.rect.x, tab.rect.y, tab.rect.w, tab.rect.h, 4);
            tab.bgGraphics.strokeRoundedRect(tab.rect.x, tab.rect.y, tab.rect.w, tab.rect.h, 4);
            tab.labelText.setColor(active ? '#f1c40f' : '#aaaaaa');
        }
    }

    _onCategoryTap(categoryId) {
        if (this.currentCategory === categoryId) return;
        this.currentCategory = categoryId;
        this._applyCategoryActiveState();
        this._refresh();
    }

    /**
     * 그리드 영역 렌더링 (아이템만 교체)
     */
    _refresh() {
        // 총 개수
        if (this.totalCountText) {
            const count = StorageManager.getCategoryCount(this.currentCategory);
            this.totalCountText.setText(`총 ${count}개`);
        }

        // 조각 바 갱신
        this._updateFragmentBar();

        // 기존 아이템 파괴
        for (const obj of this.itemObjects) {
            if (obj) obj.destroy();
        }
        this.itemObjects = [];

        // 그룹 조회
        const groups = StorageManager.getGroupedItems(this.currentCategory);

        if (groups.length === 0) {
            const emptyText = this.scene.add.text(
                this.area.x + this.area.width / 2,
                this._gridStartY + 40,
                '(보관된 블럭이 없습니다)', {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12px',
                    color: '#666666',
                }
            ).setOrigin(0.5);
            this.container.add(emptyText);
            this.itemObjects.push(emptyText);
            return;
        }

        // 그리드 렌더링 (4열)
        const cols = 4;
        const cellSize = 60;
        const gapX = 8;
        const gapY = 12;
        const gridW = cols * cellSize + (cols - 1) * gapX;
        const startX = this.area.x + (this.area.width - gridW) / 2;

        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const bx = startX + col * (cellSize + gapX);
            const by = this._gridStartY + row * (cellSize + gapY);

            const stack = this._createStackTile(g, bx, by, cellSize);
            this.itemObjects.push(...stack);
        }
    }

    /**
     * 블럭 스택 타일 (배경 + 등급 + 타입 약자 + 카운트)
     * @returns {Array} GameObjects
     */
    _createStackTile(group, bx, by, size) {
        const objects = [];

        // 배경 (블럭 색)
        const bg = this.scene.add.graphics();
        bg.fillStyle(group.blockType.color, 1);
        bg.fillRoundedRect(bx, by, size, size, 6);
        this.container.add(bg);
        objects.push(bg);

        // 등급 (중앙 크게)
        const gradeText = this.scene.add.text(
            bx + size / 2, by + size / 2 - 4,
            String(group.grade), {
                fontFamily: 'Arial, sans-serif',
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5);
        this.container.add(gradeText);
        objects.push(gradeText);

        // 타입 약자 (상단)
        const typeLetter = group.blockType.key.charAt(0).toUpperCase();
        const typeText = this.scene.add.text(
            bx + size / 2, by + 8,
            typeLetter, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#ffffff',
            }
        ).setOrigin(0.5, 0);
        this.container.add(typeText);
        objects.push(typeText);

        // 카운트 뱃지 (우하단)
        if (group.count > 1) {
            const badgeBg = this.scene.add.graphics();
            badgeBg.fillStyle(0x000000, 0.7);
            badgeBg.fillRoundedRect(bx + size - 24, by + size - 16, 22, 14, 3);
            this.container.add(badgeBg);
            objects.push(badgeBg);

            const countText = this.scene.add.text(
                bx + size - 13, by + size - 9,
                `×${group.count}`, {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                }
            ).setOrigin(0.5);
            this.container.add(countText);
            objects.push(countText);
        }

        // 터치존
        const zone = this.scene.add.zone(bx + size / 2, by + size / 2, size, size);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this._onTileTap(group));
        this.container.add(zone);
        objects.push(zone);

        return objects;
    }

    _onTileTap(group) {
        if (this.blockDetail) {
            this.blockDetail.open(group.blockType, group.grade);
        }
    }

    _bindEvents() {
        this._boundOnStorageChanged = () => this._refresh();
        this._boundOnFragmentsChanged = () => this._updateFragmentBar();
        EventBus.on('storage:changed', this._boundOnStorageChanged);
        EventBus.on('fragments:changed', this._boundOnFragmentsChanged);
    }

    show() {
        if (this.container) this.container.setVisible(true);
        this._refresh();   // 진입 시 최신 데이터

        // ★ 대기 중인 보상 블럭이 있으면 팝업
        this._checkPendingRewards();
    }

    _checkPendingRewards() {
        if (typeof StorageManager === 'undefined') return;
        if (!StorageManager.hasPending()) return;

        if (!this._rewardDialog) {
            this._rewardDialog = new RewardItemsDialog(this.scene);
        }

        this._rewardDialog.show({
            onConfirm: () => {
                // 확정 후 _refresh는 EventBus로 자동 트리거됨
            },
        });
    }

    hide() {
        if (this.blockDetail && this.blockDetail.isOpen) {
            this.blockDetail.close();
        }
        if (this._rewardDialog && this._rewardDialog.isOpen) {
            this._rewardDialog.destroy();
        }
        if (this.container) this.container.setVisible(false);
    }

    destroy() {
        if (this._boundOnStorageChanged) {
            EventBus.off('storage:changed', this._boundOnStorageChanged);
            this._boundOnStorageChanged = null;
        }
        if (this._boundOnFragmentsChanged) {
            EventBus.off('fragments:changed', this._boundOnFragmentsChanged);
            this._boundOnFragmentsChanged = null;
        }
        if (this.blockDetail) {
            this.blockDetail.destroy();
            this.blockDetail = null;
        }
        if (this._rewardDialog) {
            this._rewardDialog.destroy();
            this._rewardDialog = null;
        }
        this.container = null;
    }
}