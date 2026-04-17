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
        this.inventoryManager = null;
        this.inventoryUI = null;

        // UI 참조
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
        this.inventoryManager = new InventoryManager(this);
        this.inventoryUI = new InventoryUI(this, this.inventoryManager);
        this.chemistryManager = new ChemistryManager(this);
        this.chemistryBookUI = new ChemistryBookUI(this);
        this.retryManager = new RetryManager(this);
        this.retryDialogUI = new RetryDialogUI(this, this.retryManager);
        this.tutorialManager = new TutorialManager(this);
        this.tutorialDialogUI = new TutorialDialogUI(this);

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
        // 첫 스테이지 튜토리얼 (약간 지연 후 자연스럽게)
        this.time.delayedCall(300, () => this._tryShowTutorial());
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

        // 광고 횟수 리셋 (다음 스테이지)
        if (this.retryManager) this.retryManager.resetForNewStage();

        // UI 갱신
        this._refreshAllUI();
        this._showMessage(`스테이지 ${sm.getStageNumber()} 시작!`);

        sm.isTransitioning = false;

        // 새 스테이지 튜토리얼 시도
        this.time.delayedCall(600, () => this._tryShowTutorial());
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
        // 패배 → 인벤 소멸 (지침서)
        this.inventoryManager.clearAll();
        this.queueManager.clearAll();

        // 광고 횟수 리셋 (포기 = 새 도전)
        if (this.retryManager) this.retryManager.resetForNewStage();

        // UI 갱신
        this._refreshAllUI();
        this._showMessage(`스테이지 ${sm.getStageNumber()} 시작!`);

        sm.isTransitioning = false;

        // 새 스테이지 튜토리얼 시도
        this.time.delayedCall(600, () => this._tryShowTutorial());
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

    /**
     * 패배 시 리트라이 선택 팝업 열기
     */
    _openRetryDialog() {
        this.retryDialogUI.openRetryDialog(
            () => this._onAdRetrySelected(),
            () => this._onGiveUpSelected()
        );
    }

    /**
     * "광고 시청" 선택 → 광고 시뮬 → HP 회복 후 재개
     */
    _onAdRetrySelected() {
        if (!this.retryManager.canUseAd()) {
            this._showMessage('이미 광고를 사용했습니다');
            return;
        }

        // 광고 진행 오버레이 표시
        const duration = CONFIG.RETRY.AD_DURATION_MS;
        this.retryDialogUI.showAdPlaying(duration);

        // 광고 시뮬 실행 → 완료 시 복귀
        this.retryManager.playAd(() => {
            this.retryDialogUI.closeAdPlaying();
            this._continueFromRetry();
        });
    }

    /**
     * "포기" 선택 → 완전 재시작 (기존 _restartStage)
     */
    _onGiveUpSelected() {
        this._restartStage();
    }

    /**
     * 광고 리트라이 복귀
     * 플레이어 HP만 풀 회복, 보드/인벤/대기칸/적 상태는 유지
     */
    _continueFromRetry() {
        const cm = this.combatManager;

        // 플레이어 HP 풀 회복
        cm.playerHp = cm.playerMaxHp;

        // 전투 종료 플래그 해제 (다시 플레이 가능)
        cm.isBattleOver = false;

        // UI 갱신
        this._refreshAllUI();
        this._showMessage('HP 회복! 전투 재개');

        console.log('[Retry] 광고 리트라이 성공 → 전투 재개');
    }

    // ─── 튜토리얼 ─────────────────────────────

    /**
     * 현재 스테이지 튜토리얼 시도 (안 본 경우만 표시)
     */
    _tryShowTutorial() {
        const stageNum = this.stageManager.getStageNumber();
        const tm = this.tutorialManager;

        if (!tm.shouldShow(stageNum)) return;

        const data = tm.getTutorial(stageNum);
        if (!data) return;

        // 표시 + "본 기록" 저장 (팝업 여는 순간 기록)
        tm.markSeen(stageNum);
        this.tutorialDialogUI.show(data.title, data.body, () => {
            console.log(`[Tutorial] 완료: Stage ${stageNum}`);
        });
    }

    /**
     * 보드 블럭 → 인벤토리
     * @returns {boolean} 성공 여부
     */
    _moveBoardBlockToInventory(block) {
        if (this.inventoryManager.isFull()) {
            this._showMessage('인벤토리가 꽉 찼습니다');
            return false;
        }

        const slotIdx = this.inventoryManager.addItem(block.blockType, block.grade);
        if (slotIdx === -1) return false;

        // 보드에서 제거
        const col = block.boardCol;
        const row = block.boardRow;
        this.boardManager.grid[row][col] = null;
        block.destroy();

        // 보드 리필
        this.boardManager.refillBoard();
        return true;
    }

      // ─── 발동 로직 ─────────────────────────────

    _onActivate() {
        const qm = this.queueManager;
        const cm = this.combatManager;
        const sm = this.stageManager;

        if (cm.isBattleOver || sm.isTransitioning) {
            return;
        }
        if (this.tutorialDialogUI && this.tutorialDialogUI.isOpen) {
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
        const result = cm.executeTurn(blocks, this.chemistryManager);

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
            // 리트라이 선택지 팝업 표시
            this._showMessage('패배...');
            this.time.delayedCall(800, () => this._openRetryDialog());
        } else {
            // 케미 적용 후 실제 수치 (result.totalDamage / totalHeal)
            const realDmg = result.totalDamage ?? dmgTotal;
            const realHeal = result.totalHeal ?? healTotal;

            let msg = '';
            if (realDmg > 0) msg += `데미지 ${realDmg}  `;
            if (realHeal > 0) msg += `회복 ${realHeal}  `;
            if (result.enemyDmg > 0) msg += `적 반격 ${result.enemyDmg}`;

            // 케미 발동 이름 표시
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
            if (this.messageText.text === text) {
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
            // inventory 블럭은 드래그 불가 (탭으로 삭제만 가능)
        });
    }

    _handleBoardBlockDrop(pointer, block) {
        const bm = this.boardManager;
        const qm = this.queueManager;

        // ① 대기칸 영역에 드롭
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

        // ①-b 인벤 버튼 위로 드롭 → 인벤토리에 추가
        if (this._isOverInventoryButton(pointer.x, pointer.y)) {
            if (!this._moveBoardBlockToInventory(block)) {
                bm.snapToCell(block);
            }
            return;
        }

        // ② 보드 내 드롭
        const dropPos = bm.screenToBoard(pointer.x, pointer.y);

        // 보드 밖 or 같은 칸 → 원위치
        if (!dropPos ||
            (dropPos.col === block.boardCol && dropPos.row === block.boardRow)) {
            bm.snapToCell(block);
            return;
        }

        // ③ 빈칸으로 이동 (거리 제약 없음)
        if (bm.isEmpty(dropPos.col, dropPos.row)) {
            bm.moveToEmpty(block.boardCol, block.boardRow, dropPos.col, dropPos.row);
            return;
        }

        // ④ 머지 가능 → 머지 + 리필
        if (bm.canMerge(block.boardCol, block.boardRow, dropPos.col, dropPos.row)) {
            bm.mergeBlocks(block.boardCol, block.boardRow, dropPos.col, dropPos.row);
            bm.refillBoard();
            return;
        }

        // ⑤ 교환
        bm.swapBlocks(block.boardCol, block.boardRow, dropPos.col, dropPos.row);
    }

    /**
     * 화면 좌표가 [인벤] 버튼 위인지 판정
     */
    _isOverInventoryButton(screenX, screenY) {
        const layout = CONFIG.LAYOUT;
        const { width: gw, height: gh } = this.scale;

        const y = gh * layout.BUTTON_Y;
        const h = gh * layout.BUTTON_HEIGHT;

        const btnW = 70;
        const btnH = 36;
        const btnGap = 20;
        const labelCount = 4;  // 발동, 인벤, 스킬, 도감
        const totalW = (btnW * labelCount) + (btnGap * (labelCount - 1));
        const btnStartX = (gw - totalW) / 2;
        const btnY = y + (h - btnH) / 2;

        // [인벤] 은 인덱스 1 (0:발동, 1:인벤, 2:스킬, 3:도감)
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