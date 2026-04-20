/**
 * TopHud.js
 * 로비 상단 HUD — 계정 레벨 / 페이지 이름 / 자원 3종
 *
 * 책임:
 * - 3단 분할 레이아웃 렌더링
 * - EventBus 'resources:changed' / 'account:changed' 수신 시 자동 갱신
 * - 페이지 이름은 탭 전환 시 외부(LobbyScene)에서 setPageName() 호출
 *
 * 탭 가능한 영역:
 * - 좌측 (계정 레벨) → onAccountTap
 * - 우측 (자원 영역) → onResourcesTap (Phase 4에서 상점 팝업 연결)
 */
class TopHud {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} area - { x, y, width, height }
     * @param {object} callbacks - { onAccountTap, onResourcesTap }
     */
    constructor(scene, area, callbacks = {}) {
        this.scene = scene;
        this.area = area;
        this.callbacks = callbacks;

        this.container = null;
        this.accountText = null;
        this.pageNameText = null;
        this.resourceText = null;
        this.accountZone = null;
        this.resourceZone = null;

        this._boundRefresh = null;

        this._build();
        this._bindEvents();
    }

    _build() {
        const { x, y, width, height } = this.area;

        // 루트 컨테이너 (탭 전환과 무관하게 상시 표시)
        this.container = this.scene.add.container(0, 0);

        // 배경
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f1626, 1);
        bg.fillRect(x, y, width, height);
        // 하단 구분선
        bg.lineStyle(1, 0x3a4559, 1);
        bg.lineBetween(x, y + height, x + width, y + height);
        this.container.add(bg);

        // 3분할
        const colW = width / 3;
        const centerY = y + height / 2;

        // ─── 좌: 계정 레벨 ───
        this.accountText = this.scene.add.text(
            x + colW / 2, centerY,
            '', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#f1c40f',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5);
        this.container.add(this.accountText);

        const accountZone = this.scene.add.zone(x + colW / 2, centerY, colW, height);
        accountZone.setInteractive({ useHandCursor: true });
        accountZone.on('pointerdown', () => {
            if (this.callbacks.onAccountTap) this.callbacks.onAccountTap();
        });
        this.accountZone = accountZone;
        this.container.add(accountZone);

        // ─── 중: 페이지 이름 ───
        this.pageNameText = this.scene.add.text(
            x + width / 2, centerY,
            '', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5);
        this.container.add(this.pageNameText);

        // ─── 우: 자원 3종 ───
        this.resourceText = this.scene.add.text(
            x + colW * 2 + colW / 2, centerY,
            '', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#ffffff',
                align: 'center',
            }
        ).setOrigin(0.5);
        this.container.add(this.resourceText);

        const resourceZone = this.scene.add.zone(x + colW * 2 + colW / 2, centerY, colW, height);
        resourceZone.setInteractive({ useHandCursor: true });
        resourceZone.on('pointerdown', () => {
            if (this.callbacks.onResourcesTap) this.callbacks.onResourcesTap();
        });
        this.resourceZone = resourceZone;
        this.container.add(resourceZone);

        this.refresh();
    }

    _bindEvents() {
        this._boundRefresh = () => this.refresh();
        EventBus.on('resources:changed', this._boundRefresh);
        EventBus.on('account:changed', this._boundRefresh);
    }

    /**
     * 자원/계정 정보 갱신 (EventBus 또는 수동 호출)
     */
    refresh() {
        if (this.accountText) {
            this.accountText.setText(`Lv.${GameData.account.level}`);
        }

        if (this.resourceText) {
            const keys = CONFIG.RESOURCE_HUD_KEYS;
            const parts = keys.map(k => `${k.icon} ${GameData.resources[k.key]}`);
            this.resourceText.setText(parts.join('  '));
        }
    }

    /**
     * 페이지 이름 설정 (탭 전환 시 외부에서 호출)
     */
    setPageName(name) {
        if (this.pageNameText) {
            this.pageNameText.setText(name);
        }
    }

    destroy() {
        if (this._boundRefresh) {
            EventBus.off('resources:changed', this._boundRefresh);
            EventBus.off('account:changed', this._boundRefresh);
            this._boundRefresh = null;
        }
        // Phaser가 컨테이너 자식을 자동 파괴하므로 별도 파괴 호출 불필요
        this.container = null;
    }
}