/**
 * TutorialDialogUI.js
 * 튜토리얼 안내 팝업
 */
class TutorialDialogUI {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.uiObjects = [];
    }

    /**
     * 팝업 표시
     * @param {string} title
     * @param {string} body
     * @param {function} onClose - 팝업 닫힐 때 콜백 (옵션)
     */
    show(title, body, onClose) {
        if (this.isOpen) return;
        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 180;
        const self = this;

        const doClose = () => {
            self._destroyAll();
            if (onClose) onClose();
        };

        // 오버레이
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, gw, gh);
        overlay.setDepth(depthBase);
        this.uiObjects.push(overlay);

        const overlayZone = this.scene.add.zone(gw / 2, gh / 2, gw, gh);
        overlayZone.setInteractive();
        overlayZone.setDepth(depthBase);
        overlayZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            doClose();
        });
        this.uiObjects.push(overlayZone);

        // 다이얼로그
        const dw = 300;
        const dh = 280;
        const dx = (gw - dw) / 2;
        const dy = (gh - dh) / 2;

        const box = this.scene.add.graphics();
        box.fillStyle(0x233554, 1);
        box.fillRoundedRect(dx, dy, dw, dh, 10);
        box.setDepth(depthBase + 1);
        this.uiObjects.push(box);

        // 박스 클릭은 외부 오버레이 이벤트로 전파 차단 (명시적 확인 버튼만)
        const boxZone = this.scene.add.zone(gw / 2, gh / 2, dw, dh);
        boxZone.setInteractive();
        boxZone.setDepth(depthBase + 1);
        boxZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
        });
        this.uiObjects.push(boxZone);

        // 제목
        const titleText = this.scene.add.text(
            gw / 2, dy + 20,
            title, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                color: '#f1c40f',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(titleText);

        // 본문
        const bodyText = this.scene.add.text(
            gw / 2, dy + 60,
            body, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#ffffff',
                align: 'center',
                lineSpacing: 6,
                wordWrap: { width: dw - 40 },
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(bodyText);

        // 확인 버튼
        const btnW = 100;
        const btnH = 36;
        const btnX = gw / 2 - btnW / 2;
        const btnY = dy + dh - btnH - 16;

        const btnBg = this.scene.add.graphics();
        btnBg.fillStyle(0x27ae60, 1);
        btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
        btnBg.setDepth(depthBase + 2);
        this.uiObjects.push(btnBg);

        const btnText = this.scene.add.text(
            btnX + btnW / 2, btnY + btnH / 2,
            '확인',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 3);
        this.uiObjects.push(btnText);

        const btnZone = this.scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH);
        btnZone.setInteractive({ useHandCursor: true });
        btnZone.setDepth(depthBase + 4);
        btnZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            doClose();
        });
        this.uiObjects.push(btnZone);

        // 하단 안내
        const hintText = this.scene.add.text(
            gw / 2, btnY - 8,
            '(팝업 바깥을 눌러도 닫힙니다)', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#888888',
            }
        ).setOrigin(0.5, 1).setDepth(depthBase + 2);
        this.uiObjects.push(hintText);
    }

    _destroyAll() {
        for (const obj of this.uiObjects) {
            if (obj) obj.destroy();
        }
        this.uiObjects = [];
        this.isOpen = false;
    }
}