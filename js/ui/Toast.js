/**
 * Toast.js
 * 하단 중앙에 잠시 떴다 사라지는 안내 메시지
 * 탭/버튼 공유용
 */
class Toast {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} y - 토스트 표시 y좌표 (화면 중앙 x에 배치)
     */
    constructor(scene, y) {
        this.scene = scene;
        this.y = y;
        this._timer = null;

        const { width: gw } = scene.scale;
        this.text = scene.add.text(gw / 2, y, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#f1c40f',
            align: 'center',
            backgroundColor: '#000000',
            padding: { x: 10, y: 6 },
        }).setOrigin(0.5).setAlpha(0).setDepth(200);
    }

    show(message, durationMs = 1800) {
        if (!this.text) return;

        this.text.setText(message);
        this.text.setAlpha(1);

        if (this._timer) {
            this._timer.remove();
        }

        this._timer = this.scene.time.delayedCall(durationMs, () => {
            if (this.text) this.text.setAlpha(0);
            this._timer = null;
        });
    }

    destroy() {
        if (this._timer) {
            this._timer.remove();
            this._timer = null;
        }
        this.text = null;
    }
}