/**
 * TurnManager.js
 * Phase 3-11-A: 턴/행동 관리
 *
 * 룰:
 * - 1턴 = 행동 N개 (기본 3 + 지휘소 보너스)
 * - 행동 소모: 스페이서 탭 / 머지 / 발동
 * - 행동 소모 X: 단순 이동 / 교환 / 인벤 이동
 * - 행동 0 도달 시 자동으로 적 턴 (800ms 후)
 * - [턴 종료] 버튼: 잔여 행동 버리고 적 턴 진입
 */
const TurnManager = {
    scene: null,
    isEnemyTurnInProgress: false,

    /**
     * 던전 진입/스테이지 전환 시 호출
     */
    init(scene) {
        this.scene = scene;
        this.isEnemyTurnInProgress = false;
        const max = this._getMaxActions();
        GameData.dungeon = {
            turnNumber: 1,
            actionsRemaining: max,
            actionsPerTurn: max,
        };
        EventBus.emit('turn:changed');
        console.log(`[Turn] 초기화 — Turn 1, 행동 ${max}/${max}`);
    },

    _getMaxActions() {
        const base = (CONFIG.DUNGEON && CONFIG.DUNGEON.BASE_ACTIONS_PER_TURN) || 3;
        // 지휘소 보너스 (Lv당 +1)
        const cmd = (GameData.buildings && GameData.buildings.command) || { level: 0 };
        return base + (cmd.level || 0);
    },

    /**
     * 현재 행동 가능한 상태인지
     */
    canAct() {
        if (this.isEnemyTurnInProgress) return false;
        if (!this.scene || !this.scene.combatManager) return false;
        if (this.scene.combatManager.isBattleOver) return false;
        return GameData.dungeon && GameData.dungeon.actionsRemaining > 0;
    },

    /**
     * 행동 1 소모. 0 도달 시 자동 적 턴 예약.
     * @returns {boolean} 소모 성공
     */
    spendAction(reason) {
        if (this.isEnemyTurnInProgress) return false;
        if (!GameData.dungeon || GameData.dungeon.actionsRemaining <= 0) return false;

        GameData.dungeon.actionsRemaining--;
        console.log(`[Turn] -1 (${reason}) → 남은 ${GameData.dungeon.actionsRemaining}`);
        EventBus.emit('turn:changed');

        if (GameData.dungeon.actionsRemaining === 0) {
            this.scene.time.delayedCall(800, () => this.endTurn());
        }
        return true;
    },

    /**
     * 적 턴 강제 종료 → 적 행동 → 다음 플레이어 턴
     */
    endTurn() {
        if (this.isEnemyTurnInProgress) return;
        if (!this.scene || !this.scene.combatManager) return;
        if (this.scene.combatManager.isBattleOver) return;

        this.isEnemyTurnInProgress = true;
        EventBus.emit('turn:enemyTurnStart');

        // 적 행동
        this.scene.combatManager.runEnemyTurn();

        // 패배 시 종료 (다음 턴 안 시작)
        if (this.scene.combatManager.isBattleOver) {
            this.isEnemyTurnInProgress = false;
            return;
        }

        // 다음 턴 시작
        this.scene.time.delayedCall(600, () => {
            if (!GameData.dungeon) return;
            GameData.dungeon.turnNumber++;
            GameData.dungeon.actionsRemaining = this._getMaxActions();
            this.isEnemyTurnInProgress = false;
            EventBus.emit('turn:changed');
            EventBus.emit('turn:playerTurnStart');
            console.log(`[Turn] Turn ${GameData.dungeon.turnNumber} 시작 (행동 ${GameData.dungeon.actionsRemaining})`);
        });
    },
};