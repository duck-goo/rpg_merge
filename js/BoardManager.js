/**
 * BoardManager.js
 * 6×7 보드의 데이터 관리 + 블럭 생성/배치/이동
 * 데이터(grid 배열)와 화면(Block 객체)을 동기화
 */
class BoardManager {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} boardInfo - DungeonScene에서 계산한 레이아웃 정보
     */
    constructor(scene, boardInfo) {
        this.scene = scene;
        this.boardInfo = boardInfo;

        // 2D 배열: grid[row][col] = Block 인스턴스 또는 null
        this.grid = [];

        // 블럭 타입 목록 (랜덤 생성용)
        this.blockTypes = Object.values(CONFIG.BLOCK.TYPES);

        this._initGrid();
    }

    // ─── 초기화 ─────────────────────────────

    /**
     * 빈 그리드 생성 후 블럭으로 채움
     */
    _initGrid() {
        const { cols, rows } = this.boardInfo;
        for (let row = 0; row < rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < cols; col++) {
                this.grid[row][col] = null;
            }
        }
        // ★ 자동 채우기 제거 — 스페이서만 배치
        this.spawnInitialSpawners();
    }

    /**
     * Phase 3-11-A: 던전 시작 시 스페이서 3종 자동 배치
     */
    spawnInitialSpawners() {
        const initial = (CONFIG.BLOCK && CONFIG.BLOCK.INITIAL_SPAWNERS) || [];

        for (const spec of initial) {
            const blockType = this._findTypeByKey(spec.typeKey);
            if (!blockType) {
                console.warn(`[Board] 알 수 없는 스페이서 키: ${spec.typeKey}`);
                continue;
            }
            if (spec.col < 0 || spec.col >= this.boardInfo.cols ||
                spec.row < 0 || spec.row >= this.boardInfo.rows) {
                console.warn(`[Board] 스페이서 위치 범위 밖: ${spec.col},${spec.row}`);
                continue;
            }
            if (this.grid[spec.row][spec.col] !== null) {
                console.warn(`[Board] 위치 이미 차있음: ${spec.col},${spec.row}`);
                continue;
            }

            const { x, y } = this.boardToScreen(spec.col, spec.row);
            const block = new Block(this.scene, x, y, this.boardInfo.cellSize, blockType, 1);
            block.boardCol = spec.col;
            block.boardRow = spec.row;
            block.location = 'board';
            this.grid[spec.row][spec.col] = block;

            this._attachTapListener(block);   // ★ 추가
        }

        console.log(`[Board] 스페이서 ${initial.length}개 배치 완료`);
    }

    /**
     * 4방향 인접 빈 칸 좌표 (없으면 null)
     * 우선순위: 위, 아래, 왼쪽, 오른쪽
     */
    getAdjacentEmpty(col, row) {
        const dirs = [
            { dc: 0,  dr: -1 },
            { dc: 0,  dr: 1 },
            { dc: -1, dr: 0 },
            { dc: 1,  dr: 0 },
        ];
        for (const { dc, dr } of dirs) {
            const nc = col + dc;
            const nr = row + dr;
            if (nc < 0 || nc >= this.boardInfo.cols) continue;
            if (nr < 0 || nr >= this.boardInfo.rows) continue;
            if (this.grid[nr][nc] === null) return { col: nc, row: nr };
        }
        return null;
    }

    /**
    * 지정 위치에 특정 타입의 블럭 생성 (스페이서 호출용)
    * @returns {Block|null}
    */
    spawnBlockOfType(typeKey, col, row, grade = 1) {
        const blockType = this._findTypeByKey(typeKey);
        if (!blockType) {
            console.warn(`[Board] 알 수 없는 타입: ${typeKey}`);
            return null;
        }
        if (col < 0 || col >= this.boardInfo.cols ||
            row < 0 || row >= this.boardInfo.rows) {
            console.warn(`[Board] 위치 범위 밖: ${col},${row}`);
            return null;
        }
        if (this.grid[row][col] !== null) {
            console.warn(`[Board] 위치 이미 차있음: ${col},${row}`);
            return null;
        }

        const { x, y } = this.boardToScreen(col, row);
        const block = new Block(this.scene, x, y, this.boardInfo.cellSize, blockType, grade);
        block.boardCol = col;
        block.boardRow = row;
        block.location = 'board';
        this.grid[row][col] = block;

        this._attachTapListener(block);   // ★ 추가

        return block;
    }

    /**
     * Phase 3-11-A: 블럭에 탭(클릭) 리스너 부착
     * - 드래그가 발생하지 않은 짧은 클릭만 탭으로 인식
     * - DungeonScene이 onTap 콜백을 통해 처리
     */
    _attachTapListener(block) {
        let pointerDownX = 0;
        let pointerDownY = 0;
        let isDragging = false;

        block.on('pointerdown', (pointer) => {
            pointerDownX = pointer.x;
            pointerDownY = pointer.y;
            isDragging = false;
        });

        block.on('dragstart', () => {
            isDragging = true;
        });

        block.on('pointerup', (pointer) => {
            if (isDragging) {
                // 드래그였으면 dragend가 처리. 탭 콜백 X
                return;
            }
            const moved = Phaser.Math.Distance.Between(
                pointerDownX, pointerDownY, pointer.x, pointer.y
            );
            if (moved < 8 && this.onBlockTap) {
                this.onBlockTap(block);
            }
        });
    }

    /**
     * blockType.key로 CONFIG.BLOCK.TYPES 항목 찾기
     */
    _findTypeByKey(key) {
        const types = CONFIG.BLOCK.TYPES;
        for (const k in types) {
            if (types[k].key === key) return types[k];
        }
        return null;
    }

    // ─── 좌표 변환 ─────────────────────────────

    /**
     * 보드 (col, row) → 화면 (x, y) 중앙 좌표
     */
    boardToScreen(col, row) {
        const { cellSize, startX, startY, gap } = this.boardInfo;
        const x = startX + col * (cellSize + gap) + cellSize / 2;
        const y = startY + row * (cellSize + gap) + cellSize / 2;
        return { x, y };
    }

    /**
     * 화면 (x, y) → 보드 (col, row)
     * 보드 밖이면 null 반환
     */
    screenToBoard(screenX, screenY) {
        const { cellSize, startX, startY, gap, cols, rows } = this.boardInfo;

        const col = Math.floor((screenX - startX) / (cellSize + gap));
        const row = Math.floor((screenY - startY) / (cellSize + gap));

        if (col < 0 || col >= cols || row < 0 || row >= rows) {
            return null;
        }

        // 간격(gap) 위를 터치한 경우 무효 처리
        const cellX = screenX - (startX + col * (cellSize + gap));
        const cellY = screenY - (startY + row * (cellSize + gap));
        if (cellX > cellSize || cellY > cellSize) {
            return null;
        }

        return { col, row };
    }

    // ─── 블럭 생성 ─────────────────────────────

    /**
     * 랜덤 블럭 타입 반환
     */
    _getRandomBlockType() {
        // Phase 3-11-A: 스페이서는 랜덤 생성 대상에서 제외
        const eligible = this.blockTypes.filter(t => !t.isSpawner);
        if (eligible.length === 0) {
            console.warn('[Board] 일반 블럭 타입이 없습니다');
            return null;
        }
        const index = Math.floor(Math.random() * eligible.length);
        return eligible[index];
    }

    /**
     * 특정 칸에 새 블럭 생성
     */
    createBlockAt(col, row) {
        const blockType = this._getRandomBlockType();
        if (!blockType) return null;
        const grade = CONFIG.BLOCK.INIT_GRADE;
        const { x, y } = this.boardToScreen(col, row);
        
        const block = new Block(
            this.scene, x, y,
            this.boardInfo.cellSize,
            blockType, grade
        );
    
        block.boardCol = col;
        block.boardRow = row;
    
        this.grid[row][col] = block;
        
        this._attachTapListener(block);   // ★ 추가
        
        return block;
    }

    /**
     * 모든 빈 칸에 블럭 채우기
     */
    fillAllEmpty() {
        const { cols, rows } = this.boardInfo;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.grid[row][col] === null) {
                    this.createBlockAt(col, row);
                }
            }
        }
    }

    // ─── 블럭 이동 ─────────────────────────────

    /**
     * 두 칸의 블럭을 교환
     */
    swapBlocks(col1, row1, col2, row2) {
        const blockA = this.grid[row1][col1];
        const blockB = this.grid[row2][col2];

        // 그리드 데이터 교환
        this.grid[row1][col1] = blockB;
        this.grid[row2][col2] = blockA;

        // 블럭의 보드 좌표 갱신
        if (blockA) {
            blockA.boardCol = col2;
            blockA.boardRow = row2;
            const posA = this.boardToScreen(col2, row2);
            blockA.x = posA.x;
            blockA.y = posA.y;
        }

        if (blockB) {
            blockB.boardCol = col1;
            blockB.boardRow = row1;
            const posB = this.boardToScreen(col1, row1);
            blockB.x = posB.x;
            blockB.y = posB.y;
        }
        
    }
    
    /**
     * 블럭을 빈칸으로 이동
     * @returns {boolean} 성공 여부
     */
    moveToEmpty(fromCol, fromRow, toCol, toRow) {
        const block = this.grid[fromRow][fromCol];

        if (!block) {
            console.warn('[BoardManager] 이동할 블럭 없음');
            return false;
        }
        if (this.grid[toRow][toCol] !== null) {
            console.warn('[BoardManager] 대상 칸이 비어있지 않음');
            return false;
        }

        // 원래 칸 비우기
        this.grid[fromRow][fromCol] = null;

        // 대상 칸에 배치
        this.grid[toRow][toCol] = block;
        block.boardCol = toCol;
        block.boardRow = toRow;
        this.snapToCell(block);

        return true;
    }

    /**
     * 블럭을 원래 위치로 되돌리기
     */
    snapToCell(block) {
        const pos = this.boardToScreen(block.boardCol, block.boardRow);
        block.x = pos.x;
        block.y = pos.y;
    }

    /**
     * 두 칸이 상하좌우 인접한지 확인
     */
    isAdjacent(col1, row1, col2, row2) {
        const dc = Math.abs(col1 - col2);
        const dr = Math.abs(row1 - row2);
        return (dc + dr) === 1;
    }

    // ─── 머지 ─────────────────────────────

    /**
     * 두 칸의 블럭이 머지 가능한지 판정
     * 조건: 둘 다 블럭 존재 + 같은 타입 + 같은 등급 + 최대 등급 미만
     */
    canMerge(col1, row1, col2, row2) {
        const blockA = this.grid[row1][col1];
        const blockB = this.grid[row2][col2];

        if (!blockA || !blockB) {
            return false;
        }

        if (blockA.blockType.key !== blockB.blockType.key) {
            return false;
        }

        if (blockA.grade !== blockB.grade) {
            return false;
        }

        if (blockA.grade >= CONFIG.BLOCK.MAX_GRADE) {
            return false;
        }

        return true;
    }

    /**
     * 머지 실행: from 블럭을 제거하고 to 블럭을 등급 업
     * @returns {Block} 등급이 오른 블럭
     */
    mergeBlocks(fromCol, fromRow, toCol, toRow) {
        const fromBlock = this.grid[fromRow][fromCol];
        const toBlock = this.grid[toRow][toCol];

        // from 블럭 제거
        fromBlock.destroy();
        this.grid[fromRow][fromCol] = null;

        // to 블럭 등급 상승
        toBlock.setGrade(toBlock.grade + 1);

        console.log(
            `[Merge] ${toBlock.blockType.name} Lv${toBlock.grade - 1} + Lv${toBlock.grade - 1} → Lv${toBlock.grade}` +
            ` at (${toCol},${toRow})`
        );

        return toBlock;
    }

    /**
     * 특정 칸이 비어있는지 확인
     */
    isEmpty(col, row) {
        return this.grid[row][col] === null;
    }

    // ─── 리필 ─────────────────────────────

    /**
     * 한 열의 블럭을 아래로 낙하
     * 아래 행부터 위로 올라가며 빈칸을 채움
     * @returns {number} 낙하 후 최상단 빈칸 수
     */
    dropColumn(col) {
        const { rows } = this.boardInfo;

        // 아래에서 위로 순회하며 빈칸 찾기
        let emptyRow = rows - 1;

        // 1단계: 가장 아래 빈칸 위치 찾기 → 위쪽 블럭 당겨오기
        // 투 포인터 방식: emptyRow는 빈칸, scanRow는 위쪽 블럭 탐색
        // 단순화를 위해 열의 블럭을 모아서 아래부터 재배치
        const blocks = [];

        // 아래에서 위로 블럭 수집
        for (let row = rows - 1; row >= 0; row--) {
            if (this.grid[row][col] !== null) {
                blocks.push(this.grid[row][col]);
                this.grid[row][col] = null;
            }
        }

        // 아래부터 다시 배치
        let placeRow = rows - 1;
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            this.grid[placeRow][col] = block;
            block.boardCol = col;
            block.boardRow = placeRow;
            this.snapToCell(block);
            placeRow--;
        }

        // 남은 빈칸 수 반환 (placeRow + 1 부터 0까지)
        return placeRow + 1;
    }

    /**
     * 전체 보드 리필: 낙하 → 빈칸에 새 블럭 생성
     */
    refillBoard() {
        // Phase 3-11-A: 자동 리필 비활성화됨. 호출 자체를 추적용으로 남김.
        console.warn('[Board] refillBoard() 호출됨 — Phase 3-11-A에서는 자동 리필 OFF. 무시합니다.');
        return;
        const { cols } = this.boardInfo;

        for (let col = 0; col < cols; col++) {
            // 블럭 낙하
            const emptyCount = this.dropColumn(col);

            // 최상단 빈칸에 새 블럭 생성
            for (let row = 0; row < emptyCount; row++) {
                this.createBlockAt(col, row);
            }
        }
    }

    /**
     * 보드 전체 초기화 (스테이지 전환 시)
     * 모든 블럭 파괴 후 새로 채움
     */
    resetBoard() {
        const { cols, rows } = this.boardInfo;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.grid[row][col] !== null) {
                    this.grid[row][col].destroy();
                    this.grid[row][col] = null;
                }
            }
        }
        // Phase 3-11-A: 자동 채우기 X, 스페이서만 재배치
        this.spawnInitialSpawners();
    }

    canMerge(col1, row1, col2, row2) {
        const blockA = this.grid[row1][col1];
        const blockB = this.grid[row2][col2];
        if (!blockA || !blockB) return false;
        
        // Phase 3-11-A: 스페이서는 머지 불가
        if (blockA.isSpawner || blockB.isSpawner) return false;
        
        if (blockA.blockType.key !== blockB.blockType.key) return false;
        if (blockA.grade !== blockB.grade) return false;
        if (blockA.grade >= CONFIG.BLOCK.MAX_GRADE) return false;
        return true;
    }
}