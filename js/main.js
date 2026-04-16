/**
 * main.js
 * Phaser 게임 설정 및 초기화
 *
 * 설계 결정:
 * - 논리 해상도 360x640 (모바일 세로 기준)
 * - FIT 스케일: 화면 비율 유지하면서 최대 크기로 확대
 * - Canvas 렌더링 (WebGL 미지원 기기 대응, 2D 머지 게임에 충분)
 * - 배경색 #1a1a2e (어두운 판타지 톤)
 */

/**
 * 게임 설정 객체
 * Phaser.Types.Core.GameConfig
 */
const gameConfig = {
    // 렌더러: AUTO = WebGL 우선, 불가 시 Canvas 폴백
    type: Phaser.AUTO,

    // 게임을 렌더링할 DOM 요소
    parent: 'game-container',

    // 논리 해상도 (모바일 세로 기준)
    width: CONFIG.GAME_WIDTH,
    height: CONFIG.GAME_HEIGHT,

    // 배경색
    backgroundColor: '#1a1a2e',

    // 스케일 설정: 다양한 화면 크기에 자동 대응
    scale: {
        // FIT: 비율 유지하면서 화면에 맞춤
        mode: Phaser.Scale.FIT,
        // 가로/세로 모두 중앙 정렬
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    // 물리 엔진: 머지 게임에는 불필요 → 비활성화
    physics: {
        default: false,
    },

    // 등록할 씬 목록
    scene: [GameScene],
};

// 게임 인스턴스 생성 및 실행
const game = new Phaser.Game(gameConfig);

console.log('[Main] Phaser 게임 인스턴스 생성 완료');
