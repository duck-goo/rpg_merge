/**
 * ProductionManager.js
 * 생산 건물 시간 누적 계산 + 수거
 *
 * 저장 방식:
 * - producedAt: "마지막으로 재고 계산이 기준된 시각 (ms)"
 *   → 건설/수거/레벨업/상한도달 시 갱신
 * - stock은 저장하지 않음 (계산 가능한 파생값)
 *
 * 계산 공식:
 * - perMs  = basePerHour × level / 3,600,000
 * - cap    = baseCap × level
 * - stock  = min(cap, (now - producedAt) × perMs)
 */
const ProductionManager = {
    MS_PER_HOUR: 60 * 60 * 1000,

    // ─── 조회 ────────────────────

    /**
     * 건물이 생산 기능을 가지는지
     */
    hasProduction(id) {
        const spec = BuildingManager.getSpec(id);
        return !!(spec && spec.production);
    },

    /**
     * 현재 레벨 기준 생산 속도와 상한
     */
    getRate(id) {
        const spec = BuildingManager.getSpec(id);
        const save = BuildingManager.getSave(id);
        if (!spec || !spec.production || save.level <= 0) {
            return { perHour: 0, perMs: 0, cap: 0, resourceKey: null };
        }
        const p = spec.production;
        const perHour = p.basePerHour * save.level;
        return {
            perHour,
            perMs: perHour / this.MS_PER_HOUR,
            cap: p.baseCap * save.level,
            resourceKey: p.resource,
        };
    },

    /**
     * 현재 쌓인 재고 계산
     * @returns {{
     *   current: number,    // 현재 재고 (0~cap)
     *   cap: number,        // 저장 상한
     *   percent: number,    // 0~100
     *   full: boolean,      // 상한 도달
     *   resourceKey: string | null,
     *   rate: object        // getRate 결과
     * }}
     */
    getStock(id) {
        const rate = this.getRate(id);
        if (!rate.resourceKey) {
            return { current: 0, cap: 0, percent: 0, full: false, resourceKey: null, rate };
        }

        const save = BuildingManager.getSave(id);

        // 방어: producedAt이 0이거나 미래면 현재 시각으로 보정 (기존 세이브 호환)
        if (!save.producedAt || save.producedAt > Date.now()) {
            save.producedAt = Date.now();
            // 즉시 저장은 하지 않음 (조회성 함수는 부작용 최소화). 수거나 레벨업 시 저장됨.
        }

        const elapsedMs = Math.max(0, Date.now() - save.producedAt);
        const produced = elapsedMs * rate.perMs;
        const current = Math.min(rate.cap, produced);
        const percent = rate.cap > 0 ? Math.min(100, (current / rate.cap) * 100) : 0;
        const full = current >= rate.cap;

        return {
            current,
            cap: rate.cap,
            percent,
            full,
            resourceKey: rate.resourceKey,
            rate,
        };
    },

    // ─── 실행 ────────────────────

    /**
     * 재고 수거 → 자원 지급 → producedAt 갱신
     * @returns {{ success: boolean, amount?: number, resourceKey?: string, reason?: string }}
     */
    collect(id) {
        const stock = this.getStock(id);
        if (!stock.resourceKey) {
            return { success: false, reason: '생산 건물이 아닙니다' };
        }

        const save = BuildingManager.getSave(id);
        const amount = Math.floor(stock.current);   // 정수만 지급

        if (amount <= 0) {
            return { success: false, reason: '수거할 재고가 없습니다' };
        }

        // 자원 지급
        GameData.resources[stock.resourceKey] =
            (GameData.resources[stock.resourceKey] || 0) + amount;

        // producedAt 갱신 (재고 리셋)
        save.producedAt = Date.now();

        SaveManager.requestSave();
        EventBus.emit('resources:changed', { [stock.resourceKey]: amount });
        EventBus.emit('building:changed', { id, reason: 'collect' });

        console.log(`[Production] ${id} 수거: ${stock.resourceKey} +${amount}`);

        return {
            success: true,
            amount,
            resourceKey: stock.resourceKey,
        };
    },

    /**
     * 레벨업 시 이월 처리 호출 (BuildingManager._upgrade에서 호출)
     * - 레벨업 직전 stock 계산
     * - 새 레벨의 속도에서 "그 stock만큼 이미 쌓였던 것처럼" producedAt 역산
     * 결과: 재고는 유지되고, 새 레벨 속도로 쌓이기 시작
     *
     * @param {string} id
     * @param {number} oldLevel
     * @param {number} newLevel
     */
    handleLevelUp(id, oldLevel, newLevel) {
        const spec = BuildingManager.getSpec(id);
        if (!spec || !spec.production) return;

        const save = BuildingManager.getSave(id);

        // 레벨업 전 시점의 stock 계산
        const oldPerMs = (spec.production.basePerHour * oldLevel) / this.MS_PER_HOUR;
        const oldCap = spec.production.baseCap * oldLevel;

        let currentStock = 0;
        if (oldLevel > 0 && save.producedAt > 0) {
            const elapsedMs = Math.max(0, Date.now() - save.producedAt);
            currentStock = Math.min(oldCap, elapsedMs * oldPerMs);
        }

        // 새 레벨 속도로 같은 stock이 쌓여있으려면 얼마 전부터 쌓였어야 하는가?
        const newPerMs = (spec.production.basePerHour * newLevel) / this.MS_PER_HOUR;
        const newCap = spec.production.baseCap * newLevel;

        if (newPerMs <= 0) {
            save.producedAt = Date.now();
            return;
        }

        const clampedStock = Math.min(newCap, currentStock);
        const msAgo = clampedStock / newPerMs;
        save.producedAt = Date.now() - msAgo;

        console.log(
            `[Production] ${id} 레벨업 이월: Lv.${oldLevel}→${newLevel}, 재고 ${currentStock.toFixed(1)} 유지`
        );
    },

    /**
     * 건물 신규 건설 시 호출 (BuildingManager._upgrade에서 Lv.0→1일 때)
     */
    handleFirstBuild(id) {
        const save = BuildingManager.getSave(id);
        save.producedAt = Date.now();
    },
};