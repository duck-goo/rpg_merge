/**
 * DungeonTab.js
 * 시안 1번 "던전(로비)" 탭 — 메인 탭
 *
 * 구성:
 * - 우측 상단: 퀘스트, 계정 정보, 설정, 도감 (세로 정렬)
 * - 중앙: 로비 일러스트 (플레이스홀더)
 * - 중하단: 던전 입장 버튼
 * - 하단: 던전 진행 정보 박스
 */
class DungeonTab {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} area - { x, y, width, height }
     * @param {object} callbacks - { onEnterDungeon, onShowToast }
     */
    constructor(scene, area, callbacks = {}) {
        this.scene = scene;
        this.area = area;
        this.callbacks = callbacks;
        
        this.container = null;
        this.progressText = null;
        this.foodText = null;   // ★ 추가
        this.progressBar = null;
        this._progressBarRect = null;
        
        this._boundRefreshProgress = null;
        
        this._build();
        this._bindEvents();
        this.hide();
    }

    _build() {
        const { x, y, width, height } = this.area;
        this.container = this.scene.add.container(0, 0);

        // ─── 중앙: 로비 일러스트 자리 ───
        const illustY = y + height * 0.28;
        const illust = this.scene.add.text(x + width / 2, illustY, '🏰', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '80px',
        }).setOrigin(0.5).setAlpha(0.5);
        this.container.add(illust);

        const illustLabel = this.scene.add.text(x + width / 2, illustY + 60, '로비 일러스트 (Phase 4)', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#666666',
        }).setOrigin(0.5);
        this.container.add(illustLabel);

        // ─── 우측 상단 4버튼 (세로) ───
        this._createRightSideButtons();

        // ─── 던전 입장 버튼 ───
        this._createEnterButton();

        // ─── 진행 정보 박스 ───
        this._createProgressBox();
    }

    _createRightSideButtons() {
        const { x, y, width } = this.area;

        const btnDefs = [
            { label: '퀘스트', id: 'quest' },
            { label: '계정', id: 'account' },
            { label: '설정', id: 'settings' },
            { label: '도감', id: 'book' },
        ];

        const btnW = 56;
        const btnH = 30;
        const gap = 8;
        const startX = x + width - btnW - 12;
        const startY = y + 12;

        for (let i = 0; i < btnDefs.length; i++) {
            const def = btnDefs[i];
            const bx = startX;
            const by = startY + i * (btnH + gap);

            const bg = this.scene.add.graphics();
            bg.fillStyle(0x233554, 1);
            bg.lineStyle(1, 0x5c6b8c, 1);
            bg.fillRoundedRect(bx, by, btnW, btnH, 4);
            bg.strokeRoundedRect(bx, by, btnW, btnH, 4);
            this.container.add(bg);

            const label = this.scene.add.text(bx + btnW / 2, by + btnH / 2, def.label, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#ffffff',
            }).setOrigin(0.5);
            this.container.add(label);

            const zone = this.scene.add.zone(bx + btnW / 2, by + btnH / 2, btnW, btnH);
            zone.setInteractive({ useHandCursor: true });
            zone.on('pointerdown', () => this._onSideButtonTap(def));
            this.container.add(zone);
        }
    }

    _onSideButtonTap(def) {
        const msgs = {
            quest:    '📜 퀘스트 (Phase 3-15에서 연결)',
            account:  '👤 계정 정보 (Phase 3-21에서 연결)',
            settings: '⚙️ 설정 (Phase 3-21에서 연결)',
            book:     '📚 도감 (Phase 3-16에서 연결)',
        };
        if (this.callbacks.onShowToast) {
            this.callbacks.onShowToast(msgs[def.id] || def.label);
        }
    }

    _createEnterButton() {
        const { x, y, width, height } = this.area;

        const btnW = 200;
        const btnH = 56;
        const bx = x + (width - btnW) / 2;
        const by = y + height * 0.55;

        // 배경 (둥근 직사각형으로, 시안의 육각형 느낌은 나중에)
        const bg = this.scene.add.graphics();
        bg.fillStyle(0xe67e22, 1);
        bg.lineStyle(2, 0xffc074, 1);
        bg.fillRoundedRect(bx, by, btnW, btnH, 12);
        bg.strokeRoundedRect(bx, by, btnW, btnH, 12);
        this.container.add(bg);

        const label = this.scene.add.text(bx + btnW / 2, by + btnH / 2, '던전 입장', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.container.add(label);

        const zone = this.scene.add.zone(bx + btnW / 2, by + btnH / 2, btnW, btnH);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
            if (this.callbacks.onEnterDungeon) this.callbacks.onEnterDungeon();
        });
        this.container.add(zone);
    }

    _createProgressBox() {
        const { x, y, width, height } = this.area;

        const boxW = width - 24;
        const boxH = 64;
        const bx = x + 12;
        const by = y + height - boxH - 12;

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x16213e, 1);
        bg.lineStyle(1, 0x5c6b8c, 1);
        bg.fillRoundedRect(bx, by, boxW, boxH, 8);
        bg.strokeRoundedRect(bx, by, boxW, boxH, 8);
        this.container.add(bg);

        // 제목
        this.progressText = this.scene.add.text(bx + 12, by + 10, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '13px',
            color: '#ffffff',
            fontStyle: 'bold',
        });
        this.container.add(this.progressText);

        // ★ 추가: 우측 상단에 식량 표시
        this.foodText = this.scene.add.text(bx + boxW - 12, by + 10, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#f39c12',
        }).setOrigin(1, 0);
        this.container.add(this.foodText);

        // 진행바 배경
        const barBgX = bx + 12;
        const barBgY = by + 36;
        const barBgW = boxW - 24;
        const barBgH = 14;

        const barBg = this.scene.add.graphics();
        barBg.fillStyle(0x333333, 1);
        barBg.fillRoundedRect(barBgX, barBgY, barBgW, barBgH, 4);
        this.container.add(barBg);

        this.progressBar = this.scene.add.graphics();
        this.container.add(this.progressBar);
        this._progressBarRect = { x: barBgX, y: barBgY, w: barBgW, h: barBgH };

        this._refreshProgress();
    }

    _refreshProgress() {
        if (!this.progressText || !this.progressBar) return;

        const cleared = GameData.stage.highestCleared;
        const total = CONFIG.STAGES.length;
        const percent = Math.min(100, Math.floor((cleared / total) * 100));

        const label = cleared === 0
            ? `첫 도전! (전체 ${total} 스테이지)`
            : `최고 기록: Stage ${cleared} / ${total}`;
        this.progressText.setText(label);

        const r = this._progressBarRect;
        this.progressBar.clear();
        if (percent > 0) {
            this.progressBar.fillStyle(0x27ae60, 1);
            this.progressBar.fillRoundedRect(r.x, r.y, r.w * (percent / 100), r.h, 4);
        }

        // ★ 추가: 식량 표시 갱신
        if (this.foodText) {
            const food = GameData.resources.food;
            const cost = CONFIG.DUNGEON_COST.FOOD_PER_ENTRY;
            const color = food >= cost ? '#f39c12' : '#e74c3c';
            this.foodText.setText(`🍞 ${food} (입장 ${cost})`);
            this.foodText.setColor(color);
        }
    }

    _bindEvents() {
        this._boundRefreshProgress = () => this._refreshProgress();
        EventBus.on('stage:cleared', this._boundRefreshProgress);
        // ★ 추가: 식량 수치 자동 갱신
        EventBus.on('resources:changed', this._boundRefreshProgress);
    }

    show() {
        if (this.container) this.container.setVisible(true);
        // 탭 재진입 시 진행 정보 최신화
        this._refreshProgress();
    }

    hide() {
        if (this.container) this.container.setVisible(false);
    }

    destroy() {
        if (this._boundRefreshProgress) {
            EventBus.off('stage:cleared', this._boundRefreshProgress);
            EventBus.off('resources:changed', this._boundRefreshProgress);   // ★ 추가
            this._boundRefreshProgress = null;
        }
        this.container = null;
    }
}