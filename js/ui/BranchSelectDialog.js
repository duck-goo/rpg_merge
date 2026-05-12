/**
 * BranchSelectDialog.js
 * Phase 3-11-B: 장비 머지 시 분기 선택 팝업
 *
 * 두 갈래 결과 중 하나 선택 → 콜백으로 결과 키 전달
 */
class BranchSelectDialog {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.uiObjects = [];
    }

    /**
     * 팝업 열기
     * @param {string[]} branches - [결과키1, 결과키2]
     * @param {function} onSelect - (selectedKey) => void
     * @param {function} onCancel - () => void  (취소 시)
     */
    open(branches, onSelect, onCancel) {
        if (this.isOpen) return;
        if (!branches || branches.length !== 2) {
            console.warn('[BranchSelectDialog] 분기는 정확히 2개여야 함');
            return;
        }
        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 250;

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
            // 오버레이 클릭으로는 닫지 않음 (반드시 선택해야 함)
        });
        this.uiObjects.push(overlayZone);

        // 다이얼로그 박스
        const dw = Math.min(320, gw - 30);
        const dh = 280;
        const dx = (gw - dw) / 2;
        const dy = (gh - dh) / 2;

        const box = this.scene.add.graphics();
        box.fillStyle(0x233554, 1);
        box.fillRoundedRect(dx, dy, dw, dh, 10);
        box.lineStyle(2, 0xf1c40f, 0.8);
        box.strokeRoundedRect(dx, dy, dw, dh, 10);
        box.setDepth(depthBase + 1);
        this.uiObjects.push(box);

        // 제목
        const title = this.scene.add.text(
            gw / 2, dy + 16,
            '진화 분기 선택', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '17px',
                color: '#f1c40f',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(title);

        // 부제
        const subtitle = this.scene.add.text(
            gw / 2, dy + 42,
            '어느 쪽으로 진화시키겠습니까?', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: '#bbbbbb',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(subtitle);

        // 두 카드
        const cardW = 130;
        const cardH = 150;
        const cardGap = 14;
        const cardsTotalW = cardW * 2 + cardGap;
        const cardStartX = (gw - cardsTotalW) / 2;
        const cardY = dy + 75;

        for (let i = 0; i < 2; i++) {
            const cardX = cardStartX + i * (cardW + cardGap);
            this._createBranchCard(branches[i], cardX, cardY, cardW, cardH, depthBase, () => {
                this.close();
                if (onSelect) onSelect(branches[i]);
            });
        }

        // 취소 버튼 (작게, 하단)
        const cancelW = 80;
        const cancelH = 28;
        const cancelX = gw / 2 - cancelW / 2;
        const cancelY = dy + dh - cancelH - 10;

        const cancelBg = this.scene.add.graphics();
        cancelBg.fillStyle(0x7f8c8d, 1);
        cancelBg.fillRoundedRect(cancelX, cancelY, cancelW, cancelH, 5);
        cancelBg.setDepth(depthBase + 2);
        this.uiObjects.push(cancelBg);

        const cancelText = this.scene.add.text(
            cancelX + cancelW / 2, cancelY + cancelH / 2,
            '취소', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                color: '#ffffff',
            }
        ).setOrigin(0.5).setDepth(depthBase + 3);
        this.uiObjects.push(cancelText);

        const cancelZone = this.scene.add.zone(cancelX + cancelW / 2, cancelY + cancelH / 2, cancelW, cancelH);
        cancelZone.setInteractive({ useHandCursor: true });
        cancelZone.setDepth(depthBase + 4);
        cancelZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this.close();
            if (onCancel) onCancel();
        });
        this.uiObjects.push(cancelZone);
    }

    _createBranchCard(blockKey, x, y, w, h, depthBase, onClick) {
        const blockType = EvolutionManager.findBlockType(blockKey);
        if (!blockType) return;

        // 카드 배경 (블럭 색상 톤)
        const card = this.scene.add.graphics();
        card.fillStyle(0x1a1a2e, 1);
        card.fillRoundedRect(x, y, w, h, 8);
        card.lineStyle(2, blockType.color, 1);
        card.strokeRoundedRect(x, y, w, h, 8);
        card.setDepth(depthBase + 2);
        this.uiObjects.push(card);

        // 미니 블럭 미리보기 (상단)
        const previewSize = 50;
        const previewBg = this.scene.add.graphics();
        previewBg.fillStyle(blockType.color, 1);
        previewBg.fillRoundedRect(x + (w - previewSize) / 2, y + 12, previewSize, previewSize, 6);
        previewBg.setDepth(depthBase + 3);
        this.uiObjects.push(previewBg);

        // 약자 (미리보기 안에)
        const previewLabel = this.scene.add.text(
            x + w / 2, y + 12 + previewSize / 2,
            blockType.short || '?', {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 4);
        this.uiObjects.push(previewLabel);

        // 이름
        const nameText = this.scene.add.text(
            x + w / 2, y + 75,
            blockType.name, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 3);
        this.uiObjects.push(nameText);

        // 진화 가능한 직업 미리보기
        const evolvableJobs = this._getEvolvableHeroJobs(blockKey);
        const jobsText = evolvableJobs.length > 0 
            ? `→ ${evolvableJobs.join(' / ')}` 
            : '';

        const previewText = this.scene.add.text(
            x + w / 2, y + 102,
            jobsText, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#f1c40f',
                wordWrap: { width: w - 16 },
                align: 'center',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 3);
        this.uiObjects.push(previewText);

        // 클릭존
        const clickZone = this.scene.add.zone(x + w / 2, y + h / 2, w, h);
        clickZone.setInteractive({ useHandCursor: true });
        clickZone.setDepth(depthBase + 5);
        clickZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            if (onClick) onClick();
        });
        this.uiObjects.push(clickZone);
    }

    /**
     * 이 장비로 진화 가능한 직업 이름들 (미리보기용)
     */
    _getEvolvableHeroJobs(equipKey) {
        const tree = (CONFIG.EVOLUTION && CONFIG.EVOLUTION.HERO) || {};
        const jobs = [];
        for (const heroKey in tree) {
            const equipMap = tree[heroKey];
            if (equipMap[equipKey]) {
                const resultType = EvolutionManager.findBlockType(equipMap[equipKey]);
                if (resultType) jobs.push(resultType.name);
            }
        }
        return jobs.slice(0, 2);   // 최대 2개만 표시
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        for (const obj of this.uiObjects) {
            if (obj) obj.destroy();
        }
        this.uiObjects = [];
    }
}