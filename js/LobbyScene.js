/**
 * LobbyScene.js
 * Phase 3-3 재설계 — 5탭 내비게이션 기반
 *
 * 구성:
 * - TopHud (상시)
 * - 5개 탭 인스턴스 (show/hide로 전환)
 * - TabBar (상시)
 * - Toast (공용)
 *
 * 초기 진입 탭: CONFIG.DEFAULT_TAB_ID (던전)
 */
class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });

        this.topHud = null;
        this.tabBar = null;
        this.toast = null;
        this.levelUpDialog = null;

        // 탭 인스턴스 맵 { tabId: instance }
        this.tabInstances = {};
        this.currentTabId = null;
    }

    create() {
        const { width, height } = this.scale;
        const L = CONFIG.LOBBY_LAYOUT;

        console.log('[LobbyScene] create (tab nav)');

        // ★ 추가: Phaser 씬 재사용 시 이전 상태가 남는 문제 방지
        this.currentTabId = null;
        this.tabInstances = {};

        // 영역 계산
        const hudArea = { x: 0, y: 0, width, height: L.HUD_HEIGHT };
        const tabBarArea = { x: 0, y: height - L.TABBAR_HEIGHT, width, height: L.TABBAR_HEIGHT };
        const contentArea = {
            x: 0,
            y: L.HUD_HEIGHT,
            width,
            height: height - L.HUD_HEIGHT - L.TABBAR_HEIGHT,
        };

        // 상단 HUD
        this.topHud = new TopHud(this, hudArea, {
            onAccountTap: () => this._showToast('👤 계정 상세 (Phase 3-21에서 연결)'),
            onResourcesTap: () => this._showToast('🛒 상점 (Phase 4에서 연결)'),
            onShopTap: () => this._showToast('🛒 상점 (Phase 4에서 연결)'),
        });

        // 토스트 (탭바 바로 위)
        this.toast = new Toast(this, tabBarArea.y - 24);

        // 탭 인스턴스 생성 (모두 숨김 상태로 시작)
        this._createAllTabs(contentArea);

        // 탭바
        this.tabBar = new TabBar(this, tabBarArea, (tabId) => this._switchTab(tabId));

        // 초기 탭 활성화
        this._switchTab(CONFIG.DEFAULT_TAB_ID);

        // Phase 3-8: 레벨업 팝업 준비
        this.levelUpDialog = new LevelUpDialog(this);

        // 초기 탭 활성화
        this._switchTab(CONFIG.DEFAULT_TAB_ID);

        // 씬 종료 시 정리
        this.events.once('shutdown', this._onShutdown, this);

        // ★ 추가: 로비 진입 시 pendingLevelUp 있으면 팝업 표시
        // delay: 탭이 렌더된 뒤에 팝업이 올라오도록
        this.time.delayedCall(300, () => this._checkPendingLevelUp());

        // 씬 종료 시 정리
        this.events.once('shutdown', this._onShutdown, this);
    }

    _createAllTabs(contentArea) {
        // 던전 탭 (메인)
        this.tabInstances['dungeon'] = new DungeonTab(this, contentArea, {
            onEnterDungeon: () => this._onEnterDungeon(),
            onShowToast: (msg) => this._showToast(msg),
        });

        // 마을 탭 (기존 LobbyVillage)
        this.tabInstances['village'] = new VillageTab(this, contentArea, {
            onShowToast: (msg) => this._showToast(msg),
        });

        // 영웅 탭 (플레이스홀더)
        this.tabInstances['hero'] = new PlaceholderTab(this, contentArea, {
            icon: '👤',
            title: '영웅',
            description: '던전에서 영웅 블럭을 모으면\n여기서 영웅을 소환할 수 있습니다.',
            phaseLabel: 'Phase 3-12에서 연결',
        });

        // 창고 탭 (플레이스홀더)
        this.tabInstances['storage'] = new StorageTab(this, contentArea, {
            onShowToast: (msg) => this._showToast(msg),
        });

        // 이벤트 탭 (플레이스홀더)
        this.tabInstances['event'] = new PlaceholderTab(this, contentArea, {
            icon: '🎁',
            title: '이벤트',
            description: '퀘스트, 일일 로그인 보상,\n이벤트 던전이 여기 모입니다.',
            phaseLabel: 'Phase 3-15 / 3-18에서 연결',
        });
    }

    /**
     * Phase 3-8: pendingLevelUp 있으면 축하 팝업 표시
     */
    _checkPendingLevelUp() {
        const pending = GameData.meta.pendingLevelUp;
        if (!pending) return;

        // pending 즉시 제거 (팝업 열린 후 탭 이동 등으로 재표시 방지)
        GameData.meta.pendingLevelUp = null;
        SaveManager.save();

        if (this.levelUpDialog) {
            this.levelUpDialog.show(pending);
        }
    }

    /**
     * 탭 전환
     * 이전 탭.hide() → 새 탭.show() → HUD 페이지 이름 갱신
     */
    _switchTab(tabId) {
        // 같은 탭이면 무시 (단, 최초 진입 시에는 반드시 show 실행)
        if (tabId === this.currentTabId && this.currentTabId !== null) return;

        // 이전 탭 숨김
        if (this.currentTabId && this.tabInstances[this.currentTabId]) {
            this.tabInstances[this.currentTabId].hide();
        }

        // 새 탭 표시
        const newTab = this.tabInstances[tabId];
        if (!newTab) {
            console.warn(`[LobbyScene] 알 수 없는 탭: ${tabId}`);
            return;
        }
        newTab.show();
        this.currentTabId = tabId;

        // TabBar 강조 상태 동기화
        if (this.tabBar) this.tabBar.setActive(tabId);

        // 페이지 이름 갱신
        const tabDef = CONFIG.TABS.find(t => t.id === tabId);
        if (tabDef && this.topHud) {
            this.topHud.setPageName(tabDef.pageName);
        }

        console.log(`[LobbyScene] 탭 전환: ${tabId}`);
    }

    _onEnterDungeon() {
        // 1. 식량 체크 및 차감
        const result = RewardManager.consumeDungeonEntry();
        if (!result.success) {
            this._showToast(`⚠️ ${result.reason}`);
            return;
        }

        // 2. 스테이지 인덱스 초기화
        GameData.stage.currentIndex = 0;
        SaveManager.save();   // 즉시 저장 (씬 전환 직전)

        console.log('[LobbyScene] 던전 입장 → DungeonScene');
        this.scene.start('DungeonScene');
    }

    _showToast(message) {
        if (this.toast) this.toast.show(message);
    }

    _onShutdown() {
        console.log('[LobbyScene] shutdown → cleanup');

        for (const tabId in this.tabInstances) {
            if (this.tabInstances[tabId]) {
                this.tabInstances[tabId].destroy();
            }
        }
        this.tabInstances = {};

        if (this.topHud) { this.topHud.destroy(); this.topHud = null; }
        if (this.tabBar) { this.tabBar.destroy(); this.tabBar = null; }
        if (this.toast)  { this.toast.destroy();  this.toast = null; }
        if (this.levelUpDialog) { this.levelUpDialog.destroy(); this.levelUpDialog = null; }  // ★
    }
}