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
        this.queueManager = null;
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
        this.chemistryManager = null;
        this.chemistryBookUI = null;
        this.retryManager = null;
        this.retryDialogUI = null;
        this.tutorialManager = null;
        this.tutorialDialogUI = null;

        // Phase 3-2 신규
        this.lobbyBtnBg = null;
        this.lobbyBtnText = null;
        this.lobbyBtnZone = null;
    }

    preload() {}

    create() {
        const { width, height } = this.scale;

        console.log('[DungeonScene] create (stage index = ' + GameData.stage.currentIndex + ')');

        this.boardInfo = this._calculateBoardLayout(width, height);

        this._drawBoardBackground();
        this._drawQueueSlots(width, height);

        this.boardManager = new BoardManager(this, this.boardInfo);
        this.queueManager = new QueueManager(this, width, height);
        this.stageManager = new StageManager(this);
        this.inventoryManager = new InventoryManager(this);
        this.inventoryUI = new InventoryUI(this, this.inventoryManager);
        this.chemistryManager = new ChemistryManager(this);
        this.chemistryBookUI = new ChemistryBookUI(this);
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
        // 전투 중이든 아니든 언제나 로비로 복귀 가능 (사용자 편의)
        // 현재 진행 상태는 저장하지 않음 → 다음 진입 시 1스테이지부터
        console.log('[DungeonScene] → LobbyScene');
        this.scene.start('LobbyScene');
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
        this.queueManager.clearAll();
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
        this.queueManager.clearAll();
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
            { label: '발동', color: 0xc0392b, action: () => this._onActivate() },
            { label: '인벤', color: 0x233554, action: () => this._onInventoryOpen() },
            { label: '스킬', color: 0x233554, action: null },
            { label: '도감', color: 0x233554, action: () => this._onChemistryBookOpen() },
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

    _onChemistryBookOpen() {
        if (this.stageManager.isTransitioning) return;
        if (this.tutorialDialogUI && this.tutorialDialogUI.isOpen) return;
        if (this.chemistryBookUI.isOpen) return;
        if (this.inventoryUI && this.inventoryUI.isOpen) {
            this.inventoryUI.close();
        }
        this.chemistryBookUI.open();
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

    // ─── 발동 로직 ─────────────────────────────

    _onActivate() {
        const qm = this.queueManager;
        const cm = this.combatManager;
        const sm = this.stageManager;

        if (cm.isBattleOver || sm.isTransitioning) return;
        if (this.tutorialDialogUI && this.tutorialDialogUI.isOpen) return;

        const blocks = [];
        for (let i = 0; i < qm.slotCount; i++) {
            if (qm.slots[i] !== null) {
                blocks.push(qm.slots[i]);
            }
        }

        if (blocks.length === 0) {
            this._showMessage('대기칸에 블럭을 배치하세요');
            return;
        }

        const result = cm.executeTurn(blocks, this.chemistryManager);

        qm.clearAll();
        this._refreshHpBars();

        const dmgTotal = result.effects
            .filter(e => e.type === 'damage')
            .reduce((sum, e) => sum + e.value, 0);
        const healTotal = result.effects
            .filter(e => e.type === 'heal')
            .reduce((sum, e) => sum + e.value, 0);

        if (result.result === 'victory') {
            // Phase 3-2: 클리어 시 최고 기록 갱신
            const clearedStageNum = sm.getStageNumber();
            if (clearedStageNum > GameData.stage.highestCleared) {
                GameData.stage.highestCleared = clearedStageNum;
                SaveManager.requestSave();
            }

            if (sm.hasNextStage()) {
                this._showMessage(`스테이지 ${sm.getStageNumber()} 클리어!`);
                this.time.delayedCall(2000, () => this._goToNextStage());
            } else {
                this._showMessage('모든 스테이지 클리어! 로비로 이동...');
                this.time.delayedCall(2500, () => this._returnToLobby());
            }
        } else if (result.result === 'defeat') {
            this._showMessage('패배...');
            this.time.delayedCall(800, () => this._openRetryDialog());
        } else {
            const realDmg = result.totalDamage ?? dmgTotal;
            const realHeal = result.totalHeal ?? healTotal;

            let msg = '';
            if (realDmg > 0) msg += `데미지 ${realDmg}  `;
            if (realHeal > 0) msg += `회복 ${realHeal}  `;
            if (result.enemyDmg > 0) msg += `적 반격 ${result.enemyDmg}`;

            if (result.chemistryMatches && result.chemistryMatches.length > 0) {
                const names = result.chemistryMatches.map(m => m.recipe.name).join(', ');
                msg += `\n✨ ${names}`;
            }

            this._showMessage(msg);
        }
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

            if (block.location === 'board') {
                this._handleBoardBlockDrop(pointer, block);
            } else if (block.location === 'queue') {
                this._handleQueueBlockDrop(pointer, block);
            }
        });
    }

    _handleBoardBlockDrop(pointer, block) {
        const bm = this.boardManager;
        const qm = this.queueManager;

        if (qm.isInQueueArea(pointer.x, pointer.y)) {
            const slotIndex = qm.screenToSlot(pointer.x, pointer.y);
            if (slotIndex >= 0 && qm.slots[slotIndex] === null) {
                const col = block.boardCol;
                const row = block.boardRow;
                bm.grid[row][col] = null;
                qm.placeBlock(slotIndex, block);
                bm.refillBoard();
                return;
            }
            bm.snapToCell(block);
            return;
        }

        if (this._isOverInventoryButton(pointer.x, pointer.y)) {
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
            bm.refillBoard();
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
        const labelCount = 4;
        const totalW = (btnW * labelCount) + (btnGap * (labelCount - 1));
        const btnStartX = (gw - totalW) / 2;
        const btnY = y + (h - btnH) / 2;

        const invBtnX = btnStartX + 1 * (btnW + btnGap);

        return (
            screenX >= invBtnX && screenX <= invBtnX + btnW &&
            screenY >= btnY && screenY <= btnY + btnH
        );
    }

    _handleQueueBlockDrop(pointer, block) {
        const qm = this.queueManager;
        const fromSlot = qm.findBlock(block);

        if (!qm.isInQueueArea(pointer.x, pointer.y)) {
            qm.snapToSlot(block);
            return;
        }

        const toSlot = qm.screenToSlot(pointer.x, pointer.y);
        if (toSlot >= 0 && toSlot !== fromSlot) {
            qm.swapSlots(fromSlot, toSlot);
            return;
        }

        qm.snapToSlot(block);
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

    _drawQueueSlots(gameWidth, gameHeight) {
        const layout = CONFIG.LAYOUT;
        const y = gameHeight * layout.QUEUE_Y;
        const h = gameHeight * layout.QUEUE_HEIGHT;
        const slotCount = CONFIG.QUEUE.SLOT_COUNT;
        const slotSize = Math.floor(h * 0.7);
        const slotGap = CONFIG.QUEUE.SLOT_GAP;
        const totalW = (slotSize * slotCount) + (slotGap * (slotCount - 1));
        const slotStartX = (gameWidth - totalW) / 2;
        const slotY = y + (h - slotSize) / 2;

        const graphics = this.add.graphics();
        for (let i = 0; i < slotCount; i++) {
            const sx = slotStartX + i * (slotSize + slotGap);
            graphics.fillStyle(CONFIG.COLORS.QUEUE_SLOT, 1);
            graphics.fillRoundedRect(sx, slotY, slotSize, slotSize, 4);
        }

        this.add.text(gameWidth / 2, y + 4, '대기칸', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#555555',
        }).setOrigin(0.5, 0);
    }
}