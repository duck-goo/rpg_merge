/**
 * TutorialManager.js
 * 스테이지별 튜토리얼 표시 기록 관리
 *
 * Phase 3-1 변경:
 * - 세션 Set → GameData.tutorial.seenStages 배열로 영속화
 * - markSeen 호출 시 SaveManager.requestSave()로 자동 저장
 */
class TutorialManager {
    constructor(scene) {
        this.scene = scene;
        // 내부 상태 없음. GameData.tutorial.seenStages를 직접 참조.
    }

    /**
     * 해당 스테이지 튜토리얼이 정의되어 있는지
     */
    hasTutorial(stageNumber) {
        return (stageNumber in CONFIG.TUTORIAL);
    }

    /**
     * 이미 본 스테이지인지 (영속 저장 기반)
     */
    hasSeen(stageNumber) {
        return GameData.tutorial.seenStages.includes(stageNumber);
    }

    /**
     * 본 기록 추가 + 자동 저장
     */
    markSeen(stageNumber) {
        if (this.hasSeen(stageNumber)) return;
        GameData.tutorial.seenStages.push(stageNumber);
        SaveManager.requestSave();
        console.log(`[Tutorial] 본 기록 저장: Stage ${stageNumber}`);
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