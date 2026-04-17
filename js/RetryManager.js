/**
 * RetryManager.js
 * 스테이지 리트라이 상태 관리
 * - 스테이지별 광고 사용 횟수 추적
 * - 광고 시뮬레이션 실행
 */
class RetryManager {
    constructor(scene) {
        this.scene = scene;

        // 현재 스테이지에서 광고 사용한 횟수
        this.adUsedCount = 0;

        // 광고 진행 중 여부 (중복 실행 방지)
        this.isAdPlaying = false;
    }

    /**
     * 스테이지 전환 시 호출 — 광고 횟수 리셋
     */
    resetForNewStage() {
        this.adUsedCount = 0;
        this.isAdPlaying = false;
    }

    /**
     * 광고 리트라이 가능 여부
     */
    canUseAd() {
        return this.adUsedCount < CONFIG.RETRY.MAX_AD_PER_STAGE;
    }

    /**
     * 광고 시뮬레이션 실행
     * @param {function} onComplete - 광고 완료 후 호출할 콜백
     */
    playAd(onComplete) {
        if (this.isAdPlaying) {
            console.warn('[Retry] 광고 이미 진행 중');
            return;
        }
        if (!this.canUseAd()) {
            console.warn('[Retry] 광고 횟수 초과');
            return;
        }

        this.isAdPlaying = true;
        this.adUsedCount++;

        console.log('[Retry] 광고 시뮬레이션 시작');

        // 실제 광고 연동은 Phase 4. 지금은 delayedCall로 대체
        this.scene.time.delayedCall(CONFIG.RETRY.AD_DURATION_MS, () => {
            this.isAdPlaying = false;
            console.log('[Retry] 광고 시뮬레이션 완료');
            if (onComplete) onComplete();
        });
    }
}