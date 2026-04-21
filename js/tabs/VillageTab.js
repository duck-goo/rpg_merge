/**
 * VillageTab.js
 * Phase 3-6: 건물 탭 시 BuildingDetailUI 팝업 오픈
 *
 * 변경점:
 * - 토스트 대신 팝업으로 상세 표시
 * - 잠금 건물은 여전히 토스트 (팝업 열 내용 없음)
 * - 탭 이탈(hide) 시 팝업 자동 닫기
 */
class VillageTab {
    constructor(scene, area, callbacks = {}) {
        this.scene = scene;
        this.area = area;
        this.callbacks = callbacks;

        this.village = null;
        this.buildingDetail = null;

        this._boundRefreshVillage = null;

        this._build();
        this._bindEvents();
        this.hide();
    }

    _build() {
        this.village = new LobbyVillage(
            this.scene,
            this.area,
            (def, locked) => this._onBuildingTap(def, locked)
        );

        // 팝업 매니저 (단일 인스턴스)
        this.buildingDetail = new BuildingDetailUI(
            this.scene,
            (msg) => {
                if (this.callbacks.onShowToast) this.callbacks.onShowToast(msg);
            }
        );
    }

    _bindEvents() {
        this._boundRefreshVillage = () => {
            if (this.village) this.village.refresh();
        };
        EventBus.on('building:changed', this._boundRefreshVillage);
        EventBus.on('account:changed', this._boundRefreshVillage);
    }

    _onBuildingTap(def, locked) {
        // 잠금 상태는 팝업 대신 간단 토스트
        if (locked) {
            if (this.callbacks.onShowToast) {
                this.callbacks.onShowToast(`🔒 ${def.name} — 계정 Lv.${def.unlockLevel}에 해금`);
            }
            return;
        }

        // 해제된 건물(미건설/건설됨) → 팝업 오픈
        if (this.buildingDetail) {
            this.buildingDetail.open(def.id);
        }
    }

    show() {
        if (this.village) this.village.setVisible(true);
    }

    hide() {
        // 탭 이탈 시 팝업 강제 닫기 (다른 탭 위에 뜨지 않도록)
        if (this.buildingDetail && this.buildingDetail.isOpen) {
            this.buildingDetail.close();
        }
        if (this.village) this.village.setVisible(false);
    }

    destroy() {
        if (this._boundRefreshVillage) {
            EventBus.off('building:changed', this._boundRefreshVillage);
            EventBus.off('account:changed', this._boundRefreshVillage);
            this._boundRefreshVillage = null;
        }
        if (this.buildingDetail) {
            this.buildingDetail.destroy();
            this.buildingDetail = null;
        }
        if (this.village) {
            this.village.destroy();
            this.village = null;
        }
    }
}