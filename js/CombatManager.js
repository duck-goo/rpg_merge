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

        // Phase 3-11-B-3: 실드 (HP 위 추가 흡수, 덮어쓰기)
        this.playerShield = 0;

        // Phase 3-11-C-1: Enemy 인스턴스
        this.enemy = new Enemy(enemyData);

        // 호환성 게터 (기존 코드에서 직접 참조하는 부분용)
        Object.defineProperty(this, 'enemyHp',     { get: () => this.enemy.hp, set: v => this.enemy.hp = v });
        Object.defineProperty(this, 'enemyMaxHp',  { get: () => this.enemy.maxHp });
        Object.defineProperty(this, 'enemyAttack', { get: () => this.enemy.attack });
        Object.defineProperty(this, 'enemyName',   { get: () => this.enemy.name });

        this.isBattleOver = false;
    }

    /**
    * 블럭 1개의 효과 계산
    * Phase 3-9: 패시브 건물 배율 적용
    */
    calculateBlockEffect(block) {
        const cat = block.blockType.category;
        const grade = block.grade;
        const combat = CONFIG.COMBAT;

        const pm = (typeof PassiveManager !== 'undefined') ? PassiveManager : null;
        const heroMult = pm ? pm.getHeroDamageMult() : 1.0;
        const equipMult = pm ? pm.getEquipDamageMult() : 1.0;
        const potionMult = pm ? pm.getPotionEffectMult() : 1.0;

        if (cat === 'hero') {
            // Phase 3-11-B-3: 영웅별 효과 시스템
            // calculateBlockEffect는 단순 합산만 반환 (메시지/UI용)
            // 실제 효과는 executeBlockEffect에서 처리
            const effectDef = CONFIG.HERO_EFFECTS[block.blockType.key];
            if (!effectDef) {
                // 정의 없는 영웅은 기본 ×1.0
                return { type: 'damage', value: Math.floor(grade * combat.HERO_DMG_MULT * heroMult) };
            }
            // 단순 추정 데미지 (실제는 executeBlockEffect에서)
            let totalDmg = 0;
            for (const eff of effectDef.effects) {
                if (eff.type === 'damage_single' || eff.type === 'damage_aoe') {
                    totalDmg += grade * effectDef.baseUnit * eff.mult;
                } else if (eff.type === 'damage_multi_hit') {
                    totalDmg += grade * effectDef.baseUnit * eff.mult * eff.hits;
                }
            }
            return { type: 'damage', value: Math.floor(totalDmg * heroMult) };
        }
        if (cat === 'equip') {
            const base = grade * combat.EQUIP_DMG_MULT;
            return { type: 'damage', value: Math.floor(base * equipMult) };
        }
        if (block.blockType.key === 'potion_hp') {
            const base = grade * combat.HP_HEAL_MULT;
            return { type: 'heal', value: Math.floor(base * potionMult) };
        }
        if (block.blockType.key === 'potion_mp') {
            const base = grade * combat.MP_HEAL_MULT;
            return { type: 'heal', value: Math.floor(base * potionMult) };
        }

        console.warn('[Combat] 알 수 없는 블럭 카테고리/키:', cat, block.blockType.key);
        return { type: 'none', value: 0 };
    }

    /**
     * Phase 3-11-A: 단일 블럭 발동
     * @param {Block} block
     * @returns {{ type, value, victory } | null}
     */
    /**
     * Phase 3-11-A: 단일 블럭 발동
     * Phase 3-11-B-3: 영웅은 다중 효과 시스템 사용
     */
    executeBlockEffect(block) {
        if (this.isBattleOver) return null;
        if (!block) return null;

        const cat = block.blockType.category;

        // 영웅: 다중 효과 시스템
        if (cat === 'hero') {
            const r = this.applyHeroEffects(block);
            let result = {
                type: 'damage',
                value: r.totalDamage,
                heal: r.totalHeal,
                shieldAmount: r.shieldAmount || 0,
                summons: r.summons || [],
                breakdown: r.breakdown,
                victory: false,
            };

            // 데미지 적용
            if (r.totalDamage > 0) {
                this.enemyHp = Math.max(0, this.enemyHp - r.totalDamage);
            }
            // 회복 적용
            if (r.totalHeal > 0) {
                this.playerHp = Math.min(this.playerMaxHp, this.playerHp + r.totalHeal);
            }
            // 실드 적용 (덮어쓰기)
            if (r.shieldAmount > 0) {
                this.playerShield = r.shieldAmount;
            }

            console.log(`[Combat] ${block.blockType.name} Lv.${block.grade} → [${r.breakdown.join(' / ')}]`);
            console.log(`  적HP ${this.enemyHp}/${this.enemyMaxHp}, 내HP ${this.playerHp}/${this.playerMaxHp}${this.playerShield ? `, 실드 ${this.playerShield}` : ''}`);

            if (!this.enemy.isAlive) {
                this.isBattleOver = true;
                result.victory = true;
            }
            return result;
        }

        // 물약: 회복
        if (cat === 'potion') {
            const effect = this.calculateBlockEffect(block);
            const before = this.playerHp;
            this.playerHp = Math.min(this.playerMaxHp, this.playerHp + effect.value);
            const actual = this.playerHp - before;
            console.log(`[Combat] ${block.blockType.name} Lv.${block.grade} → 회복 +${actual}`);
            return { type: 'heal', value: actual, victory: false };
        }

        // 장비는 발동 효과 X (DungeonScene에서 차단됨)
        return null;
    }

    /**
    * Phase 3-11-B-3: 영웅 발동 시 모든 효과 적용
    * @param {Block} block
    * @returns {{ totalDamage, totalHeal, shield, summons, victory, breakdown }}
    */
    applyHeroEffects(block) {
        const effectDef = CONFIG.HERO_EFFECTS[block.blockType.key];
        if (!effectDef) {
            const dmg = block.grade * CONFIG.COMBAT.HERO_DMG_MULT;
            const r = this.enemy.takeDamage(dmg);
            return { totalDamage: r.dealt, totalHeal: 0, breakdown: [`기본 ×1.0 → ${r.dealt}`] };
        }
    
        const grade = block.grade;
        const baseUnit = effectDef.baseUnit;
        const pm = (typeof PassiveManager !== 'undefined') ? PassiveManager : null;
        const heroMult = pm ? pm.getHeroDamageMult() : 1.0;
    
        let totalDamage = 0;
        let totalHeal = 0;
        let shieldAmount = 0;
        const summons = [];
        const breakdown = [];
    
        for (const eff of effectDef.effects) {
            switch (eff.type) {
                case 'damage_single':
                case 'damage_aoe': {
                    const rawDmg = Math.floor(grade * baseUnit * eff.mult * heroMult);
                    const r = this.enemy.takeDamage(rawDmg);
                    totalDamage += r.dealt;
                    if (r.missed) {
                        breakdown.push(`회피`);
                    } else if (r.blocked > 0) {
                        breakdown.push(`${eff.type === 'damage_aoe' ? '광역' : '단일'} ${r.dealt}(차단 ${r.blocked})`);
                    } else {
                        breakdown.push(`${eff.type === 'damage_aoe' ? '광역' : '단일'} ${r.dealt}`);
                    }
                    break;
                }
                case 'damage_multi_hit': {
                    const perHit = Math.floor(grade * baseUnit * eff.mult * heroMult);
                    let hitTotal = 0;
                    let missedCount = 0;
                    let blockedSum = 0;
                    for (let i = 0; i < eff.hits; i++) {
                        const r = this.enemy.takeDamage(perHit);
                        if (r.missed) missedCount++;
                        hitTotal += r.dealt;
                        blockedSum += r.blocked;
                    }
                    totalDamage += hitTotal;
                    let note = `연타 ${eff.hits}회 → ${hitTotal}`;
                    if (missedCount > 0) note += ` (회피 ${missedCount}회)`;
                    if (blockedSum > 0) note += ` (차단 ${blockedSum})`;
                    breakdown.push(note);
                    break;
                }
                case 'crit': {
                    const roll = Math.random();
                    if (roll < eff.chance) {
                        const baseDmg = Math.floor(grade * baseUnit * 1.0 * heroMult);
                        const extra = Math.floor(baseDmg * (eff.critMult - 1));
                        const r = this.enemy.takeDamage(extra);
                        totalDamage += r.dealt;
                        breakdown.push(`💥치명+${r.dealt}`);
                    }
                    break;
                }
                case 'heal': {
                    if (eff.target === 'self' || eff.target === 'all') {
                        totalHeal += eff.amount;
                        breakdown.push(`회복+${eff.amount}`);
                    }
                    break;
                }
                case 'shield': {
                    shieldAmount = Math.max(shieldAmount, eff.amount);
                    breakdown.push(`실드 ${eff.amount}`);
                    break;
                }
                case 'dot': {
                    // 즉발 환산 (Phase 3-11-C-3에서 진짜 도트 시스템)
                    const dmg = Math.floor(grade * baseUnit * eff.mult * eff.turns * heroMult);
                    const dealt = this.enemy.takeDot(dmg);
                    totalDamage += dealt;
                    breakdown.push(`도트 ${dealt}`);
                    break;
                }
                case 'debuff':
                    breakdown.push(`디버프(미구현)`);
                    break;
                case 'summon':
                    summons.push({ blockKey: eff.blockKey, count: eff.count || 1 });
                    breakdown.push(`소환 ${eff.blockKey}×${eff.count || 1}`);
                    break;
            }
        }
    
        return { totalDamage, totalHeal, shieldAmount, summons, breakdown };
    }
    /**
     * Phase 3-11-A: 적 턴 (TurnManager에서 호출)
     */
    runEnemyTurn() {
        if (this.isBattleOver) return;
        
        // Phase 3-11-C-1: 적 턴 시작 시 자체 효과 (재생 등)
        this.enemy.onTurnStart();
        
        let dmg = this.enemy.getAttackDamage();
        let absorbed = 0;
        if (this.playerShield > 0) {
            absorbed = Math.min(this.playerShield, dmg);
            this.playerShield -= absorbed;
            dmg -= absorbed;
        }
        
        if (dmg > 0) {
            this.playerHp = Math.max(0, this.playerHp - dmg);
        }
        
        if (absorbed > 0) {
            console.log(`[Combat] 적 반격: ${this.enemy.getAttackDamage()} → 실드 흡수 ${absorbed}, HP -${dmg}`);
        } else {
            console.log(`[Combat] 적 반격: ${dmg} (내HP ${this.playerHp}/${this.playerMaxHp})`);
        }
        
        EventBus.emit('combat:enemyAttack', { damage: dmg, absorbed });
        
        if (this.playerHp <= 0) {
            this.isBattleOver = true;
            EventBus.emit('combat:defeat');
        }
    }

}