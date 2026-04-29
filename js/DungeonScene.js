/**
 * DungeonScene.js (구 GameScene.js)
 * Phase 3-2: 씬 분리 — 던전(전투)만 담당
 *
 * 변경점:
 * - 클래스명 GameScene → DungeonScene
 * - scene key 'GameScene' → 'DungeonScene'
 * - [로비로] 버튼 추가 (상단 좌측)
 * - 모든 스테이지 클리어 시 자동 로비 복귀
 * - GameData.stage.currentIndex 반영 + highestCleared 갱신
 */
class DungeonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DungeonScene' });
        this.boardInfo = null;
        this.boardManager = null;
        this.combatManager = null;
        this.stageManager = null;
        this.inventoryManager = null;
        this.inventoryUI = null;

        this.enemyHpBar = null;
        this.enemyHpText = null;
        this.enemyNameText = null;
        this.playerHpBar = null;
        this.playerHpText = null;
        this.messageText = null;
        this.stageText = null;
        this.retryManager = null;
        this.retryDialogUI = null;
        this.tutorialManager = null;
        this.tutorialDialogUI = null;

        // Phase 3-2 신규
        this.lobbyBtnBg = null;
        this.lobbyBtnText = null;
        this.lobbyBtnZone = null;
        this._confirmDialog = null;   // ★ 추가
    }

    preload() {}

    create() {
        const { width, height } = this.scale;

        console.log('[DungeonScene] create (stage index = ' + GameData.stage.currentIndex + ')');

        this.boardInfo = this._calculateBoardLayout(width, height);

        this._drawBoardBackground();

        this.boardManager = new BoardManager(this, this.boardInfo);
        this.stageManager = new StageManager(this);
        this.inventoryManager = new InventoryManager(this);
        this.inventoryUI = new InventoryUI(this, this.inventoryManager);
        this.retryManager = new RetryManager(this);
        this.retryDialogUI = new RetryDialogUI(this, this.retryManager);
        this.tutorialManager = new TutorialManager(this);
        this.tutorialDialogUI = new TutorialDialogUI(this);

        const stageData = this.stageManager.getCurrentStage();
        this.combatManager = new CombatManager(this, stageData.enemy);

        this._createEnemyUI(width, height);
        this._createPlayerUI(width, height);
        this._createButtons(width, height);
        this._createLobbyButton(width, height);   // Phase 3-2 신규
        this._createMessageArea(width, height);

        this._setupDragEvents();

        console.log('[DungeonScene] Phase 3-2: 씬 분리 완료');
        this.time.delayedCall(300, () => this._tryShowTutorial());
    }

    update(time, delta) {}

    // ─── Phase 3-2 신규: 로비 복귀 버튼 ─────────────────────────────

    _createLobbyButton(gameWidth, gameHeight) {
        const btnW = 56;
        const btnH = 24;
        const btnX = 8;
        const btnY = 8;

        this.lobbyBtnBg = this.add.graphics();
        this.lobbyBtnBg.fillStyle(0x555555, 1);
        this.lobbyBtnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 4);

        this.lobbyBtnText = this.add.text(
            btnX + btnW / 2, btnY + btnH / 2,
            '로비로',
            {
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                color: '#ffffff',
            }
        ).setOrigin(0.5);

        const zone = this.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH);
        zone.setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => this._returnToLobby());
        this.lobbyBtnZone = zone;
    }

    _returnToLobby() {
        // 확인 다이얼로그 생성 (씬 종료 전 임시 생성)
        if (!this._confirmDialog) {
            this._confirmDialog = new ConfirmDialog(this);
        }

        this._confirmDialog.show({
            title: '도전 포기',
            message: '현재 도전을 포기하시겠습니까?\n\n인벤토리의 블럭은 모두 사라집니다.\n(최종 스테이지 클리어 시에만 창고로 이관됩니다)',
            confirmLabel: '포기',
            cancelLabel: '계속 도전',
            confirmColor: 0xc0392b,
            onConfirm: () => this._doReturnToLobby(false),   // 이관 없음
        });
    }

    /**
     * 실제 로비 복귀 처리
     * @param {boolean} transferInventory - true면 인벤→창고 이관
     */
    _doReturnToLobby(transferInventory) {
        if (transferInventory) {
            this._addInventoryToPending();
        } else {
            // 이관 없이 소멸
            if (this.inventoryManager) this.inventoryManager.clearAll();
        }

        console.log('[DungeonScene] → LobbyScene (transfer=' + transferInventory + ')');
        this.scene.start('LobbyScene');
    }

    /**
     * 던전 인벤 → 로비 대기 목록에 추가
     */
    _addInventoryToPending() {
        if (!this.inventoryManager) return;
        if (typeof StorageManager === 'undefined') return;

        const items = (this.inventoryManager.items || []).filter(it => it !== null);
        if (items.length === 0) return;

        StorageManager.addPending(items);
        this.inventoryManager.clearAll();
    }

    /**
     * Phase 3-10: 던전 인벤 → 로비 창고 이관
     */
    _transferInventoryToStorage() {
        if (!this.inventoryManager) return;
        if (typeof StorageManager === 'undefined') return;

        // null 제외한 유효 아이템만
        const items = (this.inventoryManager.items || []).filter(it => it !== null);
        if (items.length === 0) return;

        const count = StorageManager.transferFromDungeon(items);
        this.inventoryManager.clearAll();

        if (count > 0) {
            console.log(`[DungeonScene] 창고 이관: ${count}개`);
        }
    }

    // ─── 스테이지 전환 ─────────────────────────────

    _goToNextStage() {
        const sm = this.stageManager;

        if (!sm.hasNextStage()) {
            this._showMessage('모든 스테이지 클리어! 로비로 이동...');
            // 최종 클리어 → 자동 로비 복귀
            this.time.delayedCall(2500, () => this._returnToLobby());
            return;
        }

        sm.isTransitioning = true;
        sm.advance();

        // GameData 동기화
        GameData.stage.currentIndex = sm.currentIndex;
        SaveManager.requestSave();

        const stageData = sm.getCurrentStage();
        this.combatManager = new CombatManager(this, stageData.enemy);

        this.boardManager.resetBoard();
        if (this.retryManager) this.retryManager.resetForNewStage();

        this._refreshAllUI();
        this._showMessage(`스테이지 ${sm.getStageNumber()} 시작!`);

        sm.isTransitioning = false;
        this.time.delayedCall(600, () => this._tryShowTutorial());
    }

    _restartStage() {
        const sm = this.stageManager;

        sm.isTransitioning = true;
        sm.restart();

        const stageData = sm.getCurrentStage();
        this.combatManager = new CombatManager(this, stageData.enemy);

        this.boardManager.resetBoard();
        this.inventoryManager.clearAll();
        if (this.retryManager) this.retryManager.resetForNewStage();

        this._refreshAllUI();
        this._showMessage(`스테이지 ${sm.getStageNumber()} 시작!`);

        sm.isTransitioning = false;
        this.time.delayedCall(600, () => this._tryShowTutorial());
    }

    // ─── 전투 UI 생성 ─────────────────────────────

    _createEnemyUI(gameWidth, gameHeight) {
        const y = gameHeight * CONFIG.LAYOUT.ENEMY_Y;
        const h = gameHeight * CONFIG.LAYOUT.ENEMY_HEIGHT;
        const centerY = y + h / 2;

        this.stageText = this.add.text(gameWidth / 2, y + 6, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#888888',
        }).setOrigin(0.5, 0);

        this.enemyNameText = this.add.text(gameWidth / 2, centerY - 20, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#cccccc',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        const barWidth = 200;
        const barHeight = 16;
        const barX = (gameWidth - barWidth) / 2;
        const barY = centerY;

        const barBg = this.add.graphics();
        barBg.fillStyle(0x333333, 1);
        barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

        this.enemyHpBar = this.add.graphics();

        this.enemyHpText = this.add.text(gameWidth / 2, barY + barHeight + 4, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#999999',
        }).setOrigin(0.5, 0);

        this._enemyBarInfo = { x: barX, y: barY, w: barWidth, h: barHeight };
        this._refreshEnemyUI();
    }

    _createPlayerUI(gameWidth, gameHeight) {
        const layout = CONFIG.LAYOUT;
        const boardBottom = gameHeight * (layout.BOARD_Y + layout.BOARD_HEIGHT);
        const buttonTop = gameHeight * layout.BUTTON_Y;
        const centerY = (boardBottom + buttonTop) / 2;

        const barWidth = 160;
        const barHeight = 12;
        const barX = (gameWidth - barWidth) / 2;
        const barY = centerY - barHeight / 2;

        this.add.text(barX - 4, barY + barHeight / 2, 'HP', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#2ecc71',
            fontStyle: 'bold',
        }).setOrigin(1, 0.5);

        const barBg = this.add.graphics();
        barBg.fillStyle(0x333333, 1);
        barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 3);

        this.playerHpBar = this.add.graphics();

        this.playerHpText = this.add.text(barX + barWidth + 6, barY + barHeight / 2, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#999999',
        }).setOrigin(0, 0.5);

        this._playerBarInfo = { x: barX, y: barY, w: barWidth, h: barHeight };
        this._refreshPlayerUI();
    }

    _createButtons(gameWidth, gameHeight) {
        const layout = CONFIG.LAYOUT;
        const y = gameHeight * layout.BUTTON_Y;
        const h = gameHeight * layout.BUTTON_HEIGHT;

        const btnDefs = [
            { label: '인벤', color: 0x233554, action: () => this._onInventoryOpen() },
            { label: '로비로', color: 0x16a085, action: () => this._returnToLobby() },
        ];

        const btnW = 70;
        const btnH = 36;
        const btnGap = 20;
        const totalW = (btnW * btnDefs.length) + (btnGap * (btnDefs.length - 1));
        const btnStartX = (gameWidth - totalW) / 2;
        const btnY = y + (h - btnH) / 2;

        btnDefs.forEach((def, i) => {
            const bx = btnStartX + i * (btnW + btnGap);

            const bg = this.add.graphics();
            bg.fillStyle(def.color, 1);
            bg.fillRoundedRect(bx, btnY, btnW, btnH, 6);

            this.add.text(bx + btnW / 2, btnY + btnH / 2, def.label, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '14px',
                color: '#ffffff',
            }).setOrigin(0.5);

            if (def.action) {
                const hitZone = this.add.zone(bx + btnW / 2, btnY + btnH / 2, btnW, btnH);
                hitZone.setInteractive({ useHandCursor: true });
                hitZone.on('pointerdown', def.action);
            }
        });
    }

    _createMessageArea(gameWidth, gameHeight) {
        const layout = CONFIG.LAYOUT;
        const btnBottom = gameHeight * (layout.BUTTON_Y + layout.BUTTON_HEIGHT);

        this.messageText = this.add.text(gameWidth / 2, btnBottom + 10, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#f1c40f',
            align: 'center',
            lineSpacing: 4,
        }).setOrigin(0.5, 0);
    }

    // ─── 인벤토리 ─────────────────────────────

    _onInventoryOpen() {
        if (this.combatManager.isBattleOver || this.stageManager.isTransitioning) return;
        if (this.tutorialDialogUI && this.tutorialDialogUI.isOpen) return;
        if (this.inventoryUI.isOpen) return;
        this.inventoryUI.open();
    }

    // ─── 리트라이 ─────────────────────────────

    _openRetryDialog() {
        this.retryDialogUI.openRetryDialog(
            () => this._onAdRetrySelected(),
            () => this._onGiveUpSelected()
        );
    }

    _onAdRetrySelected() {
        if (!this.retryManager.canUseAd()) {
            this._showMessage('이미 광고를 사용했습니다');
            return;
        }
        const duration = CONFIG.RETRY.AD_DURATION_MS;
        this.retryDialogUI.showAdPlaying(duration);
        this.retryManager.playAd(() => {
            this.retryDialogUI.closeAdPlaying();
            this._continueFromRetry();
        });
    }

    _onGiveUpSelected() {
        this._restartStage();
    }

    _continueFromRetry() {
        const cm = this.combatManager;
        cm.playerHp = cm.playerMaxHp;
        cm.isBattleOver = false;
        this._refreshAllUI();
        this._showMessage('HP 회복! 전투 재개');
        console.log('[Retry] 광고 리트라이 성공 → 전투 재개');
    }

    // ─── 튜토리얼 ─────────────────────────────

    _tryShowTutorial() {
        const stageNum = this.stageManager.getStageNumber();
        const tm = this.tutorialManager;

        if (!tm.shouldShow(stageNum)) return;

        const data = tm.getTutorial(stageNum);
        if (!data) return;

        tm.markSeen(stageNum);
        this.tutorialDialogUI.show(data.title, data.body, () => {
            console.log(`[Tutorial] 완료: Stage ${stageNum}`);
        });
    }

    _moveBoardBlockToInventory(block) {
        if (block.isSpawner) {
            return false;
        }
        if (this.inventoryManager.isFull()) {
            this._showMessage('인벤토리가 꽉 찼습니다');
            return false;
        }

        const slotIdx = this.inventoryManager.addItem(block.blockType, block.grade);
        if (slotIdx === -1) return false;

        const col = block.boardCol;
        const row = block.boardRow;
        this.boardManager.grid[row][col] = null;
        block.destroy();

        this.boardManager.refillBoard();
        return true;
    }


    // ─── UI 갱신 ─────────────────────────────

    _refreshEnemyUI() {
        const cm = this.combatManager;
        const sm = this.stageManager;
        const ei = this._enemyBarInfo;

        this.stageText.setText(`Stage ${sm.getStageNumber()}`);
        this.enemyNameText.setText(cm.enemyName);

        const ratio = Math.max(0, cm.enemyHp / cm.enemyMaxHp);
        this.enemyHpBar.clear();
        this.enemyHpBar.fillStyle(0xe74c3c, 1);
        if (ratio > 0) {
            this.enemyHpBar.fillRoundedRect(ei.x, ei.y, ei.w * ratio, ei.h, 4);
        }
        this.enemyHpText.setText(`${cm.enemyHp} / ${cm.enemyMaxHp}`);
    }

    _refreshPlayerUI() {
        const cm = this.combatManager;
        const pi = this._playerBarInfo;

        const ratio = Math.max(0, cm.playerHp / cm.playerMaxHp);
        this.playerHpBar.clear();
        this.playerHpBar.fillStyle(0x2ecc71, 1);
        if (ratio > 0) {
            this.playerHpBar.fillRoundedRect(pi.x, pi.y, pi.w * ratio, pi.h, 3);
        }
        this.playerHpText.setText(`${cm.playerHp}`);
    }

    _refreshHpBars() {
        this._refreshEnemyUI();
        this._refreshPlayerUI();
    }

    _refreshAllUI() {
        this._refreshEnemyUI();
        this._refreshPlayerUI();
    }

    /**
 * 보상 결과를 사용자에게 보여줄 메시지로 가공
 */
    _formatRewardMessage(rewardResult) {
        const parts = [`Stage ${this.stageManager.getStageNumber()} 클리어!`];

        // 자원
        const resourceLabels = {
            gold: '💰', wood: '🌲', stone: '🪨',
            iron: '⛏️', food: '🍞', gem: '💎',
        };
        const resLines = [];
        for (const key in rewardResult.resources) {
            const icon = resourceLabels[key] || key;
            resLines.push(`${icon}+${rewardResult.resources[key]}`);
        }
        if (resLines.length > 0) {
            parts.push(resLines.join(' '));
        }

        // 경험치 / 레벨업
        if (rewardResult.xpGained > 0) {
            parts.push(`XP+${rewardResult.xpGained}`);
        }
        if (rewardResult.leveledUp) {
            parts.push(`🎉 Lv.${rewardResult.oldLevel} → Lv.${rewardResult.newLevel}`);
        }

        return parts.join('\n');
    }

    _showMessage(text) {
        this.messageText.setText(text);
        this.time.delayedCall(3000, () => {
            if (this.messageText && this.messageText.text === text) {
                this.messageText.setText('');
            }
        });
    }

    // ─── 드래그 이벤트 ─────────────────────────────

    _setupDragEvents() {
        // 탭 감지용 상태
        this._tapStartX = 0;
        this._tapStartY = 0;
        this._tapBlock = null;

        // pointerdown — 탭 시작 좌표 저장
        this.input.on('pointerdown', (pointer, targets) => {
            if (this.combatManager.isBattleOver || this.stageManager.isTransitioning) return;
            if (this.tutorialDialogUI && this.tutorialDialogUI.isOpen) return;

            const block = (targets || []).find(t => t instanceof Block);
            if (block) {
                this._tapStartX = pointer.x;
                this._tapStartY = pointer.y;
                this._tapBlock = block;
            } else {
                this._tapBlock = null;
            }
        });

        this.input.on('dragstart', (pointer, block) => {
            if (this.combatManager.isBattleOver || this.stageManager.isTransitioning) return;
            if (this.tutorialDialogUI && this.tutorialDialogUI.isOpen) return;
            block.dragStartX = block.x;
            block.dragStartY = block.y;
            this.children.bringToTop(block);
            block.setAlpha(0.8);
        });

        this.input.on('drag', (pointer, block, dragX, dragY) => {
            if (this.combatManager.isBattleOver || this.stageManager.isTransitioning) return;
            if (this.tutorialDialogUI && this.tutorialDialogUI.isOpen) return;
            block.x = dragX;
            block.y = dragY;
        });

        this.input.on('dragend', (pointer, block) => {
            if (this.combatManager.isBattleOver || this.stageManager.isTransitioning) {
                block.setAlpha(1);
                block.x = block.dragStartX;
                block.y = block.dragStartY;
                return;
            }
            if (this.tutorialDialogUI && this.tutorialDialogUI.isOpen) {
                block.setAlpha(1);
                block.x = block.dragStartX;
                block.y = block.dragStartY;
                return;
            }

            block.setAlpha(1);

            // 이동 거리로 탭 vs 드래그 판별
            const moved = Phaser.Math.Distance.Between(
                this._tapStartX, this._tapStartY, pointer.x, pointer.y
            );
            if (moved < 8 && this._tapBlock === block) {
                block.x = block.dragStartX;
                block.y = block.dragStartY;
                this._handleBlockTap(block);
                return;
            }

            // 드래그로 처리
            if (block.location === 'board') {
                this._handleBoardBlockDrop(pointer, block);
            }
            // location === 'inventory'는 InventoryUI 내부에서 처리됨
        });
    }

    /**
     * 블럭 탭 처리
     * - 스페이서: 인접 빈칸에 블럭 생성
     * - 일반 블럭: A-2에선 무시 (A-3에서 영웅 발동)
     */
    _handleBlockTap(block) {
        if (block.isSpawner) {
            this._handleSpawnerTap(block);
        }
    }

    /**
     * 스페이서 탭 → 인접 빈칸에 블럭 1개 생성
     */
    _handleSpawnerTap(spawner) {
        const empty = this.boardManager.getAdjacentEmpty(spawner.boardCol, spawner.boardRow);
        if (!empty) {
            this._showMessage(`${spawner.blockType.name}: 빈 칸 부족`);
            return;
        }

        const produces = spawner.blockType.produces;
        let typeKey;
        if (Array.isArray(produces)) {
            typeKey = produces[Math.floor(Math.random() * produces.length)];
        } else {
            typeKey = produces;
        }

        const newBlock = this.boardManager.spawnBlockOfType(typeKey, empty.col, empty.row, 1);
        if (newBlock) {
            console.log(`[Spawner] ${spawner.blockType.name} → ${newBlock.blockType.name} at (${empty.col},${empty.row})`);
        }
    }

    /**
     * 블럭 탭 처리 (스페이서면 생성, 일반 블럭은 일단 무시 — A-3에서 발동 추가)
     */
    _handleBlockTap(block) {
        if (block.isSpawner) {
            this._handleSpawnerTap(block);
        } else {
            // A-2에선 일반 블럭 탭 무시. A-3에서 영웅 발동 추가.
        }
    }

    /**
     * 스페이서 탭 → 인접 빈칸에 블럭 생성
     */
    _handleSpawnerTap(spawner) {
        const empty = this.boardManager.getAdjacentEmpty(spawner.boardCol, spawner.boardRow);
        if (!empty) {
            this._showMessage(`${spawner.blockType.name}: 인접 빈칸이 없습니다`);
            return;
        }

        // 어떤 타입을 생성할지 결정
        const produces = spawner.blockType.produces;
        let typeKey;
        if (Array.isArray(produces)) {
            typeKey = produces[Math.floor(Math.random() * produces.length)];
        } else {
            typeKey = produces;
        }

        const newBlock = this.boardManager.spawnBlockOfType(typeKey, empty.col, empty.row, 1);
        if (newBlock) {
            console.log(`[Spawner] ${spawner.blockType.name} 탭 → ${newBlock.blockType.name} 생성 at (${empty.col},${empty.row})`);
        }
    }

    _handleBoardBlockDrop(pointer, block) {
        const bm = this.boardManager;
        const qm = this.queueManager;

        if (this._isOverInventoryButton(pointer.x, pointer.y)) {
            if (block.isSpawner) {
                this._showMessage('스페이서는 인벤에 넣을 수 없습니다');
                bm.snapToCell(block);
                return;
            }
            if (!this._moveBoardBlockToInventory(block)) {
                bm.snapToCell(block);
            }
            return;
        }

        const dropPos = bm.screenToBoard(pointer.x, pointer.y);

        if (!dropPos ||
            (dropPos.col === block.boardCol && dropPos.row === block.boardRow)) {
            bm.snapToCell(block);
            return;
        }

        if (bm.isEmpty(dropPos.col, dropPos.row)) {
            bm.moveToEmpty(block.boardCol, block.boardRow, dropPos.col, dropPos.row);
            return;
        }

        if (bm.canMerge(block.boardCol, block.boardRow, dropPos.col, dropPos.row)) {
            bm.mergeBlocks(block.boardCol, block.boardRow, dropPos.col, dropPos.row);
            return;
        }

        bm.swapBlocks(block.boardCol, block.boardRow, dropPos.col, dropPos.row);
    }

    _isOverInventoryButton(screenX, screenY) {
        const layout = CONFIG.LAYOUT;
        const { width: gw, height: gh } = this.scale;

        const y = gh * layout.BUTTON_Y;
        const h = gh * layout.BUTTON_HEIGHT;

        const btnW = 70;
        const btnH = 36;
        const btnGap = 20;
        const labelCount = 2;
        const totalW = (btnW * labelCount) + (btnGap * (labelCount - 1));
        const btnStartX = (gw - totalW) / 2;
        const btnY = y + (h - btnH) / 2;

        const invBtnX = btnStartX + 0 * (btnW + btnGap);

        return (
            screenX >= invBtnX && screenX <= invBtnX + btnW &&
            screenY >= btnY && screenY <= btnY + btnH
        );
    }

    _calculateBoardLayout(gameWidth, gameHeight) {
        const layout = CONFIG.LAYOUT;
        const board = CONFIG.BOARD;

        const boardAreaY = gameHeight * layout.BOARD_Y;
        const boardAreaH = gameHeight * layout.BOARD_HEIGHT;
        const boardAreaW = gameWidth - (board.PADDING * 2);

        const cellByWidth = (boardAreaW - (board.GAP * (board.COLS - 1))) / board.COLS;
        const cellByHeight = (boardAreaH - (board.GAP * (board.ROWS - 1))) / board.ROWS;
        const cellSize = Math.floor(Math.min(cellByWidth, cellByHeight));

        const totalBoardW = (cellSize * board.COLS) + (board.GAP * (board.COLS - 1));
        const totalBoardH = (cellSize * board.ROWS) + (board.GAP * (board.ROWS - 1));

        const startX = (gameWidth - totalBoardW) / 2;
        const startY = boardAreaY + (boardAreaH - totalBoardH) / 2;

        return {
            cellSize, startX, startY,
            cols: board.COLS, rows: board.ROWS, gap: board.GAP,
        };
    }

    _drawBoardBackground() {
        const { cellSize, startX, startY, cols, rows, gap } = this.boardInfo;
        const graphics = this.add.graphics();

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (cellSize + gap);
                const y = startY + row * (cellSize + gap);
                graphics.fillStyle(CONFIG.COLORS.CELL_EMPTY, 1);
                graphics.fillRoundedRect(x, y, cellSize, cellSize, 4);
            }
        }
    }
}