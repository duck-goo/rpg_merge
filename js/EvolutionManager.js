/**
 * EvolutionManager.js
 * Phase 3-11-B: 진화 트리 룩업 + 진화 실행
 *
 * 두 종류 진화 처리:
 * 1. 영웅 + 장비 = 다음 직업 (영웅이 장비 위로 드래그된 케이스)
 * 2. 장비 + 장비 = 다음 등급 (단일 결과 또는 분기)
 */
const EvolutionManager = {
    
    // ─── 영웅 진화 ─────────────────────────
    
    /**
     * 영웅 + 장비 → 진화 결과 키 반환 (없으면 null)
     */
    findHeroEvolution(heroTypeKey, equipTypeKey) {
        const tree = (CONFIG.EVOLUTION && CONFIG.EVOLUTION.HERO) || {};
        const heroEntry = tree[heroTypeKey];
        if (!heroEntry) return null;
        return heroEntry[equipTypeKey] || null;
    },
    
    /**
     * 두 블럭이 영웅 진화 조건을 만족하는지
     * 조건: 한쪽은 영웅 Lv.3, 다른쪽은 장비 Lv.3, 진화 트리에 매칭 있음
     * @returns {{ result: string, heroBlock, equipBlock } | null}
     */
    canHeroEvolve(blockA, blockB) {
        if (!blockA || !blockB) return null;
        
        const MAX = CONFIG.BLOCK.MAX_GRADE;
        if (blockA.grade !== MAX || blockB.grade !== MAX) return null;
        
        let heroBlock, equipBlock;
        if (blockA.blockType.category === 'hero' && blockB.blockType.category === 'equip') {
            heroBlock = blockA;
            equipBlock = blockB;
        } else if (blockA.blockType.category === 'equip' && blockB.blockType.category === 'hero') {
            heroBlock = blockB;
            equipBlock = blockA;
        } else {
            return null;
        }
        
        const result = this.findHeroEvolution(heroBlock.blockType.key, equipBlock.blockType.key);
        if (!result) return null;
        
        return { result, heroBlock, equipBlock };
    },
    
    // ─── 장비 진화 ─────────────────────────
    
    /**
     * 장비 진화 정보 반환
     * @returns { branches: [...] } 분기 / { result: 키 } 단일 / null
     */
    findEquipEvolution(equipTypeKey) {
        const tree = (CONFIG.EVOLUTION && CONFIG.EVOLUTION.EQUIP) || {};
        return tree[equipTypeKey] || null;
    },
    
    /**
     * 두 블럭이 장비 진화 조건을 만족하는지
     * 조건: 둘 다 같은 장비 Lv.3
     * @returns {{ branches?: [...], result?: string } | null}
     */
    canEquipEvolve(blockA, blockB) {
        if (!blockA || !blockB) return null;
        if (blockA.blockType.category !== 'equip') return null;
        if (blockB.blockType.category !== 'equip') return null;
        if (blockA.blockType.key !== blockB.blockType.key) return null;
        
        const MAX = CONFIG.BLOCK.MAX_GRADE;
        if (blockA.grade !== MAX || blockB.grade !== MAX) return null;
        
        return this.findEquipEvolution(blockA.blockType.key);
    },
    
    // ─── 헬퍼 ─────────────────────────
    
    /**
     * blockType key로 CONFIG.BLOCK.TYPES 항목 찾기
     */
    findBlockType(key) {
        const types = CONFIG.BLOCK.TYPES;
        for (const k in types) {
            if (types[k].key === key) return types[k];
        }
        return null;
    },
};