/**
 * TopHud.js
 * 로비 상단 HUD — 계정 레벨 + 자원 2줄 + 상점 버튼
 *
 * Phase 3-5 재설계:
 * - 페이지 이름 제거 (탭 강조로 구분 가능)
 * - 자원 6종을 2줄로 배치 (상: 골드/목재/석재, 하: 철/식량/보석)
 * - K/M 축약 표기로 큰 수치 대응
 * - 우측 끝 🛒 상점 버튼 명시
 *
 * 레이아웃 (width=360 기준):
 * ┌─────────────────────────────────────┐
 * │ Lv.3  │ 💰123K 🌲50 🪨30         🛒 │
 * │       │ ⛏️0   🍞50 💎0               │
 * └─────────────────────────────────────┘
 */
class TopHud {
    constructor(scene, area, callbacks = {}) {
        this.scene = scene;
        this.area = area;
        this.callbacks = callbacks;

        this.container = null;
        this.accountText = null;
        this.expBarBg = null;          // ★ 추가
        this.expBarFill = null;        // ★ 추가
        this._expBarRect = null;       // ★ 추가
        this.resourceLine1 = null;   // 골드 / 목재 / 석재
        this.resourceLine2 = null;   // 철 / 식량 / 보석
        this.shopBtnBg = null;
        this.shopBtnIcon = null;

        this.accountZone = null;
        this.resourceZone = null;
        this.shopZone = null;

        this._boundRefresh = null;

        this._build();
        this._bindEvents();
    }

    _build() {
        const { x, y, width, height } = this.area;

        this.container = this.scene.add.container(0, 0);

        // 배경
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x0f1626, 1);
        bg.fillRect(x, y, width, height);
        bg.lineStyle(1, 0x3a4559, 1);
        bg.lineBetween(x, y + height, x + width, y + height);
        this.container.add(bg);

        // ─── 좌측: 계정 레벨 + 경험치 바 (고정폭 64px) ───
        const accountW = 64;
        const accountCx = x + accountW / 2;

        // 레벨 텍스트 (약간 위로)
        const levelTextY = y + height * 0.38;
        this.accountText = this.scene.add.text(accountCx, levelTextY, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#f1c40f',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.container.add(this.accountText);

        // 경험치 바 배경
        const barW = 50;
        const barH = 4;
        const barX = accountCx - barW / 2;
        const barY = y + height * 0.68;

        this.expBarBg = this.scene.add.graphics();
        this.expBarBg.fillStyle(0x333333, 1);
        this.expBarBg.fillRoundedRect(barX, barY, barW, barH, 2);
        this.container.add(this.expBarBg);

        this.expBarFill = this.scene.add.graphics();
        this.container.add(this.expBarFill);
        this._expBarRect = { x: barX, y: barY, w: barW, h: barH };

        // 터치존 (레벨 + 바 전체 영역)
        const accountZone = this.scene.add.zone(accountCx, y + height / 2, accountW, height);
        accountZone.setInteractive({ useHandCursor: true });
        accountZone.on('pointerdown', () => {
            if (this.callbacks.onAccountTap) this.callbacks.onAccountTap();
        });
        this.accountZone = accountZone;
        this.container.add(accountZone);

        // 구분선 (계정/자원 영역)
        const dividerX = x + accountW;
        bg.lineStyle(1, 0x2a3448, 1);
        bg.lineBetween(dividerX, y + 6, dividerX, y + height - 6);

        // ─── 우측: 상점 버튼 (고정폭 40px) ───
        const shopW = 40;
        const shopCx = x + width - shopW / 2 - 4;
        const shopCy = y + height / 2;
        this._createShopButton(shopCx, shopCy);

        // ─── 중앙: 자원 2줄 ───
        // 자원 영역 = 계정 영역 끝 ~ 상점 버튼 시작 사이
        const resAreaX = dividerX + 4;
        const resAreaW = (shopCx - shopW / 2) - resAreaX - 4;

        // 상단 라인 Y, 하단 라인 Y
        const line1Y = y + height * 0.30;
        const line2Y = y + height * 0.70;
        const resCx = resAreaX + resAreaW / 2;

        this.resourceLine1 = this.scene.add.text(resCx, line1Y, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        this.container.add(this.resourceLine1);

        this.resourceLine2 = this.scene.add.text(resCx, line2Y, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        this.container.add(this.resourceLine2);

        // 자원 영역 터치존 (상점과 동일 동작)
        const resourceZone = this.scene.add.zone(resCx, y + height / 2, resAreaW, height);
        resourceZone.setInteractive({ useHandCursor: true });
        resourceZone.on('pointerdown', () => {
            if (this.callbacks.onResourcesTap) this.callbacks.onResourcesTap();
        });
        this.resourceZone = resourceZone;
        this.container.add(resourceZone);

        this.refresh();
    }

    _createShopButton(cx, cy) {
        const btnSize = 32;

        this.shopBtnBg = this.scene.add.graphics();
        this.shopBtnBg.fillStyle(0x27ae60, 1);
        this.shopBtnBg.lineStyle(1, 0x2ecc71, 1);
        this.shopBtnBg.fillRoundedRect(cx - btnSize / 2, cy - btnSize / 2, btnSize, btnSize, 5);
        this.shopBtnBg.strokeRoundedRect(cx - btnSize / 2, cy - btnSize / 2, btnSize, btnSize, 5);
        this.container.add(this.shopBtnBg);

        this.shopBtnIcon = this.scene.add.text(cx, cy, '🛒', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
        }).setOrigin(0.5);
        this.container.add(this.shopBtnIcon);

        const zone = this.scene.add.zone(cx, cy, btnSize + 6, btnSize + 6);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
            if (this.callbacks.onShopTap) this.callbacks.onShopTap();
        });
        this.shopZone = zone;
        this.container.add(zone);
    }

    _bindEvents() {
        this._boundRefresh = () => this.refresh();
        EventBus.on('resources:changed', this._boundRefresh);
        EventBus.on('account:changed', this._boundRefresh);
    }

    /**
     * 자원/계정 정보 갱신
     */
    refresh() {
        if (this.accountText) {
            this.accountText.setText(`Lv.${GameData.account.level}`);
        }

        // 경험치 진행바
        if (this.expBarFill && this._expBarRect) {
            const prog = (typeof RewardManager !== 'undefined')
                ? RewardManager.getExpProgress()
                : { percent: 0, isMax: false };

            const r = this._expBarRect;
            this.expBarFill.clear();

            const color = prog.isMax ? 0xf1c40f : 0x2ecc71;
            const pct = Math.max(0, Math.min(100, prog.percent));

            if (pct > 0) {
                this.expBarFill.fillStyle(color, 1);
                this.expBarFill.fillRoundedRect(r.x, r.y, r.w * (pct / 100), r.h, 2);
            }
        }

        const r = GameData.resources;
        const fmt = formatCompactNumber;

        if (this.resourceLine1) {
            this.resourceLine1.setText(
                `💰 ${fmt(r.gold)}   🌲 ${fmt(r.wood)}   🪨 ${fmt(r.stone)}`
            );
        }
        if (this.resourceLine2) {
            this.resourceLine2.setText(
                `⛏️ ${fmt(r.iron)}   🍞 ${fmt(r.food)}   💎 ${fmt(r.gem)}`
            );
        }
    }

    /**
     * (호환) 이전 API였던 setPageName은 이제 아무것도 하지 않음.
     * LobbyScene에서 호출해도 안전하도록 빈 구현 유지.
     */
    setPageName(_name) {
        // no-op (Phase 3-5: 페이지 이름 표시 제거)
    }

    destroy() {
        if (this._boundRefresh) {
            EventBus.off('resources:changed', this._boundRefresh);
            EventBus.off('account:changed', this._boundRefresh);
            this._boundRefresh = null;
        }
        this.container = null;
    }
}