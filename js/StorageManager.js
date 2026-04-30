/**
 * StorageManager.js
 * 로비 창고 — 블럭 보관 + 분해 (Phase 3-10)
 *
 * 책임:
 * - 던전→로비 블럭 이관
 * - 블럭 그룹화 (같은 종류+등급 묶기)
 * - 분해 → 조각 지급
 * - 조각 수량 조회
 */
const StorageManager = {
    // ─── 설정 ────────────────────

    // 등급별 분해 시 지급 조각 수 (지침서 3.2)
    FRAGMENT_YIELD: {
        1: 1,
        2: 3,
        3: 7,
    },

    // 블럭 카테고리 → 조각 key 매핑
    BLOCK_TO_FRAGMENT: {
        hero:      'hero',
        equip:     'equip',
        potion: 'potion',
    },

    // ─── 이관 ────────────────────

    /**
     * 던전 인벤토리의 아이템들을 창고로 이관
     * @param {Array<{blockType, grade}>} items - 던전 인벤토리 아이템 (null 제외)
     * @returns {number} 이관된 개수
     */
    // ─── 이관: 던전 → 대기 ────────────────────

    /**
     * 던전 인벤토리를 "대기 상태"로 추가 (창고 탭에서 확인해야 확정)
     * @param {Array} items - 던전 인벤토리 아이템 (null 제외)
     * @returns {number} 대기 추가된 개수
     */
    addPending(items) {
        if (!items || items.length === 0) return 0;
    
        if (!GameData.storage.pendingItems) GameData.storage.pendingItems = [];
        const pending = GameData.storage.pendingItems;
    
        let count = 0;
        for (const item of items) {
            if (!item) continue;
            pending.push({
                blockTypeKey: item.blockType.key,
                grade: item.grade,
            });
            count++;
        }
    
        if (count > 0) {
            SaveManager.save();
            EventBus.emit('storage:pendingChanged', { count });
        }
    
        console.log(`[Storage] 대기 추가: ${count}개 (총 대기 ${pending.length}개)`);
        return count;
    },
    
    /**
     * 대기 중인 블럭이 있는지
     */
    hasPending() {
        return (GameData.storage.pendingItems || []).length > 0;
    },
    
    /**
     * 대기 목록 조회 (그룹화)
     * @returns {Array<{blockType, grade, count}>}
     */
    getPendingGrouped() {
        const map = new Map();
        const pending = GameData.storage.pendingItems || [];
    
        for (const item of pending) {
            const key = `${item.blockTypeKey}:${item.grade}`;
            const blockType = this._findBlockType(item.blockTypeKey);
            if (!blockType) continue;
        
            if (!map.has(key)) {
                map.set(key, { blockType, grade: item.grade, count: 0 });
            }
            map.get(key).count++;
        }
    
        return Array.from(map.values()).sort((a, b) => {
            if (b.grade !== a.grade) return b.grade - a.grade;
            return a.blockType.key.localeCompare(b.blockType.key);
        });
    },
    
    /**
     * 대기 블럭을 확정 창고로 이관
     * Phase 3-10에서는 모두 items로. 3-12에서 영웅은 heroes로 분기 예정.
     */
    confirmPending() {
        const pending = GameData.storage.pendingItems || [];
        if (pending.length === 0) {
            return { success: false, reason: '확인할 블럭이 없습니다' };
        }
    
        const moved = pending.length;
    
        for (const item of pending) {
            GameData.storage.items.push({
                blockTypeKey: item.blockTypeKey,
                grade: item.grade,
            });
        }
    
        GameData.storage.pendingItems = [];
    
        SaveManager.save();
        EventBus.emit('storage:pendingChanged', { count: 0 });
        EventBus.emit('storage:changed', { confirmed: moved });
    
        console.log(`[Storage] 확정 이관: ${moved}개`);
        return { success: true, moved };
    },

    // ─── 조회 ────────────────────

    /**
     * 같은 종류+등급의 블럭을 스택으로 그룹화
     * @param {string} [categoryFilter] - 'equip' | 'potion' | 'hero' (생략 시 전체)
     * @returns {Array<{blockType, grade, count}>} UI용 스택 배열
     */
    getGroupedItems(categoryFilter) {
        const map = new Map();

        for (const item of GameData.storage.items) {
            const key = `${item.blockTypeKey}:${item.grade}`;
            const blockType = this._findBlockType(item.blockTypeKey);
            if (!blockType) continue;

            // 필터 적용
            if (categoryFilter) {
                const category = this._getCategory(item.blockTypeKey);
                if (category !== categoryFilter) continue;
            }

            if (!map.has(key)) {
                map.set(key, { blockType, grade: item.grade, count: 0 });
            }
            map.get(key).count++;
        }

        // 정렬: 등급 내림차순 → 이름
        return Array.from(map.values()).sort((a, b) => {
            if (b.grade !== a.grade) return b.grade - a.grade;
            return a.blockType.key.localeCompare(b.blockType.key);
        });
    },

    /**
     * 카테고리별 개수
     */
    getCategoryCount(category) {
        let count = 0;
        for (const item of GameData.storage.items) {
            if (this._getCategory(item.blockTypeKey) === category) count++;
        }
        return count;
    },

    getTotalCount() {
        return GameData.storage.items.length;
    },

    getFragmentCount(fragmentKey) {
        return (GameData.fragments && GameData.fragments[fragmentKey]) || 0;
    },

    // ─── 분해 ────────────────────

    /**
     * 지정 종류+등급의 블럭 1개 분해
     * @returns {{success, fragmentKey, amount, remaining}}
     */
    dismantle(blockTypeKey, grade) {
        const items = GameData.storage.items;

        // 일치하는 첫 항목 찾기
        const idx = items.findIndex(
            it => it.blockTypeKey === blockTypeKey && it.grade === grade
        );
        if (idx === -1) {
            return { success: false, reason: '해당 블럭이 없습니다' };
        }

        const category = this._getCategory(blockTypeKey);
        const fragmentKey = this.CATEGORY_TO_FRAGMENT[category];
        if (!fragmentKey) {
            return { success: false, reason: '분해할 수 없는 블럭' };
        }

        const amount = this.FRAGMENT_YIELD[grade] || 0;
        if (amount <= 0) {
            return { success: false, reason: '분해 수치 정의 없음' };
        }

        // 배열에서 제거
        items.splice(idx, 1);

        // 조각 지급
        if (!GameData.fragments) GameData.fragments = { hero: 0, equip: 0, potion: 0 };
        GameData.fragments[fragmentKey] = (GameData.fragments[fragmentKey] || 0) + amount;

        SaveManager.requestSave();
        EventBus.emit('storage:changed', { dismantled: 1, fragmentKey, amount });
        EventBus.emit('fragments:changed', { [fragmentKey]: amount });

        // 남은 개수 (같은 블럭+등급)
        const remaining = items.filter(
            it => it.blockTypeKey === blockTypeKey && it.grade === grade
        ).length;

        console.log(`[Storage] 분해: ${blockTypeKey} Lv.${grade} → ${fragmentKey} +${amount}, 남음 ${remaining}`);

        return { success: true, fragmentKey, amount, remaining };
    },

    // ─── 유틸 ────────────────────

    _findBlockType(key) {
        const types = CONFIG.BLOCK.TYPES;
        for (const k in types) {
            if (types[k].key === key) return types[k];
        }
        return null;
    },

    /**
     * 블럭 key → 카테고리
     * hero → 'hero'
     * equip → 'equip'
     * potion → 'potion'
     */
    _getCategory(blockTypeKey) {
        const blockType = this._findBlockType(blockTypeKey);
        if (!blockType) return 'unknown';
        return blockType.category;   // 'hero' | 'equip' | 'potion' | 'spawner'
    }
};