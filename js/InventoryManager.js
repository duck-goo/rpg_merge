/**
 * InventoryManager.js
 * 인벤토리 데이터 관리
 * 블럭 객체가 아닌 { blockType, grade } 데이터만 저장
 * 창 열릴 때만 Block 객체 생성 (메모리 효율)
 */
class InventoryManager {
    constructor(scene) {
        this.scene = scene;
        this.maxSlots = CONFIG.INVENTORY.INITIAL_SLOTS;

        // 슬롯 배열: items[i] = { blockType, grade } 또는 null
        this.items = [];
        for (let i = 0; i < this.maxSlots; i++) {
            this.items[i] = null;
        }
    }

    // ─── 기본 연산 ─────────────────────────────

    /**
     * 블럭 데이터로 추가
     * @returns {number} 슬롯 인덱스, 실패 시 -1
     */
    addItem(blockType, grade) {
        const emptyIdx = this._findFirstEmpty();
        if (emptyIdx === -1) {
            console.warn('[Inventory] 꽉 참');
            return -1;
        }

        this.items[emptyIdx] = { blockType, grade };
        console.log(`[Inventory] 추가: ${blockType.name} Lv${grade} → slot ${emptyIdx}`);
        return emptyIdx;
    }

    /**
     * 슬롯 인덱스로 제거
     * @returns {object|null} 제거된 데이터
     */
    removeItem(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.maxSlots) return null;
        const item = this.items[slotIndex];
        this.items[slotIndex] = null;
        return item;
    }

    /**
     * 전체 비우기 (패배 시)
     */
    clearAll() {
        for (let i = 0; i < this.maxSlots; i++) {
            this.items[i] = null;
        }
        console.log('[Inventory] 전체 비움 (패배)');
    }

    // ─── 조회 ─────────────────────────────

    _findFirstEmpty() {
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.items[i] === null) return i;
        }
        return -1;
    }

    isFull() {
        return this._findFirstEmpty() === -1;
    }

    getUsedCount() {
        let count = 0;
        for (const item of this.items) {
            if (item !== null) count++;
        }
        return count;
    }
}