/**
 * VillageTab.js
 * 시안 2번 "마을" 탭 — 건물 가로 스크롤
 *
 * 기존 LobbyVillage를 그대로 재활용. 영역(area)만 탭 기준으로 재계산.
 */
class VillageTab {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} area
     * @param {object} callbacks - { onShowToast }
     */
    constructor(scene, area, callbacks = {}) {
        this.scene = scene;
        this.area = area;
        this.callbacks = callbacks;

        this.village = null;
        this.container = null;

        this._build();
        this.hide();
    }

    _build() {
        this.container = this.scene.add.container(0, 0);

        this.village = new LobbyVillage(
            this.scene,
            this.area,
            (def, locked) => this._onBuildingTap(def, locked)
        );

        // LobbyVillage는 직접 scene에 자식을 생성하므로 show/hide 제어를 위해
        // 내부 container와 hitZone을 이 탭의 container에 묶는다.
        if (this.village.container) this.container.add(this.village.container);
        if (this.village.hitZone) this.container.add(this.village.hitZone);
    }

    _onBuildingTap(def, locked) {
        if (!this.callbacks.onShowToast) return;

        if (locked) {
            this.callbacks.onShowToast(`🔒 ${def.name} — 계정 Lv.${def.unlockLevel}에 해금`);
        } else {
            this.callbacks.onShowToast(`${def.icon} ${def.name} (준비 중 · Phase 3-5부터)`);
        }
    }

    show() {
        if (this.village) this.village.setVisible(true);
    }
    
    hide() {
        if (this.village) this.village.setVisible(false);
    }

    destroy() {
        if (this.village) {
            this.village.destroy();
            this.village = null;
        }
        this.container = null;
    }
}