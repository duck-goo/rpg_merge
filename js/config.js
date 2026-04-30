/**
 * config.js
 * 게임 전역 설정값
 * 레이아웃, 보드 크기, 색상 등 한 곳에서 관리
 */
const CONFIG = {
    // 게임 논리 해상도
    GAME_WIDTH: 360,
    GAME_HEIGHT: 640,

    // 보드 설정
    BOARD: {
        COLS: 6,
        ROWS: 7,
        GAP: 2,           // 칸 사이 간격 (px)
        PADDING: 10,      // 보드 좌우 여백 (px)
    },

    // 인벤토리 설정
    INVENTORY: {
        INITIAL_SLOTS: 20,    // 초기 칸수
        COLS: 5,              // 인벤 창 가로 칸수
        CELL_SIZE: 52,        // 인벤 창 셀 크기
        CELL_GAP: 4,
    },

    // UI 레이아웃 (Y 기준, 비율 → 픽셀 변환)
    LAYOUT: {
        // 적군 영역: 0% ~ 15%
        ENEMY_Y: 0,
        ENEMY_HEIGHT: 0.15,

        // 보드 영역: 23% ~ 83%
        BOARD_Y: 0.23,
        BOARD_HEIGHT: 0.60,

        // 하단 버튼 영역: 83% ~ 95%
        BUTTON_Y: 0.83,
        BUTTON_HEIGHT: 0.12,
    },

    // 임시 색상 (추후 에셋으로 교체)
    COLORS: {
        BOARD_BG: 0x16213e,       // 보드 배경
        CELL_EMPTY: 0x0f3460,     // 빈 칸
        CELL_BORDER: 0x1a1a2e,    // 칸 테두리 (배경과 동일 = 간격 효과)
        ENEMY_AREA: 0x1a1a2e,     // 적군 영역 (현재 배경색)
        BUTTON_AREA: 0x1a1a2e,    // 버튼 영역
        // 인벤토리
        INV_OVERLAY: 0x000000,     // 반투명 배경 (알파로 투명도 조절)
        INV_PANEL: 0x16213e,       // 인벤 창 배경
        INV_SLOT: 0x0f3460,        // 인벤 셀
        INV_SLOT_EMPTY: 0x233554,  // 빈 인벤 셀
    },
    
    // 블럭 설정
    BLOCK: {
        TYPES: {
            // ─── 기존 ─── (변경 없음)
            HERO:      { key: 'hero',      name: '영웅', color: 0xe74c3c, category: 'hero' },   // 모험가용
            EQUIP:     { key: 'equip',     name: '장비', color: 0x3498db, category: 'equip' },   // (구) 일반 장비, B에서 5종으로 분화
            POTION_HP: { key: 'potion_hp', name: 'HP',   color: 0x2ecc71, category: 'potion' },
            POTION_MP: { key: 'potion_mp', name: 'MP',   color: 0x9b59b6, category: 'potion' },

            // ─── A-2 신규 — 스페이서 3종 ───
            SPAWNER_GUILD: {
                key: 'spawner_guild',
                name: '길드',
                color: 0xd4a574,           // 황금색 톤
                category: 'spawner',
                isSpawner: true,
                produces: 'hero',          // 단일 키 = 고정 생성
                icon: '⚔',
            },
            SPAWNER_TOOLSHOP: {
                key: 'spawner_toolshop',
                name: '도구상점',
                color: 0x52b788,           // 연두
                category: 'spawner',
                isSpawner: true,
                produces: ['potion_hp', 'potion_mp'],   // 배열 = 랜덤
                icon: '⚗',
            },
            SPAWNER_SUPPLY: {
                key: 'spawner_supply',
                name: '보급고',
                color: 0xb19cd9,           // 라일락
                category: 'spawner',
                isSpawner: true,
                produces: ['equip'],       // A-2: equip 1종만. B에서 5종으로 분화
                icon: '⚒',
            },
        },
        MAX_GRADE: 3,       // 현재 생성 가능한 최대 등급
        INIT_GRADE: 1,      // 초기 생성 등급
        BORDER_RADIUS: 6,   // 블럭 둥근 모서리
        MARGIN: 3,          // 셀 내부 여백

        // ★ 신규 — 스페이서 초기 배치 위치
        INITIAL_SPAWNERS: [
            { typeKey: 'spawner_guild',    col: 1, row: 3 },
            { typeKey: 'spawner_toolshop', col: 3, row: 3 },
            { typeKey: 'spawner_supply',   col: 5, row: 3 },
        ],
    },

    // 전투 설정
    COMBAT: {
        PLAYER_HP: 100,
        // 블럭 효과 = 등급 × 배율
        HERO_DMG_MULT: 10,      // 영웅 데미지 배율
        EQUIP_DMG_MULT: 7,      // 장비 데미지 배율
        HP_HEAL_MULT: 8,        // HP물약 회복 배율
        MP_HEAL_MULT: 5,        // MP물약 임시 회복 배율 (Phase 2에서 스킬게이지로 전환)
    },

    // 리트라이 설정
    RETRY: {
        AD_DURATION_MS: 3000,       // 광고 시뮬레이션 시간 (실제 광고로 교체 예정)
        MAX_AD_PER_STAGE: 1,        // 스테이지당 광고 리트라이 횟수
    },

    // 튜토리얼 (스테이지별 안내 문구)
    TUTORIAL: {       
    },

    // 스테이지 데이터
    STAGES: [
        { stage: 1, enemy: { name: '슬라임',     hp: 80,  attack: 4  } },
        { stage: 2, enemy: { name: '고블린',     hp: 120, attack: 6  } },
        { stage: 3, enemy: { name: '스켈레톤',   hp: 160, attack: 8  } },
        { stage: 4, enemy: { name: '오크 전사',  hp: 220, attack: 11 } },
        { stage: 5, enemy: { name: '다크 나이트', hp: 300, attack: 15 } },
    ],

    // Phase 3-11-A: 던전 룰
    DUNGEON: {
        BASE_ACTIONS_PER_TURN: 3,
    },

    // ─── Phase 3-3: 로비 마을 ─────────────────
    
    // 로비 건물 목록 (지침서 3.4 기준 18종)
    // Phase 3-3에서는 시각 배치만. 3-5부터 실제 기능 연결.
    LOBBY_BUILDINGS: [
        // 생산
        { id: 'farm',       name: '농장',       category: 'production',     unlockLevel: 1,  icon: '🌾' },
        { id: 'lumberyard', name: '벌목장',     category: 'production',     unlockLevel: 3,  icon: '🪓' },
        { id: 'quarry',     name: '채석장',     category: 'production',     unlockLevel: 5,  icon: '🪨' },
        { id: 'market',     name: '시장',       category: 'production',     unlockLevel: 5,  icon: '🏪' },
        { id: 'mine',       name: '광산',       category: 'production',     unlockLevel: 10, icon: '⛏️' },
        { id: 'shrine',     name: '여신상',     category: 'production',     unlockLevel: 15, icon: '💎' },
        // 패시브 기본
        { id: 'training',   name: '훈련소',     category: 'passive_basic',  unlockLevel: 10, icon: '🥊' },
        { id: 'canteen',    name: '식당',       category: 'passive_basic',  unlockLevel: 10, icon: '🍖' },
        { id: 'smithy',     name: '대장간',     category: 'passive_basic',  unlockLevel: 15, icon: '🔨' },
        { id: 'alchemy',    name: '연금술 공방', category: 'passive_basic',  unlockLevel: 15, icon: '⚗️' },
        // 패시브 직업
        { id: 'barracks',   name: '기사단 병영', category: 'passive_job',    unlockLevel: 20, icon: '🛡️' },
        { id: 'archery',    name: '사격장',     category: 'passive_job',    unlockLevel: 20, icon: '🎯' },
        { id: 'magehall',   name: '마법전당',   category: 'passive_job',    unlockLevel: 20, icon: '🔮' },
        { id: 'cathedral',  name: '성당',       category: 'passive_job',    unlockLevel: 20, icon: '⛪' },
        { id: 'tavern',     name: '선술집',     category: 'passive_job',    unlockLevel: 20, icon: '🍺' },
        // 패시브 시스템
        { id: 'warehouse',  name: '창고',       category: 'passive_system', unlockLevel: 10, icon: '📦' },
        { id: 'command',    name: '지휘소',     category: 'passive_system', unlockLevel: 20, icon: '🚩' },
        { id: 'lab',        name: '전술 연구소', category: 'passive_system', unlockLevel: 25, icon: '📜' },
    ],

    // 로비 메뉴 버튼 6종 (Phase 3 각 단계에서 연결)
    LOBBY_MENUS: [
        { id: 'summon',    label: '소환', icon: '🎲', phase: '3-12' },
        { id: 'warehouse', label: '창고', icon: '📦', phase: '3-10' },
        { id: 'book',      label: '도감', icon: '📚', phase: '3-16' },
        { id: 'quest',     label: '의뢰', icon: '📜', phase: '3-15' },
        { id: 'dispatch',  label: '파견', icon: '🚶', phase: '3-17' },
        { id: 'settings',  label: '설정', icon: '⚙️', phase: '3-21' },
    ],

    // 로비 UI 상수
    LOBBY: {
        TAP_THRESHOLD_PX: 8,    // 드래그/탭 구분 임계값
        TILE_SIZE: 72,          // 건물 타일 크기
        TILE_GAP: 16,
        CATEGORY_GAP: 36,       // 카테고리 간 추가 간격
    },

    // ─── Phase 3-3: 탭 내비게이션 ─────────────────

    // 하단 탭 정의 (순서: 영웅-마을-던전-창고-이벤트)
    TABS: [
        { id: 'hero',    label: '영웅',   icon: '👤',  pageName: '영웅' },
        { id: 'village', label: '마을',   icon: '🏘️', pageName: '마을' },
        { id: 'dungeon', label: '던전',   icon: '⚔️',  pageName: '로비' },
        { id: 'storage', label: '창고',   icon: '📦',  pageName: '창고' },
        { id: 'event',   label: '이벤트', icon: '🎁',  pageName: '이벤트' },
    ],

    // 초기 진입 탭 (던전 탭이 중앙이자 메인)
    DEFAULT_TAB_ID: 'dungeon',

    // 상단 HUD에 표시할 자원 3종 (나머지 3종은 상점 팝업에서 표시 예정)
    RESOURCE_HUD_KEYS: [
        { key: 'gold', icon: '💰' },
        { key: 'food', icon: '🍞' },
        { key: 'gem',  icon: '💎' },
    ],

    // HUD/TabBar 높이 상수
    LOBBY_LAYOUT: {
        HUD_HEIGHT: 56,
        TABBAR_HEIGHT: 64,
    },

    // ─── Phase 3-4: 던전 연결 ─────────────────

    // 던전 입장 비용 (식량)
    DUNGEON_COST: {
        FOOD_PER_ENTRY: 5,   // 던전 한 번 입장 시 차감 (챕터 확장 시 재설계 예정)
    },

    // 스테이지별 클리어 보상 (지침서 3.1)
    // Phase 3-4 조정: 식량은 보상에서 제외 (소모와 보상이 상쇄되어 피로도 무의미해지는 문제)
    // 식량은 Phase 3-5 이후 농장 건물 생산 + Phase 3 상점 구매로만 획득
    STAGE_REWARDS: {
        1: { gold: 20, wood: 10, stone: 0,  food: 0 },
        2: { gold: 30, wood: 15, stone: 5,  food: 0 },
        3: { gold: 45, wood: 20, stone: 10, food: 0 },
        4: { gold: 60, wood: 25, stone: 15, food: 0 },
        5: { gold: 80, wood: 30, stone: 20, food: 0 },
    },

    // 경험치 설정
    EXP_SETTINGS: {
        // 스테이지 클리어 경험치: stageNumber × MULT
        STAGE_CLEAR_MULT: 20,
        // 다음 레벨 필요 경험치: currentLevel × BASE
        LEVEL_UP_BASE: 100,
        // 최대 레벨 (임의 상한, 나중에 확장)
        MAX_LEVEL: 99,
    },

    // ─── Phase 3-5: 건물 스펙 ─────────────────

    // 건물 18종 스펙 (LOBBY_BUILDINGS의 id와 1:1 매칭)
    // 비용 공식: 다음레벨비용 = buildCost × (1 + costMult × (currentLevel - 1))
    // 계정 레벨 요구: unlockLevel + currentLevel × levelPerAccount
    //   (단, Lv.1 건설은 unlockLevel만 만족하면 됨)
    // ─── Phase 3-5/3-6: 건물 스펙 ─────────────────

    BUILDING_SPECS: {
        // ─ 생산 ─
        // ─ 생산 ─
        farm:       { maxLevel: 20, buildCost: { gold: 50,  wood: 20 },              costMult: 0.5, levelPerAccount: 2, effect: '식량 자동 생산 (시간 누적)',
                      production: { resource: 'food',  basePerHour: 10,  baseCap: 60  } },
        lumberyard: { maxLevel: 20, buildCost: { gold: 80,  wood: 30 },              costMult: 0.5, levelPerAccount: 2, effect: '목재 자동 생산 (시간 누적)',
                      production: { resource: 'wood',  basePerHour: 8,   baseCap: 48  } },
        quarry:     { maxLevel: 20, buildCost: { gold: 100, wood: 40 },              costMult: 0.5, levelPerAccount: 2, effect: '석재 자동 생산 (시간 누적)',
                      production: { resource: 'stone', basePerHour: 6,   baseCap: 36  } },
        market:     { maxLevel: 20, buildCost: { gold: 150, wood: 30, stone: 20 },   costMult: 0.5, levelPerAccount: 2, effect: '골드 자동 생산 (시간 누적)',
                      production: { resource: 'gold',  basePerHour: 20,  baseCap: 120 } },
        mine:       { maxLevel: 20, buildCost: { gold: 200, wood: 50, stone: 30 },   costMult: 0.5, levelPerAccount: 3, effect: '철 자동 생산 (시간 누적)',
                      production: { resource: 'iron',  basePerHour: 4,   baseCap: 24  } },
        shrine:     { maxLevel: 10, buildCost: { gold: 500, wood: 100, stone: 80, iron: 30 }, costMult: 0.8, levelPerAccount: 5, effect: '보석(유료 재화) 소량 자동 생산',
                      production: { resource: 'gem',   basePerHour: 0.2, baseCap: 2   } },

        // ─ 패시브 기본 ─
        training:   { maxLevel: 20, buildCost: { gold: 150, wood: 60, stone: 30 },   costMult: 0.5, levelPerAccount: 2, effect: '영웅 블럭 공격력 증가' },
        canteen:    { maxLevel: 20, buildCost: { gold: 150, wood: 60, stone: 30 },   costMult: 0.5, levelPerAccount: 2, effect: '플레이어 최대 HP 증가' },
        smithy:     { maxLevel: 20, buildCost: { gold: 250, wood: 80, stone: 50, iron: 20 },  costMult: 0.5, levelPerAccount: 2, effect: '장비 블럭 효과 증가' },
        alchemy:    { maxLevel: 20, buildCost: { gold: 250, wood: 80, stone: 50, iron: 20 },  costMult: 0.5, levelPerAccount: 2, effect: 'HP/MP 물약 효과 증가' },

        // ─ 패시브 직업 ─
        barracks:   { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '워리어 계열 영웅 강화' },
        archery:    { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '보우맨 계열 영웅 강화' },
        magehall:   { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '메이지 계열 영웅 강화' },
        cathedral:  { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '클레릭 계열 영웅 강화' },
        tavern:     { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '도적 계열 영웅 강화' },

        // ─ 패시브 시스템 ─
        warehouse:  { maxLevel: 10, buildCost: { gold: 200, wood: 80, stone: 60 },   costMult: 0.6, levelPerAccount: 5,  effect: '던전 인벤토리 확장 (Lv당 +1, 기본 5칸)' },
        command:    { maxLevel: 2,  buildCost: { gold: 800, wood: 200, stone: 150, iron: 80 }, costMult: 1.0, levelPerAccount: 20, effect: '던전 대기칸 확장 (Lv당 +1, 최대 5칸)' },
        lab:        { maxLevel: 20, buildCost: { gold: 300, wood: 100, stone: 80, iron: 30 }, costMult: 0.5, levelPerAccount: 2, effect: '케미 효과 상승' },
    },

    // 건물 상세 팝업 사이즈
    BUILDING_POPUP: {
        WIDTH: 300,
        HEIGHT: 420,
    },
};

/**
 * 숫자를 K/M 단위로 축약
 * 999 이하: 그대로 (예: 999)
 * 1000~999999: K 단위 (예: 1.2K, 123K)
 * 1000000 이상: M 단위 (예: 1.23M, 123M)
 *
 * 소수점 1자리 or 정수로 자동 결정:
 * - 10 미만이면 소수점 2자리 (1.23K, 1.23M)
 * - 10~99.9면 소수점 1자리 (12.3K, 12.3M)
 * - 100 이상이면 정수 (123K, 123M)
 */
function formatCompactNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const n = Number(num);
    if (n < 1000) return String(Math.floor(n));

    const units = [
        { value: 1_000_000_000, suffix: 'B' },
        { value: 1_000_000,     suffix: 'M' },
        { value: 1_000,         suffix: 'K' },
    ];

    for (const u of units) {
        if (n >= u.value) {
            const scaled = n / u.value;
            let formatted;
            if (scaled < 10)       formatted = scaled.toFixed(2);
            else if (scaled < 100) formatted = scaled.toFixed(1);
            else                   formatted = Math.floor(scaled).toString();
            // 소수점 끝 0 제거 (1.20K → 1.2K, 1.00K → 1K)
            formatted = formatted.replace(/\.?0+$/, '');
            return formatted + u.suffix;
        }
    }
    return String(Math.floor(n));
}