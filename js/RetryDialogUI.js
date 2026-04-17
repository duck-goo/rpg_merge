/**
 * RetryDialogUI.js
 * 패배 시 리트라이 선택 팝업 + 광고 진행 화면
 */
class RetryDialogUI {
    /**
     * @param {Phaser.Scene} scene
     * @param {RetryManager} retryManager
     */
    constructor(scene, retryManager) {
        this.scene = scene;
        this.retryManager = retryManager;

        this.isOpen = false;
        this.uiObjects = [];   // 팝업 UI 요소 (한번에 파괴)
        this.adUiObjects = []; // 광고 진행 UI 요소
    }

    // ─── 리트라이 선택 팝업 ─────────────────────────────

    /**
     * 리트라이 선택 팝업 열기
     * @param {function} onAdRetry - 광고 선택 콜백
     * @param {function} onGiveUp - 포기 선택 콜백
     */
    openRetryDialog(onAdRetry, onGiveUp) {
        if (this.isOpen) return;
        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 150;

        // 오버레이
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, gw, gh);
        overlay.setDepth(depthBase);
        this.uiObjects.push(overlay);

        const overlayZone = this.scene.add.zone(gw / 2, gh / 2, gw, gh);
        overlayZone.setInteractive();
        overlayZone.setDepth(depthBase);
        // 오버레이 클릭해도 안 닫힘 (반드시 버튼 선택해야 함)
        overlayZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
        });
        this.uiObjects.push(overlayZone);

        // 다이얼로그 박스
        const dw = 280;
        const dh = 220;
        const dx = (gw - dw) / 2;
        const dy = (gh - dh) / 2;

        const box = this.scene.add.graphics();
        box.fillStyle(0x233554, 1);
        box.fillRoundedRect(dx, dy, dw, dh, 10);
        box.setDepth(depthBase + 1);
        this.uiObjects.push(box);

        // 타이틀
        const title = this.scene.add.text(
            gw / 2, dy + 20,
            '패배...', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '20px',
                color: '#e74c3c',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(title);

        // 설명
        const desc = this.scene.add.text(
            gw / 2, dy + 56,
            '어떻게 하시겠습니까?', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#cccccc',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(desc);

        // 광고 리트라이 버튼
        const canAd = this.retryManager.canUseAd();
        this._createDialogButton({
            x: gw / 2, y: dy + 105,
            w: 220, h: 44,
            label: canAd ? '광고 시청 후 부활' : '광고 사용 완료',
            subLabel: canAd ? 'HP 회복 + 보드 유지' : '',
            color: canAd ? 0x27ae60 : 0x555555,
            enabled: canAd,
            depth: depthBase,
            onClick: () => {
                this.closeRetryDialog();
                if (onAdRetry) onAdRetry();
            },
        });

        // 포기(재시작) 버튼
        this._createDialogButton({
            x: gw / 2, y: dy + 165,
            w: 220, h: 36,
            label: '포기하고 재시작',
            subLabel: '보드 초기화 + 인벤 소멸',
            color: 0x7f8c8d,
            enabled: true,
            depth: depthBase,
            onClick: () => {
                this.closeRetryDialog();
                if (onGiveUp) onGiveUp();
            },
        });
    }

    closeRetryDialog() {
        if (!this.isOpen) return;
        this.isOpen = false;

        for (const obj of this.uiObjects) {
            if (obj) obj.destroy();
        }
        this.uiObjects = [];
    }

    // ─── 광고 진행 화면 ─────────────────────────────

    /**
     * 광고 진행 오버레이
     * @param {number} durationMs - 광고 시간
     */
    showAdPlaying(durationMs) {
        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 200;

        // 배경
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 1);
        bg.fillRect(0, 0, gw, gh);
        bg.setDepth(depthBase);
        this.adUiObjects.push(bg);

        const bgZone = this.scene.add.zone(gw / 2, gh / 2, gw, gh);
        bgZone.setInteractive();
        bgZone.setDepth(depthBase);
        bgZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
        });
        this.adUiObjects.push(bgZone);

        // "광고 재생 중" 텍스트
        const title = this.scene.add.text(
            gw / 2, gh / 2 - 40,
            '광고 재생 중...', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 1);
        this.adUiObjects.push(title);

        // 카운트다운 텍스트
        const totalSec = Math.ceil(durationMs / 1000);
        const countdown = this.scene.add.text(
            gw / 2, gh / 2 + 10,
            `${totalSec}초 후 복귀`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#f1c40f',
            }
        ).setOrigin(0.5).setDepth(depthBase + 1);
        this.adUiObjects.push(countdown);

        // 1초마다 카운트다운 갱신
        let remaining = totalSec;
        const timer = this.scene.time.addEvent({
            delay: 1000,
            repeat: totalSec - 1,
            callback: () => {
                remaining--;
                if (remaining > 0 && countdown) {
                    countdown.setText(`${remaining}초 후 복귀`);
                }
            },
        });
        this.adUiObjects.push({ destroy: () => timer.remove() });

        // 안내 문구
        const info = this.scene.add.text(
            gw / 2, gh / 2 + 50,
            '(실제 광고는 Phase 4에서 연동)', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#777777',
            }
        ).setOrigin(0.5).setDepth(depthBase + 1);
        this.adUiObjects.push(info);
    }

    closeAdPlaying() {
        for (const obj of this.adUiObjects) {
            if (obj && obj.destroy) obj.destroy();
        }
        this.adUiObjects = [];
    }

    // ─── 내부: 다이얼로그 버튼 생성 ─────────────────────────────

    _createDialogButton({ x, y, w, h, label, subLabel, color, enabled, depth, onClick }) {
        const bx = x - w / 2;
        const by = y - h / 2;

        const bg = this.scene.add.graphics();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(bx, by, w, h, 6);
        bg.setDepth(depth + 2);
        this.uiObjects.push(bg);

        // 메인 라벨
        const textY = subLabel ? by + 8 : y;
        const text = this.scene.add.text(
            x, textY,
            label, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: enabled ? '#ffffff' : '#aaaaaa',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, subLabel ? 0 : 0.5).setDepth(depth + 3);
        this.uiObjects.push(text);

        // 서브 라벨
        if (subLabel) {
            const sub = this.scene.add.text(
                x, by + h - 8,
                subLabel, {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10px',
                    color: enabled ? '#ecf0f1' : '#888888',
                }
            ).setOrigin(0.5, 1).setDepth(depth + 3);
            this.uiObjects.push(sub);
        }

        // 히트 존 (비활성 시 클릭 안 함)
        if (enabled) {
            const zone = this.scene.add.zone(x, y, w, h);
            zone.setInteractive({ useHandCursor: true });
            zone.setDepth(depth + 4);
            zone.on('pointerdown', (pointer, lx, ly, event) => {
                event.stopPropagation();
                if (onClick) onClick();
            });
            this.uiObjects.push(zone);
        }
    }
}