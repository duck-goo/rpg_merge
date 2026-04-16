/**
 * GameScene.js
 * Phase 1-8: 스테이지 5개 + 클리어/패배 판정
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.boardInfo = null;
        this.boardManager = null;
        this.queueManager = null;
        this.combatManager = null;
        this.stageManager = null;

        // UI 참조
        this.enemyHpBar = null;
        this.enemyHpText = null;
        this.enemyNameText = null;
        this.playerHpBar = null;
        this.playerHpText = null;
        this.messageText = null;
        this.stageText = null;
    }

    preload() {}

    create() {
        const { width, height } = this.scale;

        this.boardInfo = this._calculateBoardLayout(width, height);

        // 배경 UI
        this._drawBoardBackground();
        this._drawQueueSlots(width, height);

        // 매니저 생성
        this.boardManager = new BoardManager(this, this.boardInfo);
        this.queueManager = new QueueManager(this, width, height);
        this.stageManager = new StageManager(this);

        // 전투 매니저 (현재 스테이지 기준)
        const stageData = this.stageManager.getCurrentStage();
        this.combatManager = new CombatManager(this, stageData.enemy);

        // 전투 UI
        this._createEnemyUI(width, height);
        this._createPlayerUI(width, height);
        this._createButtons(width, height);
        this._createMessageArea(width, height);

        // 드래그
        this._setupDragEvents();

        console.log('[GameScene] Phase 1-8: 스테이지 시스템 완료');
    }

    update(time, delta) {}

    // ─── 스테이지 전환 ─────────────────────────────

    /**
     * 다음 스테이지로 전환
     */
    _goToNextStage() {
        const sm = this.stageManager;

        if (!sm.hasNextStage()) {
            this._showMessage('모든 스테이지 클리어! 축하합니다!');
            return;
        }

        sm.isTransitioning = true;
        sm.advance();

        const stageData = sm.getCurrentStage();

        // 전투 매니저 재생성
        this.combatManager = new CombatManager(this, stageData.enemy);

        // 보드 + 대기칸 초기화
        this.boardManager.resetBoard();
        this.queueManager.clearAll();

        // UI 갱신
        this._refreshAllUI();
        this._showMessage(`스테이지 ${sm.getStageNumber()} 시작!`);

        sm.isTransitioning = false;
    }

    /**
     * 현재 스테이지 재시작
     */
    _restartStage() {
        const sm = this.stageManager;

        sm.isTransitioning = true;
        sm.restart();

        const stageData = sm.getCurrentStage();

        // 전투 매니저 재생성 (HP 풀 리셋)
        this.combatManager = new CombatManager(this, stageData.enemy);

        // 보드 + 대기칸 초기화
        this.boardManager.resetBoard();
        this.queueManager.clearAll();

        // UI 갱신
        this._refreshAllUI();
        this._showMessage(`스테이지 ${sm.getStageNumber()} 재도전!`);

        sm.isTransitioning = false;
    }

    // ─── 전투 UI 생성 ─────────────────────────────

    _createEnemyUI(gameWidth, gameHeight) {
        const y = gameHeight * CONFIG.LAYOUT.ENEMY_Y;
        const h = gameHeight * CONFIG.LAYOUT.ENEMY_HEIGHT;
        const centerY = y + h / 2;
        const cm = this.combatManager;

        // 스테이지 번호
        this.stageText = this.add.text(gameWidth / 2, y + 6, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#888888',
        }).setOrigin(0.5, 0);

        // 적 이름
        this.enemyNameText = this.add.text(gameWidth / 2, centerY - 20, '', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#cccccc',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // HP바
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

        // 초기값 표시
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
            { label: '인벤', color: 0x233554, action: null },
            { label: '스킬', color: 0x233554, action: null },
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
        }).setOrigin(0.5, 0);
    }

    // ─── 발동 로직 ─────────────────────────────

    _onActivate() {
        const qm = this.queueManager;
        const cm = this.combatManager;
        const sm = this.stageManager;

        if (cm.isBattleOver || sm.isTransitioning) {
            return;
        }

        // 대기칸 블럭 수집
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

        // 전투 실행
        const result = cm.executeTurn(blocks);

        // 발동 블럭 제거
        qm.clearAll();

        // UI 갱신
        this._refreshHpBars();

        // 결과 처리
        const dmgTotal = result.effects
            .filter(e => e.type === 'damage')
            .reduce((sum, e) => sum + e.value, 0);
        const healTotal = result.effects
            .filter(e => e.type === 'heal')
            .reduce((sum, e) => sum + e.value, 0);

        if (result.result === 'victory') {
            if (sm.hasNextStage()) {
                this._showMessage(`스테이지 ${sm.getStageNumber()} 클리어!`);
                this.time.delayedCall(2000, () => this._goToNextStage());
            } else {
                this._showMessage('모든 스테이지 클리어! 축하합니다!');
            }
        } else if (result.result === 'defeat') {
            this._showMessage('패배... 다시 도전합니다');
            this.time.delayedCall(2000, () => this._restartStage());
        } else {
            let msg = '';
            if (dmgTotal > 0) msg += `데미지 ${dmgTotal}  `;
            if (healTotal > 0) msg += `회복 ${healTotal}  `;
            if (result.enemyDmg > 0) msg += `적 반격 ${result.enemyDmg}`;
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
            if (this.messageText.text === text) {
                this.messageText.setText('');
            }
        });
    }

    // ─── 드래그 이벤트 ─────────────────────────────

    _setupDragEvents() {
        this.input.on('dragstart', (pointer, block) => {
            if (this.combatManager.isBattleOver || this.stageManager.isTransitioning) return;
            block.dragStartX = block.x;
            block.dragStartY = block.y;
            this.children.bringToTop(block);
            block.setAlpha(0.8);
        });

        this.input.on('drag', (pointer, block, dragX, dragY) => {
            if (this.combatManager.isBattleOver || this.stageManager.isTransitioning) return;
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

        const dropPos = bm.screenToBoard(pointer.x, pointer.y);

        if (!dropPos ||
            (dropPos.col === block.boardCol && dropPos.row === block.boardRow)) {
            bm.snapToCell(block);
            return;
        }

        if (!bm.isAdjacent(block.boardCol, block.boardRow, dropPos.col, dropPos.row)) {
            bm.snapToCell(block);
            return;
        }

        if (bm.canMerge(block.boardCol, block.boardRow, dropPos.col, dropPos.row)) {
            bm.mergeBlocks(block.boardCol, block.boardRow, dropPos.col, dropPos.row);
            bm.refillBoard();
            return;
        }

        bm.swapBlocks(block.boardCol, block.boardRow, dropPos.col, dropPos.row);
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

    // ─── 레이아웃 계산 ─────────────────────────────

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

    // ─── 그리기 ─────────────────────────────

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