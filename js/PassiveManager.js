/**
 * PassiveManager.js
 * 패시브 건물 효과 계산 중앙 집중
 *
 * 설계 원칙:
 * - CombatManager/ChemistryManager는 이 API만 호출, GameData를 직접 안 읽음
 * - 건물이 건설 안 됨 (level 0) → 기본값 (배율 1.0, 추가 0)
 * - 공식은 선형 증가 (밸런스 조정 쉬움)
 */
const PassiveManager = {
    // ─── 효과 배율 설정 ────────────────────
    // 한 곳에서 수정 가능하도록 상수화
    MULT_PER_LEVEL: {
        training:   0.10,   // 훈련소: 영웅 데미지 +10%/Lv
        smithy:     0.10,   // 대장간: 장비 데미지 +10%/Lv
        alchemy:    0.10,   // 연금술 공방: 물약 효과 +10%/Lv
        lab:        0.05,   // 전술 연구소: 케미 +5%/Lv
    },
    ADD_PER_LEVEL: {
        canteen:    5,      // 식당: 최대 HP +5/Lv
    },

    // ─── 공통 조회 헬퍼 ────────────────────

    /**
     * 건물의 현재 레벨 (건설 안 됨 = 0)
     */
    _getLevel(id) {
        if (!GameData || !GameData.buildings || !GameData.buildings[id]) return 0;
        return GameData.buildings[id].level || 0;
    },

    /**
     * 배율 계산 (1.0 + perLv × level)
     */
    _calcMult(id) {
        const level = this._getLevel(id);
        const perLv = this.MULT_PER_LEVEL[id] || 0;
        return 1.0 + perLv * level;
    },

    /**
     * 가산 계산 (perLv × level)
     */
    _calcAdd(id) {
        const level = this._getLevel(id);
        const perLv = this.ADD_PER_LEVEL[id] || 0;
        return perLv * level;
    },

    // ─── 공개 API ────────────────────

    /**
     * 영웅 블럭 데미지 배율
     */
    getHeroDamageMult() {
        return this._calcMult('training');
    },

    /**
     * 장비 블럭 데미지 배율
     */
    getEquipDamageMult() {
        return this._calcMult('smithy');
    },

    /**
     * HP/MP 물약 효과 배율
     */
    getPotionEffectMult() {
        return this._calcMult('alchemy');
    },

    /**
     * 최대 HP 가산치
     */
    getMaxHpBonus() {
        return this._calcAdd('canteen');
    },

    /**
     * 케미 효과 배율
     */
    getChemistryMult() {
        return this._calcMult('lab');
    },

    // ─── UI용 텍스트 ────────────────────

    /**
     * 건물 팝업 "효과" 영역에 표시할 수치 문구
     * 예) "현재 +30% (Lv.3) → 다음 +40%"
     *     "현재 +15 (Lv.3) → 다음 +20"
     *
     * @param {string} buildingId
     * @returns {string | null}  패시브 건물이 아니면 null
     */
    getEffectPreview(buildingId) {
        const level = this._getLevel(buildingId);

        // 배율 타입
        if (this.MULT_PER_LEVEL[buildingId] !== undefined) {
            const perLv = this.MULT_PER_LEVEL[buildingId];
            const curr = level * perLv * 100;
            const next = (level + 1) * perLv * 100;
            if (level === 0) {
                return `현재 미건설 → 건설 시 +${next.toFixed(0)}%`;
            }
            return `현재 +${curr.toFixed(0)}% (Lv.${level}) → 다음 Lv +${next.toFixed(0)}%`;
        }

        // 가산 타입
        if (this.ADD_PER_LEVEL[buildingId] !== undefined) {
            const perLv = this.ADD_PER_LEVEL[buildingId];
            const curr = level * perLv;
            const next = (level + 1) * perLv;
            if (level === 0) {
                return `현재 미건설 → 건설 시 +${next}`;
            }
            return `현재 +${curr} (Lv.${level}) → 다음 Lv +${next}`;
        }

        return null;
    },
};