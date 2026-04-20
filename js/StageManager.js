/**
 * StageManager.js
 * 스테이지 진행 관리
 * 현재 스테이지 추적, 클리어/패배 처리, 보드 리셋 조율
 */
class StageManager {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        this.currentIndex = GameData.stage.currentIndex || 0;
        this.stages = CONFIG.STAGES;
        this.isTransitioning = false;
    }

    /**
     * 현재 스테이지 데이터
     */
    getCurrentStage() {
        return this.stages[this.currentIndex];
    }

    /**
     * 현재 스테이지 번호 (1부터)
     */
    getStageNumber() {
        return this.stages[this.currentIndex].stage;
    }

    /**
     * 다음 스테이지가 있는지
     */
    hasNextStage() {
        return this.currentIndex < this.stages.length - 1;
    }

    /**
     * 다음 스테이지로 진행
     * @returns {boolean} 진행 성공 여부
     */
    advance() {
        if (!this.hasNextStage()) {
            return false;
        }
        this.currentIndex++;
        return true;
    }

    /**
     * 현재 스테이지 재시작 (인덱스 유지)
     */
    restart() {
        // 인덱스 변경 없음, 리셋은 외부에서 처리
    }
}