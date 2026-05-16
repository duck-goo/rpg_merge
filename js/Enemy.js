/**
 * Enemy.js
 * Phase 3-11-C-1: 적 인스턴스 + 타입별 능력 처리
 *
 * 적 타입 5종:
 * - normal:    기본 (특수 능력 X)
 * - defender:  받는 데미지 -30%, HP ↑↑
 * - evader:    공격 50% 회피
 * - regen:     매 턴 시작 시 HP 회복
 * - aoe:       자체 공격이 광역 (다중 영웅 도입 후 의미. 일단 추가 데미지 효과)
 * - barrier:   첫 N 데미지 흡수
 */
class Enemy {
    /**
     * @param {object} data - CONFIG.STAGES의 enemy 객체 (확장됨)
     */
    constructor(data) {
        // 기본
        this.name = data.name;
        this.maxHp = data.hp;
        this.hp = data.hp;
        this.attack = data.attack;

        // 타입
        this.type = data.type || 'normal';

        // 타입별 파라미터
        this.params = data.params || {};

        // 상태
        this.barrierHp = 0;
        if (this.type === 'barrier') {
            this.barrierHp = this.params.barrierAmount || 50;
        }

        this.isAlive = true;
    }

    /**
     * 들어온 데미지를 적의 능력 반영해서 실제 적용
     * @returns {{ dealt, blocked, missed }}
     */
    takeDamage(rawDamage) {
        if (!this.isAlive || rawDamage <= 0) {
            return { dealt: 0, blocked: 0, missed: false };
        }

        // 회피형: 확률로 회피
        if (this.type === 'evader') {
            const evadeRate = this.params.evadeRate || 0.5;
            if (Math.random() < evadeRate) {
                console.log(`[Enemy] ${this.name} 회피!`);
                return { dealt: 0, blocked: 0, missed: true };
            }
        }

        let damage = rawDamage;
        let blocked = 0;

        // 방어막형: barrierHp가 먼저 흡수
        if (this.type === 'barrier' && this.barrierHp > 0) {
            const absorbed = Math.min(this.barrierHp, damage);
            this.barrierHp -= absorbed;
            damage -= absorbed;
            blocked += absorbed;
            if (this.barrierHp === 0) {
                console.log(`[Enemy] ${this.name} 방어막 파괴!`);
            }
        }

        // 방어형: 받는 데미지 감소
        if (this.type === 'defender') {
            const reduction = this.params.damageReduction || 0.3;
            const reduced = Math.floor(damage * reduction);
            damage -= reduced;
            blocked += reduced;
        }

        // HP 차감
        if (damage > 0) {
            this.hp = Math.max(0, this.hp - damage);
            if (this.hp <= 0) {
                this.isAlive = false;
            }
        }

        return { dealt: damage, blocked, missed: false };
    }

    /**
     * 도트 데미지 (능력 미적용, 순수 데미지)
     */
    takeDot(amount) {
        if (!this.isAlive) return 0;
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp <= 0) this.isAlive = false;
        return amount;
    }

    /**
     * 턴 시작 시 적의 자체 효과 (재생 등)
     */
    onTurnStart() {
        if (!this.isAlive) return;

        if (this.type === 'regen') {
            const amount = this.params.regenAmount || 20;
            const before = this.hp;
            this.hp = Math.min(this.maxHp, this.hp + amount);
            const actual = this.hp - before;
            if (actual > 0) {
                console.log(`[Enemy] ${this.name} 재생: +${actual} (${this.hp}/${this.maxHp})`);
            }
        }
    }

    /**
     * 적의 공격 데미지 (기본 + 광역형 보너스)
     */
    getAttackDamage() {
        let dmg = this.attack;
        if (this.type === 'aoe') {
            // 광역형은 자체 공격 강함 (적 다수 도입 후 의미 본격화)
            const bonus = this.params.aoeBonus || 5;
            dmg += bonus;
        }
        return dmg;
    }

    /**
     * 적 정보 텍스트 (UI용)
     */
    getTypeLabel() {
        switch (this.type) {
            case 'defender': return '🛡 방어형';
            case 'evader':   return '💨 회피형';
            case 'regen':    return '🔄 재생형';
            case 'aoe':      return '💥 광역형';
            case 'barrier':  return '🔵 방어막형';
            default: return '';
        }
    }
}