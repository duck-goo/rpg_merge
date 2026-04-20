/**
 * TabBar.js
 * 로비 하단 5탭 내비게이션
 *
 * 책임:
 * - 5개 탭 렌더링 (아이콘 + 라벨)
 * - 현재 선택 탭 시각 강조
 * - 탭 터치 시 onTabChange 콜백 호출
 *
 * 탭 ID는 CONFIG.TABS 기준.
 */
class TabBar {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} area - { x, y, width, height }
     * @param {function} onTabChange - (tabId) => void
     */
    constructor(scene, area, onTabChange) {
        this.scene = scene;
        this.area = area;
        this.onTabChange = onTabChange;

        this.tabs = CONFIG.TABS;
        this.currentTabId = CONFIG.DEFAULT_TAB_ID;

        this.container = null;
        this.tabVisuals = [];   // { id, bg, icon, label, zone }

        this._build();
    }

    _build() {
        const { x, y, width, height } = this.area;
        this.container = this.scene.add.container(0, 0);

        // 배경
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f1626, 1);
        bg.fillRect(x, y, width, height);
        // 상단 구분선
        bg.lineStyle(1, 0x3a4559, 1);
        bg.lineBetween(x, y, x + width, y);
        this.container.add(bg);

        // 탭 셀
        const tabW = width / this.tabs.length;

        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const cx = x + tabW * i + tabW / 2;
            const cy = y + height / 2;

            // 탭 배경 (선택 상태 표시용)
            const tabBg = this.scene.add.graphics();
            this.container.add(tabBg);

            // 아이콘
            const icon = this.scene.add.text(cx, cy - 8, tab.icon, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '20px',
            }).setOrigin(0.5);
            this.container.add(icon);

            // 라벨
            const label = this.scene.add.text(cx, cy + 16, tab.label, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#ffffff',
            }).setOrigin(0.5);
            this.container.add(label);

            // 히트존 (탭 전체 영역)
            const zone = this.scene.add.zone(cx, cy, tabW, height);
            zone.setInteractive({ useHandCursor: true });
            zone.on('pointerdown', () => this._onTabTap(tab.id));
            this.container.add(zone);

            this.tabVisuals.push({
                id: tab.id,
                bg: tabBg,
                bgRect: { x: x + tabW * i, y, w: tabW, h: height },
                icon,
                label,
                zone,
            });
        }

        this._applyActiveState();
    }

    _onTabTap(tabId) {
        if (tabId === this.currentTabId) return;   // 같은 탭 재탭은 무시
        this.currentTabId = tabId;
        this._applyActiveState();
        if (this.onTabChange) this.onTabChange(tabId);
    }

    /**
     * 외부에서 탭 강제 변경 (예: 초기 진입)
     */
    setActive(tabId) {
        if (tabId === this.currentTabId) return;
        this.currentTabId = tabId;
        this._applyActiveState();
    }

    /**
     * 시각 갱신 — 활성 탭은 배경색/라벨색 강조
     */
    _applyActiveState() {
        for (const tv of this.tabVisuals) {
            const isActive = tv.id === this.currentTabId;

            tv.bg.clear();
            if (isActive) {
                tv.bg.fillStyle(0x233554, 1);
                tv.bg.fillRect(tv.bgRect.x, tv.bgRect.y, tv.bgRect.w, tv.bgRect.h);
                // 활성 표시 상단 띠
                tv.bg.fillStyle(0xf1c40f, 1);
                tv.bg.fillRect(tv.bgRect.x, tv.bgRect.y, tv.bgRect.w, 3);
                tv.label.setColor('#f1c40f');
            } else {
                tv.label.setColor('#888888');
            }
        }
    }

    destroy() {
        this.container = null;
        this.tabVisuals = [];
    }
}