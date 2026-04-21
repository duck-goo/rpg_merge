/**
 * BuildingManager.js
 * 건물 조회/건설/레벨업 전담 매니저
 *
 * 설계 원칙:
 * - 모든 건물 관련 상태 변경은 이 매니저를 경유
 * - GameData 수정 + 저장 + EventBus emit 일원화
 * - UI/씬에서는 이 매니저의 공개 API만 사용
 *
 * 상태 분류:
 * - 'locked': 계정 레벨이 unlockLevel에 못 미침
 * - 'unbuilt': 해제됨, 아직 건설 전 (level === 0)
 * - 'built': 건설 완료 (level >= 1)
 */
const BuildingManager = {
    // ─── 조회 ────────────────────

    /**
     * 건물 정의 조회 (LOBBY_BUILDINGS의 엔트리)
     */
    getDef(id) {
        return CONFIG.LOBBY_BUILDINGS.find(b => b.id === id) || null;
    },

    /**
     * 건물 스펙 조회 (BUILDING_SPECS의 엔트리)
     */
    getSpec(id) {
        return CONFIG.BUILDING_SPECS[id] || null;
    },

    /**
     * 건물 저장 데이터 조회
     * 엔트리 누락 시 자동 생성 (스키마 확장 대응)
     */
    getSave(id) {
        if (!GameData.buildings[id]) {
            GameData.buildings[id] = { level: 0, producedAt: 0, stock: 0 };
        }
        return GameData.buildings[id];
    },

    /**
     * 상태 3분류
     */
    getState(id) {
        const def = this.getDef(id);
        if (!def) return 'locked';

        // 계정 레벨이 unlockLevel에 못 미치면 잠금
        if (GameData.account.level < def.unlockLevel) {
            return 'locked';
        }

        const save = this.getSave(id);
        return save.level >= 1 ? 'built' : 'unbuilt';
    },

    /**
     * UI가 필요한 정보 한 번에 조회
     * @returns {object} 또는 null (정의 없음)
     */
    getBuildingData(id) {
        const def = this.getDef(id);
        const spec = this.getSpec(id);
        if (!def || !spec) return null;

        const save = this.getSave(id);
        const state = this.getState(id);
        const isMaxLevel = save.level >= spec.maxLevel;

        const nextCost = isMaxLevel ? null : this.getBuildCost(id, save.level);
        const requiredAccountLevel = this.getRequiredAccountLevel(id, save.level);
        const accountLevelOK = GameData.account.level >= requiredAccountLevel;
        const canAfford = nextCost ? this.canAfford(nextCost) : false;

        return {
            def,
            spec,
            save,
            state,
            level: save.level,
            isMaxLevel,
            nextCost,
            requiredAccountLevel,
            accountLevelOK,
            canAfford,
            canUpgrade: !isMaxLevel && accountLevelOK && canAfford,
        };
    },

    // ─── 비용 ────────────────────

    /**
     * 다음 레벨 건설/레벨업 비용 계산
     * @param {string} id
     * @param {number} currentLevel - 현재 레벨 (0 = 건설 전)
     * @returns {object} { gold, wood, ... } 비용. 정수로 올림
     */
    getBuildCost(id, currentLevel) {
        const spec = this.getSpec(id);
        if (!spec) return {};

        // Lv.0 → Lv.1은 기본비용 그대로
        // Lv.N → Lv.N+1 비용 = 기본비용 × (1 + costMult × N)
        // 예: costMult=0.5 → Lv.0→1 = ×1, Lv.1→2 = ×1.5, Lv.2→3 = ×2.0 ...
        const multiplier = 1 + (spec.costMult * currentLevel);
        const result = {};

        for (const key in spec.buildCost) {
            result[key] = Math.ceil(spec.buildCost[key] * multiplier);
        }
        return result;
    },

    /**
     * 특정 레벨에 도달하기 위한 계정 레벨 요구량
     * @param {string} id
     * @param {number} currentLevel - 현재 건물 레벨
     * @returns {number} - 다음 레벨로 올리기 위한 최소 계정 레벨
     */
    getRequiredAccountLevel(id, currentLevel) {
        const def = this.getDef(id);
        const spec = this.getSpec(id);
        if (!def || !spec) return 999;

        // Lv.0 → Lv.1: unlockLevel 만족이면 OK
        // Lv.N → Lv.N+1 (N≥1): unlockLevel + N × levelPerAccount
        if (currentLevel === 0) return def.unlockLevel;
        return def.unlockLevel + currentLevel * spec.levelPerAccount;
    },

    /**
     * 현재 보유 자원으로 비용 감당 가능한지
     */
    canAfford(cost) {
        for (const key in cost) {
            if ((GameData.resources[key] || 0) < cost[key]) return false;
        }
        return true;
    },

    // ─── 실행 ────────────────────

    /**
     * 건물 건설 (Lv.0 → Lv.1)
     * @returns {{ success: boolean, reason?: string, newLevel?: number }}
     */
    build(id) {
        const data = this.getBuildingData(id);
        if (!data) return { success: false, reason: '정의되지 않은 건물' };
        if (data.level > 0) return { success: false, reason: '이미 건설됨' };
        return this._upgrade(id, data);
    },

    /**
     * 건물 레벨업 (Lv.N → Lv.N+1)
     */
    levelUp(id) {
        const data = this.getBuildingData(id);
        if (!data) return { success: false, reason: '정의되지 않은 건물' };
        if (data.level === 0) return { success: false, reason: '먼저 건설해야 합니다' };
        return this._upgrade(id, data);
    },

    /**
     * 공통: 레벨 1단계 상승 처리
     */
    _upgrade(id, data) {
        if (data.isMaxLevel) {
            return { success: false, reason: '최대 레벨' };
        }
        if (!data.accountLevelOK) {
            return { success: false, reason: `계정 Lv.${data.requiredAccountLevel} 필요` };
        }
        if (!data.canAfford) {
            return { success: false, reason: '자원이 부족합니다' };
        }
    
        // 1. 자원 차감
        const cost = data.nextCost;
        const spent = {};
        for (const key in cost) {
            GameData.resources[key] -= cost[key];
            spent[key] = cost[key];
        }
    
        // 2. 레벨 증가
        const save = this.getSave(id);
        const oldLevel = save.level;
        save.level += 1;
        const newLevel = save.level;
    
        // 3. 생산 건물 훅
        // - Lv.0 → 1: 첫 건설, producedAt 초기화
        // - Lv.N → N+1: 이월 처리
        if (typeof ProductionManager !== 'undefined' && ProductionManager.hasProduction(id)) {
            if (oldLevel === 0) {
                ProductionManager.handleFirstBuild(id);
            } else {
                ProductionManager.handleLevelUp(id, oldLevel, newLevel);
            }
        }
    
        // 4. 저장 + emit
        SaveManager.requestSave();
        EventBus.emit('resources:changed', spent);
        EventBus.emit('building:changed', { id, newLevel });
    
        console.log(`[Building] ${id} Lv.${oldLevel} → Lv.${newLevel}, 소비: ${JSON.stringify(spent)}`);
    
        return { success: true, newLevel };
    },
};