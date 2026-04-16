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

    // 대기칸 설정
    QUEUE: {
        SLOT_COUNT: 3,     // 초기 슬롯 수
        SLOT_GAP: 8,       // 슬롯 간 간격
    },

    // UI 레이아웃 (Y 기준, 비율 → 픽셀 변환)
    LAYOUT: {
        // 적군 영역: 0% ~ 15%
        ENEMY_Y: 0,
        ENEMY_HEIGHT: 0.15,

        // 대기칸 영역: 15% ~ 23%
        QUEUE_Y: 0.15,
        QUEUE_HEIGHT: 0.08,

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
        QUEUE_AREA: 0x1a1a2e,     // 대기칸 영역
        QUEUE_SLOT: 0x233554,     // 대기칸 슬롯
        BUTTON_AREA: 0x1a1a2e,    // 버튼 영역
    },
    
    // 블럭 설정
    BLOCK: {
        TYPES: {
            HERO:      { key: 'hero',      name: '영웅', color: 0xe74c3c },
            EQUIP:     { key: 'equip',     name: '장비', color: 0x3498db },
            POTION_HP: { key: 'potion_hp', name: 'HP',   color: 0x2ecc71 },
            POTION_MP: { key: 'potion_mp', name: 'MP',   color: 0x9b59b6 },
        },
        MAX_GRADE: 3,       // 현재 생성 가능한 최대 등급
        INIT_GRADE: 1,      // 초기 생성 등급
        BORDER_RADIUS: 6,   // 블럭 둥근 모서리
        MARGIN: 3,          // 셀 내부 여백
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

    // 스테이지 데이터
    STAGES: [
        { stage: 1, enemy: { name: '슬라임',     hp: 80,  attack: 4  } },
        { stage: 2, enemy: { name: '고블린',     hp: 120, attack: 6  } },
        { stage: 3, enemy: { name: '스켈레톤',   hp: 160, attack: 8  } },
        { stage: 4, enemy: { name: '오크 전사',  hp: 220, attack: 11 } },
        { stage: 5, enemy: { name: '다크 나이트', hp: 300, attack: 15 } },
    ],
};