/**
 * cheats.js
 * 개발 중 테스트용 치트 함수
 * 출시 전 index.html에서 이 줄만 제거하면 됨
 */

// 게임이 로드된 후 일정 시간 뒤 실행 (씬 준비 보장)
window.addEventListener('load', () => {
    setTimeout(() => {
        console.log('%c=== 치트 활성화 ===', 'color: yellow; font-weight: bold;');
        console.log('cheat.spawn(typeKey, col, row, grade)');
        console.log('cheat.evolve(heroKey, equipKey)');
        console.log('cheat.testEffect(heroKey, grade=3)');
        console.log('cheat.killEnemy()');
        console.log('cheat.refillActions()');
        console.log('cheat.dumpBoard()');
        console.log('cheat.clearBoard()');
        console.log('cheat.maxResources()');
        console.log('cheat.simLevel(level)');
    }, 500);
});

window.cheat = {
    /**
     * 보드 + 매니저 단축 접근
     */
    get ds()  { return game.scene.getScene('DungeonScene'); },
    get bm()  { return this.ds.boardManager; },
    get cm()  { return this.ds.combatManager; },

    /**
     * 블럭 1개 생성
     */
    spawn(typeKey, col, row, grade = 1) {
        return this.bm.spawnBlockOfType(typeKey, col, row, grade);
    },

    /**
     * 영웅+장비 진화 셋업 (드래그는 직접)
     */
    evolve(heroKey, equipKey) {
        this.bm.spawnBlockOfType(heroKey, 0, 6, 3);
        this.bm.spawnBlockOfType(equipKey, 1, 6, 3);
        console.log(`${heroKey} Lv.3 + ${equipKey} Lv.3 보드 좌하단에 배치됨. 드래그해서 머지.`);
    },

    /**
     * 영웅 효과 즉시 호출 (블럭 없이 결과만 보기)
     */
    testEffect(heroKey, grade = 3) {
        const blockType = Object.values(CONFIG.BLOCK.TYPES).find(t => t.key === heroKey);
        if (!blockType) {
            console.warn('알 수 없는 영웅:', heroKey);
            return null;
        }
        const fakeBlock = { blockType, grade };
        const r = this.cm.applyHeroEffects(fakeBlock);
        console.log(`${blockType.name} Lv.${grade}:`, r);
        return r;
    },

    /**
     * 적 HP를 1로
     */
    killEnemy() {
        this.cm.enemyHp = 1;
        console.log('적 HP = 1');
    },

    /**
     * 행동 99로
     */
    refillActions() {
        GameData.dungeon.actionsRemaining = 99;
        EventBus.emit('turn:changed');
        console.log('행동 99 충전');
    },

    /**
     * 보드 비우기 (스페이서 유지)
     */
    clearBoard() {
        const b = this.bm;
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 6; c++) {
                const blk = b.grid[r][c];
                if (blk && !blk.isSpawner) {
                    blk.destroy();
                    b.grid[r][c] = null;
                }
            }
        }
        console.log('보드 정리 완료');
    },

    /**
     * 보드 한눈에
     */
    dumpBoard() {
        const b = this.bm;
        const lines = [];
        for (let r = 0; r < 7; r++) {
            const row = [];
            for (let c = 0; c < 6; c++) {
                const blk = b.grid[r][c];
                if (!blk) row.push(' .  ');
                else if (blk.isSpawner) row.push((blk.blockType.short + '✦').padEnd(3));
                else row.push(`${blk.blockType.short}${blk.grade}`.padEnd(3));
            }
            lines.push(row.join(' '));
        }
        console.log(lines.join('\n'));
    },

    /**
     * 자원 다 채우기
     */
    maxResources() {
        GameData.resources.gold  = 99999;
        GameData.resources.food  = 999;
        GameData.resources.wood  = 9999;
        GameData.resources.stone = 9999;
        GameData.resources.iron  = 9999;
        GameData.resources.gem   = 999;
        SaveManager.save();
        EventBus.emit('resources:changed');
        console.log('자원 충전 완료');
    },

    /**
     * 계정 레벨 시뮬
     */
    simLevel(level) {
        RewardManager.simulateLevelUp(level);
        const ls = game.scene.getScene('LobbyScene');
        if (ls && ls.scene) ls.scene.restart();
        console.log(`Lv.${level} 시뮬 완료`);
    },

    /**
     * 데이터 초기화 (새로고침 필요)
     */
    reset() {
        SaveManager.reset();
        console.log('초기화 완료. F5 누르세요.');
    },
};