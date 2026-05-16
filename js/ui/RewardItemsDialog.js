/**
 * RewardItemsDialog.js
 * 던전 클리어 보상 블럭 목록 팝업
 * 창고 탭 진입 시 대기 블럭이 있으면 자동 표시
 *
 * 사용:
 *   const dialog = new RewardItemsDialog(scene);
 *   dialog.show({ onConfirm: () => { ... } });
 */
class RewardItemsDialog {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.uiObjects = [];
    }

    show(opts = {}) {
        if (this.isOpen) return;

        const groups = StorageManager.getPendingGrouped();
        if (groups.length === 0) {
            if (opts.onConfirm) opts.onConfirm();
            return;
        }

        this.isOpen = true;

        const { width: gw, height: gh } = this.scene.scale;
        const depthBase = 420;

        // 팝업 크기는 "화면에 맞춘 최대" 고정. 리스트가 넘치면 스크롤로 해결
        const itemH = 44;
        const headerH = 100;
        const footerH = 70;

        // 리스트 영역 최대 높이: 화면 높이의 45% 정도
        const maxListH = Math.floor(gh * 0.45);
        const desiredListH = groups.length * itemH;
        const listH = Math.min(desiredListH, maxListH);

        const dw = 300;
        const dh = headerH + listH + footerH;
        const dx = (gw - dw) / 2;
        const dy = (gh - dh) / 2;

        // 오버레이
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.8);
        overlay.fillRect(0, 0, gw, gh);
        overlay.setDepth(depthBase);
        this.uiObjects.push(overlay);

        const overlayZone = this.scene.add.zone(gw / 2, gh / 2, gw, gh);
        overlayZone.setInteractive();
        overlayZone.setDepth(depthBase);
        overlayZone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
        });
        this.uiObjects.push(overlayZone);

        // 박스
        const box = this.scene.add.graphics();
        box.fillStyle(0x1a2540, 1);
        box.lineStyle(2, 0xf1c40f, 1);
        box.fillRoundedRect(dx, dy, dw, dh, 12);
        box.strokeRoundedRect(dx, dy, dw, dh, 12);
        box.setDepth(depthBase + 1);
        this.uiObjects.push(box);

        // 타이틀
        const titleText = this.scene.add.text(
            dx + dw / 2, dy + 20,
            '🎁 던전 클리어 보상', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '17px',
                color: '#f1c40f',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(titleText);

        // 서브
        const subTextMsg = desiredListH > maxListH
            ? '위/아래로 드래그해 전체 확인'
            : '다음 블럭을 창고에 보관합니다';
        const subText = this.scene.add.text(
            dx + dw / 2, dy + 50,
            subTextMsg, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#aaaaaa',
            }
        ).setOrigin(0.5, 0).setDepth(depthBase + 2);
        this.uiObjects.push(subText);

        // ─── 스크롤 가능한 리스트 영역 ───
        const listAreaX = dx;
        const listAreaY = dy + headerH;
        const listAreaW = dw;
        this._renderScrollableList(
            groups,
            listAreaX, listAreaY, listAreaW, listH,
            itemH, depthBase + 2
        );

        // 확인 버튼
        const btnW = 160;
        const btnH = 40;
        const btnX = dx + (dw - btnW) / 2;
        const btnY = dy + dh - btnH - 18;

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x27ae60, 1);
        bg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
        bg.setDepth(depthBase + 2);
        this.uiObjects.push(bg);

        const label = this.scene.add.text(
            btnX + btnW / 2, btnY + btnH / 2,
            '확인', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '15px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depthBase + 3);
        this.uiObjects.push(label);

        const zone = this.scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH);
        zone.setInteractive({ useHandCursor: true });
        zone.setDepth(depthBase + 4);
        zone.on('pointerdown', (pointer, lx, ly, event) => {
            event.stopPropagation();
            this._onConfirm(opts);
        });
        this.uiObjects.push(zone);
    }
    
    /**
     * 스크롤 가능한 리스트 영역 렌더링
     * - 마스크로 리스트 영역 밖을 가림
     * - 드래그로 세로 스크롤 (콘텐츠가 영역보다 클 때만)
     */
    _renderScrollableList(groups, areaX, areaY, areaW, areaH, itemH, depth) {
        // 리스트 컨테이너 (스크롤 대상)
        const listContainer = this.scene.add.container(areaX, areaY);
        listContainer.setDepth(depth);
        this.uiObjects.push(listContainer);

        // 마스크 그래픽
        const maskShape = this.scene.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(areaX, areaY, areaW, areaH);
        const mask = maskShape.createGeometryMask();
        listContainer.setMask(mask);

        // destroy 시 정리될 수 있도록 uiObjects에 shape도 넣음
        this.uiObjects.push(maskShape);

        // 아이템들 (컨테이너 로컬 좌표 = 0,0 기준으로 배치)
        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            const rowObjects = this._renderItemRowInContainer(g, 0, i * itemH, areaW, depth);
            for (const obj of rowObjects) {
                listContainer.add(obj);
            }
        }

        // 스크롤 설정
        const contentH = groups.length * itemH;
        const canScroll = contentH > areaH;
        const minY = areaY - (contentH - areaH);   // 끝까지 올렸을 때
        const maxY = areaY;                         // 최초 위치

        // 드래그 히트존 (리스트 영역)
        const hitZone = this.scene.add.zone(
            areaX + areaW / 2, areaY + areaH / 2,
            areaW, areaH
        );
        hitZone.setInteractive();
        hitZone.setDepth(depth);
        this.uiObjects.push(hitZone);

        // 드래그 상태
        let isDragging = false;
        let pointerDownY = 0;
        let containerStartY = 0;

        hitZone.on('pointerdown', (pointer) => {
            isDragging = false;
            pointerDownY = pointer.y;
            containerStartY = listContainer.y;
        });

        hitZone.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            if (!canScroll) return;

            const dy = pointer.y - pointerDownY;
            if (!isDragging && Math.abs(dy) > 4) {
                isDragging = true;
            }

            if (isDragging) {
                let newY = containerStartY + dy;
                newY = Math.max(minY, Math.min(maxY, newY));
                listContainer.y = newY;
            }
        });

        hitZone.on('pointerup', () => { isDragging = false; });
        hitZone.on('pointerupoutside', () => { isDragging = false; });

        // 스크롤 힌트 (콘텐츠 많을 때 상하단 표시)
        if (canScroll) {
            const hintTop = this.scene.add.text(
                areaX + areaW - 10, areaY + 4,
                '▲', {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10px',
                    color: '#666666',
                }
            ).setOrigin(1, 0).setDepth(depth + 1);
            this.uiObjects.push(hintTop);

            const hintBottom = this.scene.add.text(
                areaX + areaW - 10, areaY + areaH - 4,
                '▼', {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10px',
                    color: '#666666',
                }
            ).setOrigin(1, 1).setDepth(depth + 1);
            this.uiObjects.push(hintBottom);
        }
    }

    /**
     * 한 행을 컨테이너용 로컬 좌표로 생성
     */
    _renderItemRowInContainer(group, localX, localY, areaW, depth) {
        const tileSize = 32;
        const tileX = localX + 24;
        const tileY = localY + 4;

        const objects = [];

        // 블럭 미니 타일
        const tileBg = this.scene.add.graphics();
        tileBg.fillStyle(group.blockType.color, 1);
        tileBg.fillRoundedRect(tileX, tileY, tileSize, tileSize, 4);
        tileBg.setDepth(depth);
        objects.push(tileBg);

        // 등급
        const gradeText = this.scene.add.text(
            tileX + tileSize / 2, tileY + tileSize / 2,
            String(group.grade), {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setOrigin(0.5).setDepth(depth + 1);
        objects.push(gradeText);

        // 이름
        const nameText = this.scene.add.text(
            tileX + tileSize + 14, tileY + 4,
            `${group.blockType.name} Lv.${group.grade}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '13px',
                color: '#ffffff',
                fontStyle: 'bold',
            }
        ).setDepth(depth);
        objects.push(nameText);

        // 개수
        const countText = this.scene.add.text(
            localX + areaW - 24, tileY + tileSize / 2,
            `×${group.count}`, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                color: '#f1c40f',
                fontStyle: 'bold',
            }
        ).setOrigin(1, 0.5).setDepth(depth);
        objects.push(countText);

        return objects;
    }

    _onConfirm(opts) {
        const result = StorageManager.confirmPending();
        this._close(() => {
            if (opts.onConfirm) opts.onConfirm(result);
        });
    }

    _close(afterClose) {
        if (!this.isOpen) return;
        this.isOpen = false;

        for (const obj of this.uiObjects) {
            if (obj) obj.destroy();
        }
        this.uiObjects = [];

        if (afterClose) afterClose();
    }

    destroy() {
        this._close(null);
    }
}