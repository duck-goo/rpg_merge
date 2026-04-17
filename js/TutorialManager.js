/**
 * TutorialManager.js
 * 스테이지별 튜토리얼 표시 기록 관리
 * - 세션 메모리 기반 (새로고침하면 리셋)
 * - Phase 3에서 영속 저장 시스템 도입 시 저장 방식 교체
 */
class TutorialManager {
    constructor(scene) {
        this.scene = scene;

        // 이미 본 스테이지 번호 집합
        this.seenStages = new Set();
    }

    /**
     * 해당 스테이지 튜토리얼이 있는지
     */
    hasTutorial(stageNumber) {
        return (stageNumber in CONFIG.TUTORIAL);
    }

    /**
     * 이미 본 스테이지인지
     */
    hasSeen(stageNumber) {
        return this.seenStages.has(stageNumber);
    }

    /**
     * 본 기록 추가
     */
    markSeen(stageNumber) {
        this.seenStages.add(stageNumber);
    }

    /**
     * 스테이지 튜토리얼 데이터
     * @returns { title, body } 또는 null
     */
    getTutorial(stageNumber) {
        return CONFIG.TUTORIAL[stageNumber] || null;
    }

    /**
     * 표시해야 하는지 통합 판정
     */
    shouldShow(stageNumber) {
        return this.hasTutorial(stageNumber) && !this.hasSeen(stageNumber);
    }
}