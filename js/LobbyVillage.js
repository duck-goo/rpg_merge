/**
 * LobbyVillage.js
 * 로비 마을 영역 — 가로 스크롤 + 건물 배치
 *
 * 책임:
 * - 건물 타일 렌더링 (CONFIG.LOBBY_BUILDINGS 기준, 카테고리별 그룹)
 * - 가로 드래그 스크롤 (경계 클램핑, 콘텐츠가 좁으면 비활성)
 * - 건물 탭 감지 (드래그 거리 임계값으로 탭/드래그 구분)
 * - 잠금/해금 시각 표시 (계정 레벨 기반)
 *
 * Phase 3-3 기준:
 * - 탭 시 onBuildingTap 콜백에 { def, locked } 전달
 * - 실제 건물 UI(건설/레벨업/수거)는 Phase 3-5부터 추가
 */
class LobbyVillage {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} area - { x, y, width, height } 마을 영역 화면 좌표
     * @param {function} onBuildingTap - (buildingDef, locked) => void
     */
    constructor(scene, area, onBuildingTap) {
        this.scene = scene;
        this.area = area;
        this.onBuildingTap = onBuildingTap;

        // 레이아웃 상수 (CONFIG.LOBBY에서)
        this.TILE_SIZE = CONFIG.LOBBY.TILE_SIZE;
        this.TILE_GAP = CONFIG.LOBBY.TILE_GAP;
        this.CATEGORY_GAP = CONFIG.LOBBY.CATEGORY_GAP;
        this.SIDE_PADDING = 20;
        this.GROUND_Y_RATIO = 0.68;   // 건물 기단 y 위치 (area 내부 비율)
        this.TAP_THRESHOLD_PX = CONFIG.LOBBY.TAP_THRESHOLD_PX;

        // 상태
        this.container = null;
        this.maskShape = null;
        this.hitZone = null;
        this.buildingTiles = [];     // { def, localCenterX, localCenterY, size, locked }
        this.contentWidth = 0;
        this.minContainerX = 0;
        this.maxContainerX = 0;

        // 드래그 상태
        this._isDragging = false;
        this._pointerDownX = 0;
        this._containerStartX = 0;
        this._scrollEnabled = false;

        this._build();
        this._setupScroll();
    }

    // ─── 초기 구성 ─────────────────────

    _build() {
        const { x: ax, y: ay, width: aw, height: ah } = this.area;

        // 배경: 하늘 + 땅 (마을 영역 내부에만)
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x2c3e50, 1);
        bg.fillRect(ax, ay, aw, ah * this.GROUND_Y_RATIO);
        bg.fillStyle(0x3a5a40, 1);
        bg.fillRect(ax, ay + ah * this.GROUND_Y_RATIO, aw, ah * (1 - this.GROUND_Y_RATIO));
        this.bg = bg;   // ← 추가: destroy 시 정리용

        // 마스크: 스크롤된 건물이 영역 밖으로 삐져나오지 않게
        const maskShape = this.scene.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(ax, ay, aw, ah);
        this.maskShape = maskShape;

        const mask = maskShape.createGeometryMask();

        // 건물 컨테이너 (스크롤 대상)
        // 주의: 컨테이너 좌표는 (0,0) 기준. 자식들은 area 기준 상대 좌표로 배치.
        const container = this.scene.add.container(ax, ay);
        container.setMask(mask);
        this.container = container;

        // 건물 배치
        this._placeBuildings();

        // 스크롤 경계 계산
        // 콘텐츠가 영역보다 좁으면 스크롤 불필요
        if (this.contentWidth <= aw) {
            this._scrollEnabled = false;
            this.minContainerX = ax;
            this.maxContainerX = ax;
        } else {
            this._scrollEnabled = true;
            this.minContainerX = ax - (this.contentWidth - aw);  // 오른쪽 끝까지 갈 때
            this.maxContainerX = ax;                              // 왼쪽 끝(초기 위치)
        }
    }

    /**
 * 마을 상태 변경 시 모든 타일 재렌더링
 * (건설/레벨업 후 호출)
 */
    refresh() {
        // 기존 타일의 모든 표시 객체 파괴
        for (const tile of this.buildingTiles) {
            for (const obj of tile.displayObjects) {
                if (obj) obj.destroy();
            }
        }
        // 카테고리 라벨도 같이 있으므로, container 내용을 전부 비우고 재생성하는 게 안전
        if (this.container) {
            this.container.removeAll(true);
        }

        this.buildingTiles = [];
        this.contentWidth = 0;

        // 다시 배치
        this._placeBuildings();

        // 스크롤 경계 재계산
        const aw = this.area.width;
        if (this.contentWidth <= aw) {
            this._scrollEnabled = false;
            this.minContainerX = this.area.x;
            this.maxContainerX = this.area.x;
        } else {
            this._scrollEnabled = true;
            this.minContainerX = this.area.x - (this.contentWidth - aw);
            this.maxContainerX = this.area.x;
        }

        // 스크롤 위치 재보정 (이전보다 콘텐츠가 좁아졌다면)
        this.container.x = Math.max(this.minContainerX, Math.min(this.maxContainerX, this.container.x));
    }

    _placeBuildings() {
        const buildings = CONFIG.LOBBY_BUILDINGS;
        const { height: ah } = this.area;

        const order = ['production', 'passive_basic', 'passive_job', 'passive_system'];
        const catLabels = {
            production: '생산',
            passive_basic: '기본 패시브',
            passive_job: '직업 패시브',
            passive_system: '시스템',
        };

        let cursorX = this.SIDE_PADDING;
        const tileCenterY = ah * this.GROUND_Y_RATIO - this.TILE_SIZE / 2 - 4;
        const catLabelY = ah * this.GROUND_Y_RATIO + 16;

        for (const cat of order) {
            const list = buildings.filter(b => b.category === cat);
            if (list.length === 0) continue;

            const catStartX = cursorX;

            for (const def of list) {
                const tileCenterX = cursorX + this.TILE_SIZE / 2;
                const tile = this._createBuildingTile(def, tileCenterX, tileCenterY);
                this.container.add(tile.displayObjects);
                this.buildingTiles.push(tile);
                cursorX += this.TILE_SIZE + this.TILE_GAP;
            }

            // 카테고리 라벨
            const catEndX = cursorX - this.TILE_GAP;
            const catCenterX = (catStartX + catEndX) / 2;
            const catLabel = this.scene.add.text(catCenterX, catLabelY, catLabels[cat] || cat, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#aaaaaa',
            }).setOrigin(0.5, 0);
            this.container.add(catLabel);

            cursorX += this.CATEGORY_GAP;
        }

        this.contentWidth = cursorX - this.CATEGORY_GAP + this.SIDE_PADDING;
    }

    /**

     * 건물 타일 생성 (3상태: locked / unbuilt / built)
     */
    _createBuildingTile(def, centerX, centerY) {
        const size = this.TILE_SIZE;
        const displayObjects = [];

        // Phase 3-5: BuildingManager로 상태 조회
        const state = BuildingManager.getState(def.id);
        const save = BuildingManager.getSave(def.id);
        const locked = state === 'locked';
        const unbuilt = state === 'unbuilt';
        const built = state === 'built';

        // 배경색 + 테두리
        const bgColor = locked ? 0x1a1a2e : (unbuilt ? 0x2a2a3e : 0x16213e);
        const borderColor = locked ? 0x555555 : (unbuilt ? 0x8a7042 : 0x5c6b8c);

        const bg = this.scene.add.graphics();
        bg.fillStyle(bgColor, 1);
        bg.lineStyle(2, borderColor, 1);
        bg.fillRoundedRect(centerX - size / 2, centerY - size / 2, size, size, 6);
        bg.strokeRoundedRect(centerX - size / 2, centerY - size / 2, size, size, 6);
        displayObjects.push(bg);

        // 아이콘
        const icon = this.scene.add.text(centerX, centerY - 6, def.icon, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '30px',
        }).setOrigin(0.5);
        if (locked) icon.setAlpha(0.3);
        else if (unbuilt) icon.setAlpha(0.55);
        displayObjects.push(icon);

        // 이름
        const nameColor = locked ? '#666666' : (unbuilt ? '#c5a970' : '#ffffff');
        const nameText = this.scene.add.text(centerX, centerY + size / 2 - 10, def.name, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: nameColor,
        }).setOrigin(0.5);
        displayObjects.push(nameText);

        // 상태별 오버레이
        if (locked) {
            const lock = this.scene.add.text(centerX, centerY - 2, '🔒', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '20px',
            }).setOrigin(0.5);
            displayObjects.push(lock);
        } else if (unbuilt) {
            // "건설 가능" 아이콘 (우상단 작게)
            const hammer = this.scene.add.text(
                centerX + size / 2 - 8, centerY - size / 2 + 8,
                '🔨', {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12px',
                }
            ).setOrigin(0.5);
            displayObjects.push(hammer);
        } else if (built) {
            // Lv.N 뱃지 (좌상단)
            const lvBg = this.scene.add.graphics();
            lvBg.fillStyle(0xf1c40f, 1);
            lvBg.fillRoundedRect(centerX - size / 2 + 3, centerY - size / 2 + 3, 28, 14, 3);
            displayObjects.push(lvBg);
            
            const lvText = this.scene.add.text(
                centerX - size / 2 + 17, centerY - size / 2 + 10,
                `Lv.${save.level}`, {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '9px',
                    color: '#000000',
                    fontStyle: 'bold',
                }
            ).setOrigin(0.5);
            displayObjects.push(lvText);
        
            // ★ Phase 3-7: 생산 건물이 상한 도달 시 ❗ 뱃지 (우상단)
            if (typeof ProductionManager !== 'undefined' && ProductionManager.hasProduction(def.id)) {
                const stock = ProductionManager.getStock(def.id);
                if (stock.full) {
                    const exBg = this.scene.add.graphics();
                    exBg.fillStyle(0xe74c3c, 1);
                    exBg.fillCircle(centerX + size / 2 - 8, centerY - size / 2 + 8, 8);
                    displayObjects.push(exBg);
                
                    const exText = this.scene.add.text(
                        centerX + size / 2 - 8, centerY - size / 2 + 8,
                        '!', {
                            fontFamily: 'Arial, sans-serif',
                            fontSize: '11px',
                            color: '#ffffff',
                            fontStyle: 'bold',
                        }
                    ).setOrigin(0.5);
                    displayObjects.push(exText);
                }
            }
        }

    return {
        def,
        localCenterX: centerX,
        localCenterY: centerY,
        size,
        locked,
        displayObjects,
    };
}

    // ─── 스크롤 & 탭 ─────────────────────

    _setupScroll() {
        const { x: ax, y: ay, width: aw, height: ah } = this.area;

        const zone = this.scene.add.zone(ax + aw / 2, ay + ah / 2, aw, ah);
        zone.setInteractive();
        this.hitZone = zone;

        zone.on('pointerdown', (pointer) => {
            this._isDragging = false;
            this._pointerDownX = pointer.x;
            this._containerStartX = this.container.x;
        });

        zone.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            if (!this._scrollEnabled) return;

            const dx = pointer.x - this._pointerDownX;
            if (!this._isDragging && Math.abs(dx) > this.TAP_THRESHOLD_PX) {
                this._isDragging = true;
            }

            if (this._isDragging) {
                let newX = this._containerStartX + dx;
                newX = Math.max(this.minContainerX, Math.min(this.maxContainerX, newX));
                this.container.x = newX;
            }
        });

        zone.on('pointerup', (pointer) => {
            if (!this._isDragging) {
                this._handleTap(pointer.x, pointer.y);
            }
            this._isDragging = false;
        });

        zone.on('pointerupoutside', () => {
            this._isDragging = false;
        });
    }

    _handleTap(screenX, screenY) {
        // 컨테이너가 얼마나 왼쪽으로 이동했는지
        const offsetX = this.container.x - this.area.x;

        for (const tile of this.buildingTiles) {
            // 타일의 현재 화면상 중심 좌표
            const tileScreenX = this.area.x + offsetX + tile.localCenterX;
            const tileScreenY = this.area.y + tile.localCenterY;
            const half = tile.size / 2;

            if (
                screenX >= tileScreenX - half && screenX <= tileScreenX + half &&
                screenY >= tileScreenY - half && screenY <= tileScreenY + half
            ) {
                if (this.onBuildingTap) this.onBuildingTap(tile.def, tile.locked);
                return;
            }
        }
    }

        /**
     * 탭 전환 시 마을 전체 표시/숨김
     */
    setVisible(visible) {
        if (this.bg) this.bg.setVisible(visible);
        if (this.container) this.container.setVisible(visible);
        if (this.hitZone) {
            this.hitZone.setVisible(visible);
            // 숨겨진 상태에서는 드래그 캡처도 막아야 함
            if (visible) {
                this.hitZone.setInteractive();
            } else {
                this.hitZone.disableInteractive();
            }
        }
    }
    /**
     * 씬 종료 시 정리
     * Phaser가 자식 GameObject를 자동 파괴하지만, 리스너 정리는 명시적으로 해두는 게 안전
     */
    destroy() {
        if (this.hitZone) {
            this.hitZone.removeAllListeners();
            this.hitZone.destroy();
            this.hitZone = null;
        }
        if (this.bg) {
            this.bg.destroy();
            this.bg = null;
        }
        if (this.maskShape) {
            this.maskShape.destroy();
            this.maskShape = null;
        }
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
}