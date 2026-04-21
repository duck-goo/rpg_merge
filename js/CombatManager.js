/**
 * CombatManager.js
 * 턴제 전투 관리 (케미 적용)
 */
class CombatManager {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} enemyData - { name, hp, attack }
     */
    constructor(scene, enemyData) {
        this.scene = scene;

        // 플레이어 상태
        // Phase 3-9: 식당 패시브로 최대 HP 증가
        const bonusHp = (typeof PassiveManager !== 'undefined')
            ? PassiveManager.getMaxHpBonus()
            : 0;
        this.playerMaxHp = CONFIG.COMBAT.PLAYER_HP + bonusHp;
        this.playerHp = this.playerMaxHp;

        // 적군 상태
        this.enemyHp = enemyData.hp;
        this.enemyMaxHp = enemyData.hp;
        this.enemyAttack = enemyData.attack;
        this.enemyName = enemyData.name;

        this.isBattleOver = false;
    }

    /**
    * 블럭 1개의 효과 계산
    * Phase 3-9: 패시브 건물 배율 적용
    */
    calculateBlockEffect(block) {
        const key = block.blockType.key;
        const grade = block.grade;
        const combat = CONFIG.COMBAT;

        // 패시브 배율 (PassiveManager 미로딩 시 안전값 1.0)
        const pm = (typeof PassiveManager !== 'undefined') ? PassiveManager : null;
        const heroMult   = pm ? pm.getHeroDamageMult()   : 1.0;
        const equipMult  = pm ? pm.getEquipDamageMult()  : 1.0;
        const potionMult = pm ? pm.getPotionEffectMult() : 1.0;

        switch (key) {
            case 'hero': {
                const base = grade * combat.HERO_DMG_MULT;
                return { type: 'damage', value: Math.floor(base * heroMult) };
            }
            case 'equip': {
                const base = grade * combat.EQUIP_DMG_MULT;
                return { type: 'damage', value: Math.floor(base * equipMult) };
            }
            case 'potion_hp': {
                const base = grade * combat.HP_HEAL_MULT;
                return { type: 'heal', value: Math.floor(base * potionMult) };
            }
            case 'potion_mp': {
                const base = grade * combat.MP_HEAL_MULT;
                return { type: 'heal', value: Math.floor(base * potionMult) };
            }
            default:
                console.warn('[Combat] 알 수 없는 블럭 타입:', key);
                return { type: 'none', value: 0 };
        }
    }

    /**
     * 대기칸 블럭들 순서대로 발동 (케미 적용)
     * @param {Block[]} blocks - 왼→오 (null 없음)
     * @param {ChemistryManager} chemistry - 케미 매니저 (옵션)
     */
    executeTurn(blocks, chemistry = null) {
        if (this.isBattleOver) {
            return { effects: [], enemyDmg: 0, result: 'already_over', chemistryMatches: [] };
        }

        const effects = [];
        let totalDamage = 0;
        let totalHeal = 0;

        // 1단계: 블럭 기본 효과 계산
        for (const block of blocks) {
            const effect = this.calculateBlockEffect(block);
            effects.push({
                blockName: block.blockType.name,
                grade: block.grade,
                ...effect,
            });

            if (effect.type === 'damage') {
                totalDamage += effect.value;
            } else if (effect.type === 'heal') {
                totalHeal += effect.value;
            }
        }

        // 2단계: 케미 매칭 및 효과 적용
        let chemistryMatches = [];
        if (chemistry) {
            const matches = chemistry.detectMatches(blocks);
            const result = chemistry.applyEffects(matches, totalDamage, totalHeal);
            totalDamage = result.damage;
            totalHeal = result.heal;
            chemistryMatches = result.appliedMatches;
        }

        // 3단계: 적군 데미지
        this.enemyHp = Math.max(0, this.enemyHp - totalDamage);

        // 4단계: 플레이어 회복
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + totalHeal);

        // 적군 처치 확인
        if (this.enemyHp <= 0) {
            this.isBattleOver = true;
            return { effects, enemyDmg: 0, result: 'victory', chemistryMatches, totalDamage, totalHeal };
        }

        // 5단계: 적군 반격
        const enemyDmg = this.enemyAttack;
        this.playerHp = Math.max(0, this.playerHp - enemyDmg);

        if (this.playerHp <= 0) {
            this.isBattleOver = true;
            return { effects, enemyDmg, result: 'defeat', chemistryMatches, totalDamage, totalHeal };
        }

        console.log(
            `[Combat] 턴 완료 | 데미지:${totalDamage} 회복:${totalHeal}` +
            ` | 케미:${chemistryMatches.length}건` +
            ` | 적HP:${this.enemyHp}/${this.enemyMaxHp}` +
            ` | 내HP:${this.playerHp}/${this.playerMaxHp}` +
            ` | 적반격:${enemyDmg}`
        );

        return { effects, enemyDmg, result: 'continue', chemistryMatches, totalDamage, totalHeal };
    }
}