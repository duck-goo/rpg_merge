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
        },
        account: {
            level: 1,
            exp: 0,
        },
        // 지침서 3.1 초기 자원: 골드 100, 목재 50, 석재 30, 식량 50
        resources: {
            gold: 100,
            wood: 50,
            stone: 30,
            iron: 0,
            food: 50,
            gem: 0,
        },
        stage: {
            currentIndex: 0,      // 현재 도전 중인 스테이지 (0-based)
            highestCleared: 0,    // 지금까지 클리어한 최고 스테이지 (1-based, 0=없음)
        },
        tutorial: {
            seenStages: [],       // 본 튜토리얼 스테이지 번호 배열 (1-based)
        },
        inventory: {
            dungeonSlots: [],     // Phase 3-10에서 채움
            lobbySlots: [],       // Phase 3-10에서 채움
        },
        buildings: {},            // Phase 3-5에서 채움: { id: { level, stock, producedAt } }
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