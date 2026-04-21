/**
 * ChemistryManager.js
 * 케미(조합) 감지 및 효과 계산
 * 대기칸에 배치된 블럭 시퀀스를 받아 매칭되는 조합을 찾음
 */
class ChemistryManager {
    constructor(scene) {
        this.scene = scene;
        this.recipes = CONFIG.CHEMISTRY;
    }

    /**
     * 블럭 시퀀스에서 매칭되는 모든 케미 조합 감지
     *
     * 알고리즘: 슬라이딩 윈도우
     * - 각 조합의 blocks 배열을 대기칸 시퀀스에서 연속 구간으로 찾음
     * - null 슬롯은 건너뛰지 않고 매칭 실패 처리 (인접 조건)
     *
     * @param {Block[]} blocks - 대기칸 순서대로 (null 포함 가능)
     * @returns {Array<{ recipe, startIndex }>} 매칭된 조합 목록
     */
    detectMatches(blocks) {
        const matches = [];

        for (const recipe of this.recipes) {
            const pattern = recipe.blocks;
            const patternLen = pattern.length;

            if (patternLen === 0 || patternLen > blocks.length) continue;

            // 블럭 시퀀스를 슬라이딩하며 매칭
            for (let i = 0; i <= blocks.length - patternLen; i++) {
                if (this._matchesAt(blocks, i, pattern)) {
                    matches.push({ recipe, startIndex: i });
                }
            }
        }

        return matches;
    }

    /**
     * 특정 위치에서 패턴이 매칭되는지 확인
     */
    _matchesAt(blocks, startIdx, pattern) {
        for (let j = 0; j < pattern.length; j++) {
            const block = blocks[startIdx + j];
            if (!block) return false;  // null 슬롯은 인접 불가
            if (block.blockType.key !== pattern[j]) return false;
        }
        return true;
    }

    /**
     * 매칭된 조합들의 효과를 합산
     *
     * @param {Array} matches - detectMatches 결과
     * @param {number} baseDamage - 케미 적용 전 데미지
     * @param {number} baseHeal - 케미 적용 전 회복량
     * @returns {{ damage, heal, appliedMatches }}
     */
    /**
 * 매칭된 조합들의 효과를 합산
 * Phase 3-9: 전술 연구소 패시브로 케미 효과 증폭
 */
    applyEffects(matches, baseDamage, baseHeal) {
        let damage = baseDamage;
        let heal = baseHeal;
        const appliedMatches = [];
    
        // 전술 연구소 배율
        const chemMult = (typeof PassiveManager !== 'undefined')
            ? PassiveManager.getChemistryMult()
            : 1.0;
    
        for (const match of matches) {
            const effect = match.recipe.effect;
            const before = { damage, heal };
        
            switch (effect.type) {
                case 'add_damage': {
                    // 고정 데미지는 배율만큼 증폭
                    damage += effect.value * chemMult;
                    break;
                }
                case 'mult_damage': {
                    // 배율 효과의 "초과분"에만 배율 적용
                    // 예: 1.3배 + chemMult 1.5 → 1 + 0.3×1.5 = 1.45배
                    const boosted = 1 + (effect.value - 1) * chemMult;
                    damage = Math.floor(damage * boosted);
                    break;
                }
                case 'add_heal': {
                    heal += effect.value * chemMult;
                    break;
                }
                case 'mult_heal': {
                    const boosted = 1 + (effect.value - 1) * chemMult;
                    heal = Math.floor(heal * boosted);
                    break;
                }
                default:
                    console.warn(`[Chemistry] 알 수 없는 효과 타입: ${effect.type}`);
                    continue;
            }
        
            appliedMatches.push({
                recipe: match.recipe,
                before,
                after: { damage, heal },
            });
        
            console.log(`[Chemistry] 발동: ${match.recipe.name} (${effect.type} ${effect.value}, 배율 ${chemMult.toFixed(2)})`);
        }
    
        // add_* 효과가 float 누적했을 수 있으므로 최종 정수화
        return {
            damage: Math.floor(damage),
            heal: Math.floor(heal),
            appliedMatches,
        };
    }
}