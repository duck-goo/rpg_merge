/**
 * BuildingDetailUI.js
 * 건물 상세 팝업 — 건설/레벨업 UI
 *
 * 흐름:
 * - open(id): 팝업 열기 + EventBus 구독 시작
 * - 내부 [액션 버튼] 탭: BuildingManager.build/levelUp 호출 → 결과 토스트 → 팝업 자동 갱신
 * - close(): EventBus 해제 + UI 파괴
 *
 * 외부에서 건물이 변경되어도 (치트 등) 자동으로 갱신됨.
 */
class BuildingDetailUI {
    /**
     * @param {Phaser.Scene} scene
     * @param {function} onShowToast - 결과 메시지 토스트 표시 콜백
     */
    constructor(scene, onShowToast) {
        this.scene = scene;
        this.onShowToast = onShowToast;

        this.isOpen = false;
        this.currentId = null;
        this.uiObjects = [];

        this._boundOnBuildingChanged = null;
        this._boundOnResourcesChanged = null;

        // Phase 3-7: 생산 수치 실시간 갱신 타이머
        this._productionTimer = null;

        // 재갱신 시에도 유지할 생산 UI 참조
        this._productionStockText = null;
        this._productionBar = null;
        this._productionBarRect = null;
        this._productionCollectBg = null;
        this._productionCollectText = null;
        this._productionCollectZone = null;
    }

    // ─── 열기/닫기 ─────────────────

    open(buildingId) {
        if (this.isOpen) this.close();

        const data = BuildingManager.getBuildingData(buildingId);
        if (!data) {
            console.warn(`[BuildingDetailUI] 정의되지 않은 건물: ${buildingId}`);
            return;
        }

        this.isOpen = true;
        this.currentId = buildingId;

        this._render(data);
        this._bindEvents();
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.currentId = null;

        this._stopProductionTimer();   // ★ 추가
        this._unbindEvents();
        this._destroyUI();
    }

    // ─── 렌더링 ─────────────────

    _render(data) {
        this._destroyUI();
        this._stopProductionTimer();

        const { width: gw, height: gh } = this.scene.scale;
        const pop = CONFIG.BUILDING_POPUP;
        const depthBase = 300;

        // 생산 건물이면 팝업 높이를 조금 늘림 (생산 영역 수용)
        const hasProduction = ProductionManager.hasProduction(this.currentId) && data.level > 0;
        const dw = pop.WIDTH;
        const dh = hasProduction ? pop.HEIGHT + 80 : pop.HEIGHT;
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

        // 아이콘
        const iconY = dy + 44;
        const iconText = this.scene.add.text(
            dx + dw / 2, iconY,
            data.def.icon, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '48px',
            }
        ).setOrigin(0.5).setDepth(depthBase + 2);
        this.uiObjects.push(iconText);

        // 이름
        const nameY = iconY + 40;
        const nameText = this.scene.add.text(
            dx + dw / 2, nameY,
            data.def.name, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 2);
        this.uiObjects.push(nameText);

        // 레벨
        const levelY = nameY + 22;
        const levelStr = data.level === 0
            ? '미건설'
            : `Lv.${data.level} / ${data.spec.maxLevel}`;
        const levelText = this.scene.add.text(
            dx + dw / 2, levelY,
            levelStr, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: '#f1c40f',
            }
        ).setOrigin(0.5).setDepth(depthBase + 2);
        this.uiObjects.push(levelText);

        this._drawDivider(dx + 20, levelY + 20, dw - 40, depthBase + 2);

        // 효과
        const effectLabelY = levelY + 32;

        const effectLabel = this.scene.add.text(
            dx + 20, effectLabelY,
            '효과', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#888888',
            }
        ).setDepth(depthBase + 2);
        this.uiObjects.push(effectLabel);

        // Phase 3-9: 패시브 건물이면 현재/다음 레벨 수치 추가
        let effectDisplay = data.spec.effect || '(효과 정보 없음)';
        const preview = (typeof PassiveManager !== 'undefined')
            ? PassiveManager.getEffectPreview(this.currentId)
            : null;
        if (preview) {
            effectDisplay += `\n${preview}`;
        }

        const effectText = this.scene.add.text(
            dx + 20, effectLabelY + 16,
            effectDisplay, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#ffffff',
                wordWrap: { width: dw - 40 },
                lineSpacing: 4,
            }
        ).setDepth(depthBase + 2);
        this.uiObjects.push(effectText);

        // ★ 생산 영역 (건설된 생산 건물만)
        let productionEndY = effectLabelY + (preview ? 78 : 58);
        if (hasProduction) {
            productionEndY = this._renderProductionSection(dx, productionEndY, dw, depthBase + 2);
            this._drawDivider(dx + 20, productionEndY, dw - 40, depthBase + 2);
            productionEndY += 12;
        }

        // 비용 구분선
        this._drawDivider(dx + 20, productionEndY, dw - 40, depthBase + 2);

        // 비용
        if (!data.isMaxLevel) {
            this._renderCost(data, dx, productionEndY + 12, dw, depthBase + 2);
        } else {
            const maxLabel = this.scene.add.text(
                dx + dw / 2, productionEndY + 32,
                '최대 레벨에 도달했습니다', {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '13px',
                    color: '#f39c12',
                }
            ).setOrigin(0.5).setDepth(depthBase + 2);
            this.uiObjects.push(maxLabel);
        }

        // 액션 버튼
        this._renderActionButton(data, dx, dy + dh - 56, dw, depthBase + 2);

        // ★ 타이머 시작
        if (hasProduction) {
            this._startProductionTimer();
        }
    }

    /**
     * 생산 영역 렌더링
     * @returns {number} 생산 영역 하단 y (다음 요소 시작점)
     */
    _renderProductionSection(dx, startY, dw, depth) {
        const stock = ProductionManager.getStock(this.currentId);
        const icons = { gold: '💰', wood: '🌲', stone: '🪨', iron: '⛏️', food: '🍞', gem: '💎' };
        const resIcon = icons[stock.resourceKey] || stock.resourceKey;

        // 라벨
        const label = this.scene.add.text(
            dx + 20, startY,
            '생산', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#888888',
            }
        ).setDepth(depth);
        this.uiObjects.push(label);

        // 시간당 속도
        const rateText = this.scene.add.text(
            dx + dw - 20, startY,
            `${resIcon} ${this._formatRate(stock.rate.perHour)}/시간`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#aaaaaa',
            }
        ).setOrigin(1, 0).setDepth(depth);
        this.uiObjects.push(rateText);

        // 재고 텍스트
        const stockY = startY + 20;
        this._productionStockText = this.scene.add.text(
            dx + 20, stockY,
            this._formatStockLine(stock), {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: stock.full ? '#e74c3c' : '#ffffff',
                fontStyle: 'bold',
            }
        ).setDepth(depth);
        this.uiObjects.push(this._productionStockText);

        // 진행바 배경
        const barY = stockY + 22;
        const barW = dw - 40;
        const barH = 10;
        const barBg = this.scene.add.graphics();
        barBg.fillStyle(0x333333, 1);
        barBg.fillRoundedRect(dx + 20, barY, barW, barH, 3);
        barBg.setDepth(depth);
        this.uiObjects.push(barBg);

        // 진행바 채움
        this._productionBar = this.scene.add.graphics();
        this._productionBar.setDepth(depth + 1);
        this._productionBarRect = { x: dx + 20, y: barY, w: barW, h: barH };
        this.uiObjects.push(this._productionBar);
        this._updateProductionBar(stock);

        // [수거] 버튼
        const btnY = barY + 20;
        const btnW = 120;
        const btnH = 34;
        const btnX = dx + (dw - btnW) / 2;

        this._productionCollectBg = this.scene.add.graphics();
        this._productionCollectBg.setDepth(depth);
        this.uiObjects.push(this._productionCollectBg);

        this._productionCollectText = this.scene.add.text(
            btnX + btnW / 2, btnY + btnH / 2,
            '', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depth + 1);
        this.uiObjects.push(this._productionCollectText);

        const collectZone = this.scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH);
        collectZone.setDepth(depth + 2);
        collectZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this._onCollectTap();
        });
        this._productionCollectZone = collectZone;
        this.uiObjects.push(collectZone);

        this._productionCollectRect = { x: btnX, y: btnY, w: btnW, h: btnH };
        this._updateCollectButton(stock);

        return btnY + btnH + 12;   // 다음 요소 시작 y
    }

    _updateProductionBar(stock) {
        if (!this._productionBar || !this._productionBarRect) return;
        const r = this._productionBarRect;
        const pct = Math.max(0, Math.min(100, stock.percent));

        this._productionBar.clear();
        const color = stock.full ? 0xe74c3c : 0x2ecc71;
        this._productionBar.fillStyle(color, 1);
        if (pct > 0) {
            this._productionBar.fillRoundedRect(r.x, r.y, r.w * (pct / 100), r.h, 3);
        }
    }

    _updateCollectButton(stock) {
        if (!this._productionCollectBg || !this._productionCollectRect || !this._productionCollectText) return;
        const r = this._productionCollectRect;
        const amount = Math.floor(stock.current);
        const enabled = amount > 0;

        this._productionCollectBg.clear();
        this._productionCollectBg.fillStyle(enabled ? 0x27ae60 : 0x555555, 1);
        this._productionCollectBg.fillRoundedRect(r.x, r.y, r.w, r.h, 5);

        this._productionCollectText.setText(
            enabled ? `수거 +${formatCompactNumber(amount)}` : '수거할 재고 없음'
        );
        this._productionCollectText.setColor(enabled ? '#ffffff' : '#aaaaaa');

        if (this._productionCollectZone) {
            if (enabled) this._productionCollectZone.setInteractive({ useHandCursor: true });
            else this._productionCollectZone.disableInteractive();
        }
    }

    _formatStockLine(stock) {
        const cur = Math.floor(stock.current);
        const cap = stock.cap;
        return `재고 ${formatCompactNumber(cur)} / ${formatCompactNumber(cap)}` +
               (stock.full ? '  (가득 참)' : '');
    }

    _formatRate(perHour) {
        if (perHour < 1) return perHour.toFixed(1);
        return formatCompactNumber(perHour);
    }

    _onCollectTap() {
        const result = ProductionManager.collect(this.currentId);
        if (result.success) {
            const icons = { gold: '💰', wood: '🌲', stone: '🪨', iron: '⛏️', food: '🍞', gem: '💎' };
            const icon = icons[result.resourceKey] || result.resourceKey;
            this._toast(`${icon} +${formatCompactNumber(result.amount)} 수거 완료`);
            // 팝업 유지: 재고 리셋된 상태로 계속 보여줌
            // EventBus 'building:changed'가 _refresh 호출 → 자동 갱신
        } else {
            this._toast(`❌ ${result.reason || '수거 실패'}`);
        }
    }

    /**
     * 1초마다 생산 수치 갱신
     */
    _startProductionTimer() {
        this._stopProductionTimer();
        if (!this.scene || !this.currentId) return;

        this._productionTimer = this.scene.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => this._tickProduction(),
        });
    }

    _stopProductionTimer() {
        if (this._productionTimer) {
            this._productionTimer.remove();
            this._productionTimer = null;
        }
    }

    _tickProduction() {
        if (!this.isOpen || !this.currentId) return;
        if (!ProductionManager.hasProduction(this.currentId)) return;

        const stock = ProductionManager.getStock(this.currentId);

        if (this._productionStockText) {
            this._productionStockText.setText(this._formatStockLine(stock));
            this._productionStockText.setColor(stock.full ? '#e74c3c' : '#ffffff');
        }
        this._updateProductionBar(stock);
        this._updateCollectButton(stock);
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

    _renderCost(data, dx, startY, dw, depth) {
        const cost = data.nextCost || {};
        const icons = { gold: '💰', wood: '🌲', stone: '🪨', iron: '⛏️', food: '🍞', gem: '💎' };

        // "다음 레벨 비용" 라벨
        const label = this.scene.add.text(
            dx + 20, startY,
            '다음 레벨 비용', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#888888',
            }
        ).setDepth(depth);
        this.uiObjects.push(label);

        // 비용 항목 나열
        const keys = Object.keys(cost);
        const lineY = startY + 22;

        if (keys.length === 0) {
            const noneText = this.scene.add.text(
                dx + 20, lineY,
                '(비용 없음)', {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12px',
                    color: '#aaaaaa',
                }
            ).setDepth(depth);
            this.uiObjects.push(noneText);
        } else {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const required = cost[key];
                const have = GameData.resources[key] || 0;
                const ok = have >= required;

                const y = lineY + i * 20;
                const icon = icons[key] || key;
                const color = ok ? '#2ecc71' : '#e74c3c';
                const mark = ok ? '✓' : '✗';

                const line = this.scene.add.text(
                    dx + 20, y,
                    `${icon} ${formatCompactNumber(required)}  (보유 ${formatCompactNumber(have)}) ${mark}`,
                    {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '13px',
                        color: color,
                    }
                ).setDepth(depth);
                this.uiObjects.push(line);
            }
        }

        // 계정 레벨 요구사항 (비용 아래)
        const acctY = lineY + keys.length * 20 + 10;
        const acctOk = data.accountLevelOK;
        const acctColor = acctOk ? '#2ecc71' : '#e74c3c';
        const acctMark = acctOk ? '✓' : '✗';
        const acctLine = this.scene.add.text(
            dx + 20, acctY,
            `계정 Lv.${data.requiredAccountLevel} 필요  (현재 Lv.${GameData.account.level}) ${acctMark}`,
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: acctColor,
            }
        ).setDepth(depth);
        this.uiObjects.push(acctLine);
    }

    _renderActionButton(data, dx, y, dw, depth) {
        const btnW = 200;
        const btnH = 44;
        const bx = dx + (dw - btnW) / 2;

        let label;
        let color;
        let enabled;

        if (data.isMaxLevel) {
            label = '최대 레벨';
            color = 0x555555;
            enabled = false;
        } else if (!data.accountLevelOK) {
            label = `Lv.${data.requiredAccountLevel} 필요`;
            color = 0x555555;
            enabled = false;
        } else if (!data.canAfford) {
            label = data.level === 0 ? '건설 (자원 부족)' : '레벨업 (자원 부족)';
            color = 0x555555;
            enabled = false;
        } else {
            label = data.level === 0 ? '건설' : '레벨업';
            color = 0x27ae60;
            enabled = true;
        }

        const bg = this.scene.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(bx, y, btnW, btnH, 6);
        bg.setDepth(depth);
        this.uiObjects.push(bg);

        const text = this.scene.add.text(bx + btnW / 2, y + btnH / 2, label, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '15px',
            color: enabled ? '#ffffff' : '#aaaaaa',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(depth + 1);
        this.uiObjects.push(text);

        if (enabled) {
            const zone = this.scene.add.zone(bx + btnW / 2, y + btnH / 2, btnW, btnH);
            zone.setInteractive({ useHandCursor: true });
            zone.setDepth(depth + 2);
            zone.on('pointerdown', (pointer, lx, ly, event) => {
                event.stopPropagation();
                this._onActionTap(data);
            });
            this.uiObjects.push(zone);
        }
    }

    _onActionTap(data) {
        const isBuild = data.level === 0;
        const buildingName = data.def.name;
        const buildingIcon = data.def.icon;

        const result = isBuild
            ? BuildingManager.build(this.currentId)
            : BuildingManager.levelUp(this.currentId);

        if (result.success) {
            const verb = isBuild ? '건설' : '레벨업';
            // 1. 팝업 닫기 (자원 변경 이벤트가 _refresh를 호출하기 전에 닫아야 깜빡임 없음)
            this.close();
            // 2. 마을 화면에서 결과 확인하도록 토스트
            this._toast(`${buildingIcon} ${buildingName} ${verb} 완료! → Lv.${result.newLevel}`);
        } else {
            // 실패는 팝업 유지 (사용자가 원인 파악하고 재시도 가능하도록)
            this._toast(`❌ ${result.reason || '실패'}`);
        }
    }

    _toast(msg) {
        if (this.onShowToast) this.onShowToast(msg);
    }

    // ─── 이벤트 ─────────────────

    _bindEvents() {
        this._boundOnBuildingChanged = (payload) => {
            // 현재 열린 건물이 변경되었을 때만 다시 렌더
            if (!this.isOpen) return;
            if (payload && payload.id && payload.id !== this.currentId) return;
            this._refresh();
        };
        this._boundOnResourcesChanged = () => {
            if (!this.isOpen) return;
            this._refresh();
        };

        EventBus.on('building:changed', this._boundOnBuildingChanged);
        EventBus.on('resources:changed', this._boundOnResourcesChanged);
        EventBus.on('account:changed', this._boundOnResourcesChanged);
    }

    _unbindEvents() {
        if (this._boundOnBuildingChanged) {
            EventBus.off('building:changed', this._boundOnBuildingChanged);
            this._boundOnBuildingChanged = null;
        }
        if (this._boundOnResourcesChanged) {
            EventBus.off('resources:changed', this._boundOnResourcesChanged);
            EventBus.off('account:changed', this._boundOnResourcesChanged);
            this._boundOnResourcesChanged = null;
        }
    }

    _refresh() {
        if (!this.isOpen || !this.currentId) return;
        const data = BuildingManager.getBuildingData(this.currentId);
        if (!data) {
            this.close();
            return;
        }
        this._render(data);
    }

    // ─── UI 파괴 ─────────────────

    _destroyUI() {
        for (const obj of this.uiObjects) {
            if (obj) obj.destroy();
        }
        this.uiObjects = [];
    }

    /**
     * 외부에서 완전 파괴 (씬 종료 등)
     */
    destroy() {
        this.close();
    }
}