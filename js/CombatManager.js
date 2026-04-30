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
     * Phase 3-11-A: 단일 블럭 발동
     * @param {Block} block
     * @returns {{ type, value, victory } | null}
     */
    executeBlockEffect(block) {
        if (this.isBattleOver) return null;
        if (!block) return null;
    
        const effect = this.calculateBlockEffect(block);
        let result = { type: effect.type, value: effect.value, victory: false };
    
        if (effect.type === 'damage') {
            this.enemyHp = Math.max(0, this.enemyHp - effect.value);
            console.log(`[Combat] ${block.blockType.name} Lv.${block.grade} → 데미지 ${effect.value} (적HP ${this.enemyHp}/${this.enemyMaxHp})`);
            if (this.enemyHp <= 0) {
                this.isBattleOver = true;
                result.victory = true;
            }
        } else if (effect.type === 'heal') {
            const before = this.playerHp;
            this.playerHp = Math.min(this.playerMaxHp, this.playerHp + effect.value);
            const actual = this.playerHp - before;
            result.value = actual;
            console.log(`[Combat] ${block.blockType.name} Lv.${block.grade} → 회복 +${actual} (내HP ${this.playerHp}/${this.playerMaxHp})`);
        }
    
        return result;
    }
    
    /**
     * Phase 3-11-A: 적 턴 (TurnManager에서 호출)
     */
    runEnemyTurn() {
        if (this.isBattleOver) return;
        const dmg = this.enemyAttack;
        this.playerHp = Math.max(0, this.playerHp - dmg);
        console.log(`[Combat] 적 반격: ${dmg} (내HP ${this.playerHp}/${this.playerMaxHp})`);
        EventBus.emit('combat:enemyAttack', { damage: dmg });
        if (this.playerHp <= 0) {
            this.isBattleOver = true;
            EventBus.emit('combat:defeat');
        }
    }

}