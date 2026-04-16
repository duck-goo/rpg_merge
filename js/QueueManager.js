/**
 * QueueManager.js
 * 대기칸 슬롯 관리
 * 슬롯 좌표 계산, 블럭 배치/제거, 영역 판별
 */
class QueueManager {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} gameWidth
     * @param {number} gameHeight
     */
    constructor(scene, gameWidth, gameHeight) {
        this.scene = scene;

        const layout = CONFIG.LAYOUT;
        const queue = CONFIG.QUEUE;

        this.slotCount = queue.SLOT_COUNT;

        // 대기칸 영역 좌표 계산
        this.areaY = gameHeight * layout.QUEUE_Y;
        this.areaH = gameHeight * layout.QUEUE_HEIGHT;
        this.slotSize = Math.floor(this.areaH * 0.7);
        this.slotGap = queue.SLOT_GAP;

        const totalW = (this.slotSize * this.slotCount) + (this.slotGap * (this.slotCount - 1));
        this.slotStartX = (gameWidth - totalW) / 2;
        this.slotY = this.areaY + (this.areaH - this.slotSize) / 2;

        // 슬롯 배열: slots[i] = Block 또는 null
        this.slots = [];
        for (let i = 0; i < this.slotCount; i++) {
            this.slots[i] = null;
        }
    }

    // ─── 좌표 ─────────────────────────────

    /**
     * 슬롯 인덱스 → 화면 중앙 좌표
     */
    slotToScreen(slotIndex) {
        const x = this.slotStartX + slotIndex * (this.slotSize + this.slotGap) + this.slotSize / 2;
        const y = this.slotY + this.slotSize / 2;
        return { x, y };
    }

    /**
     * 화면 좌표가 대기칸 영역 안인지 확인
     */
    isInQueueArea(screenX, screenY) {
        return (
            screenY >= this.areaY &&
            screenY <= this.areaY + this.areaH
        );
    }

    /**
     * 화면 좌표 → 가장 가까운 슬롯 인덱스
     * 대기칸 영역 밖이면 -1
     */
    screenToSlot(screenX, screenY) {
        if (!this.isInQueueArea(screenX, screenY)) {
            return -1;
        }

        let closestSlot = -1;
        let closestDist = Infinity;

        for (let i = 0; i < this.slotCount; i++) {
            const pos = this.slotToScreen(i);
            const dist = Math.abs(screenX - pos.x);
            if (dist < closestDist) {
                closestDist = dist;
                closestSlot = i;
            }
        }

        return closestSlot;
    }

    // ─── 슬롯 관리 ─────────────────────────────

    /**
     * 슬롯에 블럭 배치
     * @returns {boolean} 배치 성공 여부
     */
    placeBlock(slotIndex, block) {
        if (slotIndex < 0 || slotIndex >= this.slotCount) {
            return false;
        }
        if (this.slots[slotIndex] !== null) {
            return false;
        }

        this.slots[slotIndex] = block;
        block.location = 'queue';
        block.boardCol = -1;
        block.boardRow = -1;

        const pos = this.slotToScreen(slotIndex);
        block.x = pos.x;
        block.y = pos.y;

        return true;
    }

    /**
     * 슬롯에서 블럭 제거
     * @returns {Block|null}
     */
    removeBlock(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slotCount) {
            return null;
        }

        const block = this.slots[slotIndex];
        this.slots[slotIndex] = null;
        return block;
    }

    /**
     * 블럭이 어느 슬롯에 있는지 찾기
     * @returns {number} 슬롯 인덱스, 없으면 -1
     */
    findBlock(block) {
        for (let i = 0; i < this.slotCount; i++) {
            if (this.slots[i] === block) {
                return i;
            }
        }
        return -1;
    }

    /**
     * 블럭을 원래 슬롯 위치로 복귀
     */
    snapToSlot(block) {
        const slotIndex = this.findBlock(block);
        if (slotIndex >= 0) {
            const pos = this.slotToScreen(slotIndex);
            block.x = pos.x;
            block.y = pos.y;
        }
    }

    /**
     * 두 슬롯의 블럭 교환
     */
    swapSlots(slotA, slotB) {
        const blockA = this.slots[slotA];
        const blockB = this.slots[slotB];

        this.slots[slotA] = blockB;
        this.slots[slotB] = blockA;

        if (blockA) {
            const posA = this.slotToScreen(slotB);
            blockA.x = posA.x;
            blockA.y = posA.y;
        }
        if (blockB) {
            const posB = this.slotToScreen(slotA);
            blockB.x = posB.x;
            blockB.y = posB.y;
        }
    }

    /**
     * 비어있는 첫 번째 슬롯 인덱스
     * @returns {number} 없으면 -1
     */
    getFirstEmptySlot() {
        for (let i = 0; i < this.slotCount; i++) {
            if (this.slots[i] === null) {
                return i;
            }
        }
        return -1;
    }

    /**
     * 대기칸 전체 비우기 (스테이지 전환 시)
     */
    clearAll() {
        for (let i = 0; i < this.slotCount; i++) {
            if (this.slots[i] !== null) {
                this.slots[i].destroy();
                this.slots[i] = null;
            }
        }
    }
}