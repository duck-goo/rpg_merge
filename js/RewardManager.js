/**
 * RewardManager.js
 * 자원/경험치/레벨업 등 보상 관련 계산 및 적용 전담
 *
 * 설계 원칙:
 * - GameData 수정 + 저장 + EventBus emit을 한 곳에서 처리
 * - DungeonScene/LobbyScene이 직접 GameData를 쓰지 않고 이 매니저를 경유
 *
 * 정적 메서드만 사용 (싱글톤 상태가 없음)
 */
const RewardManager = {
    // ─── 던전 입장 비용 ────────────────────

    /**
     * 던전 입장 가능한지 체크 (차감 X, 조회만)
     * @returns {{ ok: boolean, reason?: string, costFood: number, currentFood: number }}
     */
    canEnterDungeon() {
        const costFood = CONFIG.DUNGEON_COST.FOOD_PER_ENTRY;
        const currentFood = GameData.resources.food;

        if (currentFood < costFood) {
            return {
                ok: false,
                reason: `식량이 부족합니다 (필요 ${costFood}, 보유 ${currentFood})`,
                costFood,
                currentFood,
            };
        }
        return { ok: true, costFood, currentFood };
    },

    /**
     * 던전 입장 처리 — 식량 차감 + 저장 + emit
     * @returns {{ success: boolean, reason?: string }}
     */
    consumeDungeonEntry() {
        const check = this.canEnterDungeon();
        if (!check.ok) {
            return { success: false, reason: check.reason };
        }

        GameData.resources.food -= check.costFood;
        SaveManager.save();   // 즉시 저장 (씬 전환 직전이므로 디바운스 회피)
        EventBus.emit('resources:changed', { food: GameData.resources.food });

        console.log(`[Reward] 던전 입장: 식량 -${check.costFood} → ${GameData.resources.food}`);
        return { success: true };
    },

    // ─── 스테이지 클리어 보상 ────────────────────

    /**
     * 스테이지 클리어 보상 지급
     * 자원 + 경험치 + 레벨업 처리 + 최고기록 갱신
     *
     * @param {number} stageNumber - 클리어한 스테이지 번호 (1-based)
     * @returns {{
     *   resources: object,    // 지급된 자원 { gold, wood, ... }
     *   xpGained: number,
     *   leveledUp: boolean,
     *   oldLevel: number,
     *   newLevel: number,
     *   highestUpdated: boolean
     * }}
     */
    grantStageClear(stageNumber) {
        const reward = CONFIG.STAGE_REWARDS[stageNumber];
        if (!reward) {
            console.warn(`[Reward] 스테이지 ${stageNumber} 보상 정의 없음`);
            return this._emptyResult();
        }

        // 1. 자원 지급
        const granted = {};
        for (const key in reward) {
            const amount = reward[key];
            if (amount > 0) {
                GameData.resources[key] = (GameData.resources[key] || 0) + amount;
                granted[key] = amount;
            }
        }

        // 2. 경험치 지급
        const xpGained = stageNumber * CONFIG.EXP_SETTINGS.STAGE_CLEAR_MULT;
        const levelResult = this._addExp(xpGained);

        // 3. 최고 기록 갱신
        let highestUpdated = false;
        if (stageNumber > GameData.stage.highestCleared) {
            GameData.stage.highestCleared = stageNumber;
            highestUpdated = true;
        }

        // 4. 저장 + emit
        SaveManager.requestSave();
        EventBus.emit('resources:changed', { ...granted });
        if (levelResult.leveledUp) {
            EventBus.emit('account:changed', {
                oldLevel: levelResult.oldLevel,
                newLevel: levelResult.newLevel,
            });
        }
        if (highestUpdated) {
            EventBus.emit('stage:cleared', { stageNumber });
        }

        console.log(
            `[Reward] Stage ${stageNumber} 클리어:`,
            `자원=${JSON.stringify(granted)}`,
            `XP+${xpGained}`,
            levelResult.leveledUp ? `Lv.${levelResult.oldLevel}→Lv.${levelResult.newLevel}` : ''
        );

        return {
            resources: granted,
            xpGained,
            leveledUp: levelResult.leveledUp,
            oldLevel: levelResult.oldLevel,
            newLevel: levelResult.newLevel,
            highestUpdated,
        };
    },

    // ─── 내부: 경험치 및 레벨업 ────────────────────

    /**
     * 경험치 추가 + 레벨업 처리 (연속 레벨업 지원)
     * @returns {{ leveledUp: boolean, oldLevel: number, newLevel: number }}
     */
    /**
 * 경험치 추가 + 레벨업 처리 (연속 레벨업 지원)
 * Phase 3-8: 레벨업 시 해금 건물 계산 + pendingLevelUp 기록
 *
 * @returns {{ leveledUp: boolean, oldLevel: number, newLevel: number }}
 */
    _addExp(xpAmount) {
        const oldLevel = GameData.account.level;
        GameData.account.exp += xpAmount;

        let leveledUp = false;
        let safetyCounter = 0;
        const MAX_LEVEL = CONFIG.EXP_SETTINGS.MAX_LEVEL;

        while (GameData.account.level < MAX_LEVEL) {
            const required = this.getRequiredExpForNextLevel(GameData.account.level);
            if (GameData.account.exp < required) break;

            GameData.account.exp -= required;
            GameData.account.level += 1;
            leveledUp = true;

            if (++safetyCounter > 1000) {
                console.error('[Reward] 레벨업 루프 안전 장치 발동');
                break;
            }
        }

        if (GameData.account.level >= MAX_LEVEL) {
            GameData.account.exp = 0;
        }

        // Phase 3-8: 레벨업 발생 시 pending에 누적 기록
        if (leveledUp) {
            const newLevel = GameData.account.level;
            const unlocked = this._getNewlyUnlockedBuildings(oldLevel, newLevel);
            this._recordPendingLevelUp(oldLevel, newLevel, unlocked);
        }

        return {
            leveledUp,
            oldLevel,
            newLevel: GameData.account.level,
        };
    },
    
        /**
     * oldLevel+1 ~ newLevel 구간에서 새로 해금된 건물 id 목록
     */
    _getNewlyUnlockedBuildings(oldLevel, newLevel) {
        if (!CONFIG.LOBBY_BUILDINGS) return [];
        const result = [];
        for (const def of CONFIG.LOBBY_BUILDINGS) {
            if (def.unlockLevel > oldLevel && def.unlockLevel <= newLevel) {
                result.push(def.id);
            }
        }
        return result;
    },
    
    /**
     * pendingLevelUp 누적 병합
     * - oldLevel은 첫 발생 값 유지 (사용자가 팝업 보기 전의 원래 레벨)
     * - newLevel은 최신으로 업데이트
     * - unlocked는 합집합
     */
    _recordPendingLevelUp(oldLevel, newLevel, unlockedBuildings) {
        const meta = GameData.meta;
        if (!meta.pendingLevelUp) {
            meta.pendingLevelUp = {
                oldLevel,
                newLevel,
                unlockedBuildings: [...unlockedBuildings],
            };
        } else {
            meta.pendingLevelUp.newLevel = newLevel;
            const merged = new Set(meta.pendingLevelUp.unlockedBuildings);
            for (const id of unlockedBuildings) merged.add(id);
            meta.pendingLevelUp.unlockedBuildings = Array.from(merged);
        }
    },
    
    /**
     * 현재 경험치 진행 상태 (HUD 진행바용)
     * @returns {{ current, required, percent, isMax }}
     */
    getExpProgress() {
        const level = GameData.account.level;
        const MAX_LEVEL = CONFIG.EXP_SETTINGS.MAX_LEVEL;
    
        if (level >= MAX_LEVEL) {
            return { current: 0, required: 0, percent: 100, isMax: true };
        }
    
        const required = this.getRequiredExpForNextLevel(level);
        const current = GameData.account.exp;
        const percent = required > 0 ? Math.min(100, (current / required) * 100) : 0;
    
        return { current, required, percent, isMax: false };
    },
    
    /**
     * (치트/테스트용) 레벨을 목표값으로 직접 올리면서 pending 기록
     * 콘솔에서 쉽게 테스트하기 위한 API
     */
    simulateLevelUp(targetLevel) {
        const oldLevel = GameData.account.level;
        if (targetLevel <= oldLevel) {
            console.warn('[Reward] simulateLevelUp: targetLevel은 현재보다 커야 합니다');
            return;
        }
    
        GameData.account.level = Math.min(targetLevel, CONFIG.EXP_SETTINGS.MAX_LEVEL);
        GameData.account.exp = 0;
    
        const newLevel = GameData.account.level;
        const unlocked = this._getNewlyUnlockedBuildings(oldLevel, newLevel);
        this._recordPendingLevelUp(oldLevel, newLevel, unlocked);
    
        SaveManager.save();
        EventBus.emit('account:changed', { oldLevel, newLevel });
    
        console.log(`[Reward] simulateLevelUp: Lv.${oldLevel} → Lv.${newLevel}, 해금 ${unlocked.length}개`);
    },

    /**
     * 특정 레벨에서 다음 레벨까지 필요한 경험치
     */
    getRequiredExpForNextLevel(level) {
        return Math.max(1, level * CONFIG.EXP_SETTINGS.LEVEL_UP_BASE);
    },

    _emptyResult() {
        return {
            resources: {},
            xpGained: 0,
            leveledUp: false,
            oldLevel: GameData.account.level,
            newLevel: GameData.account.level,
            highestUpdated: false,
        };
    },
};