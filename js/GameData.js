/**
 * GameData.js
 * 게임 전역 상태 객체 및 기본값 정의
 *
 * 설계 원칙:
 * - 모든 영속 상태는 여기에 모은다 (저장/로드 단일 지점)
 * - 미래 Phase에서 쓸 필드도 미리 자리만 잡아둔다 (마이그레이션 비용 감소)
 * - GameData 참조 자체는 const (내용만 교체됨). 즉, 다른 파일에서
 *   GameData.resources 처럼 접근해도 SaveManager.load() 이후에 값이 유지된다.
 */

const SCHEMA_VERSION = 1;

/**
 * 기본 건물 상태 객체 생성
 * CONFIG.LOBBY_BUILDINGS의 모든 id에 대해 level=0 엔트리를 만듦
 * CONFIG 로드가 GameData보다 먼저 이루어지므로 안전함 (index.html 순서로 보장)
 */
function _createDefaultBuildings() {
    const result = {};
    const buildings = (typeof CONFIG !== 'undefined' && CONFIG.LOBBY_BUILDINGS) ? CONFIG.LOBBY_BUILDINGS : [];
    for (const def of buildings) {
        result[def.id] = {
            level: 0,         // 0 = 건설 전
            producedAt: 0,    // Phase 3-7에서 사용 (생산 마지막 계산 시각)
            stock: 0,         // Phase 3-7에서 사용 (수거 대기 재고)
        };
    }
    return result;
}

/**
 * 기본값 GameData를 새로 생성해서 반환 (깊은 복사)
 * - 공유 참조 돌연변이 방지를 위해 매번 새 객체 생성
 */
function createDefaultGameData() {
    const now = Date.now();
    return {
        version: SCHEMA_VERSION,
        meta: {
            createdAt: now,
            updatedAt: now,
            pendingLevelUp: null,
        },
        account: {
            level: 1,
            exp: 0,
        },
        resources: {
            gold: 100, wood: 50, stone: 30,
            iron: 0,   food: 50, gem: 0,
        },
        stage: {
            currentIndex: 0,
            highestCleared: 0,
        },
        tutorial: {
            seenStages: [],
        },
        inventory: {
            dungeonSlots: [],
            lobbySlots: [],
        },
        // ★ Phase 3-10: 창고 + 조각
        storage: {
            items: [],    // [{ blockTypeKey, grade }]
            pendingItems: [],    // ★ 던전 이관 대기 (창고 탭 확인 전)
        },
        fragments: {
            hero: 0,
            equip: 0,
            potion: 0,
        },
        buildings: _createDefaultBuildings(),
        settings: {
            bgm: 1.0,
            sfx: 1.0,
            vibration: true,
        },
    };
}

/**
 * 전역 단일 인스턴스
 * SaveManager.load() 시점에 내용이 교체된다 (참조는 유지)
 */
const GameData = createDefaultGameData();