/**
 * SaveManager.js
 * localStorage 기반 영속 저장 관리
 *
 * 공개 API:
 *   SaveManager.load()        → 시작 시 1회 호출 (필수)
 *   SaveManager.save()        → 즉시 저장 (동기)
 *   SaveManager.requestSave() → 디바운스 저장 (게임 중 권장)
 *   SaveManager.reset()       → 저장 삭제 + 기본값 복구 (개발/설정용)
 *   SaveManager.exportJSON()  → 백업 문자열 반환
 *   SaveManager.importJSON(s) → 백업 문자열 복원
 */

const SaveManager = {
    STORAGE_KEY: 'mergerpg_save_v1',   // 스키마 v2 도입 시 _v2로 변경
    DEBOUNCE_MS: 500,

    _storageAvailable: true,
    _debounceTimer: null,
    _lastSaveAt: 0,
    _initialized: false,

    // ─── 초기화 ──────────────────────────────────────

    /**
     * 저장소에서 데이터를 읽어 GameData에 주입
     * 게임 시작 전에 반드시 1회 호출
     */
    load() {
        this._checkStorage();

        if (!this._storageAvailable) {
            console.warn('[SaveManager] localStorage 미가용 → 메모리 모드로 실행');
            this._replaceGameData(createDefaultGameData());
            this._initialized = true;
            return;
        }

        let raw = null;
        try {
            raw = localStorage.getItem(this.STORAGE_KEY);
        } catch (e) {
            console.error('[SaveManager] 저장소 읽기 실패:', e);
            this._storageAvailable = false;
            this._replaceGameData(createDefaultGameData());
            this._initialized = true;
            return;
        }

        // 저장 없음 → 신규 게임
        if (!raw) {
            console.log('[SaveManager] 기존 저장 없음 → 기본값으로 새 게임 시작');
            this._replaceGameData(createDefaultGameData());
            this._initialized = true;
            this.save();
            return;
        }

        // JSON 파싱
        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.error('[SaveManager] JSON 파싱 실패 → 백업 후 기본값 복구:', e);
            this._backupCorrupted(raw);
            this._replaceGameData(createDefaultGameData());
            this._initialized = true;
            this.save();
            return;
        }

        // 마이그레이션
        const migrated = this._migrate(parsed);
        if (!migrated) {
            console.error('[SaveManager] 마이그레이션 실패 → 백업 후 기본값 복구');
            this._backupCorrupted(raw);
            this._replaceGameData(createDefaultGameData());
            this._initialized = true;
            this.save();
            return;
        }

        // 누락 필드 기본값으로 채우기 (신규 Phase 필드 추가 대응)
        const filled = this._fillMissingFields(migrated, createDefaultGameData());

        this._replaceGameData(filled);
        this._initialized = true;

        console.log(`[SaveManager] 로드 완료 (version=${GameData.version})`);
    },

    // ─── 저장 ──────────────────────────────────────

    /**
     * 즉시 저장 (동기)
     */
    save() {
        if (!this._initialized) {
            console.warn('[SaveManager] load() 이전 save() 호출 무시');
            return;
        }
        if (!this._storageAvailable) return;

        GameData.meta.updatedAt = Date.now();

        let serialized;
        try {
            serialized = JSON.stringify(GameData);
        } catch (e) {
            console.error('[SaveManager] 직렬화 실패 (순환 참조 가능성):', e);
            return;
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, serialized);
            this._lastSaveAt = Date.now();
        } catch (e) {
            // QuotaExceededError 등
            console.error('[SaveManager] 저장 실패 (용량 초과 가능성) → 메모리 모드 전환:', e);
            this._storageAvailable = false;
        }
    },

    /**
     * 디바운스 저장 (500ms 내 연속 호출은 1회로 묶음)
     * 게임 중 빈번한 상태 변경은 이 함수를 사용
     */
    requestSave() {
        if (!this._initialized) return;

        if (this._debounceTimer !== null) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
            this._debounceTimer = null;
            this.save();
        }, this.DEBOUNCE_MS);
    },

    /**
     * 저장 삭제 + GameData 기본값으로 복구
     * 개발용: F12 콘솔에서 SaveManager.reset() 호출 후 새로고침
     */
    reset() {
        if (this._debounceTimer !== null) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }

        if (this._storageAvailable) {
            try {
                localStorage.removeItem(this.STORAGE_KEY);
            } catch (e) {
                console.error('[SaveManager] 저장 삭제 실패:', e);
            }
        }
        this._replaceGameData(createDefaultGameData());
        console.log('[SaveManager] 저장 초기화 완료. 새로고침 권장.');
    },

    // ─── 백업/복원 (수동 사용) ──────────────────────────────────────

    exportJSON() {
        return JSON.stringify(GameData, null, 2);
    },

    importJSON(jsonStr) {
        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            console.error('[SaveManager] import 파싱 실패:', e);
            return false;
        }
        const migrated = this._migrate(parsed);
        if (!migrated) return false;
        const filled = this._fillMissingFields(migrated, createDefaultGameData());
        this._replaceGameData(filled);
        this.save();
        console.log('[SaveManager] import 완료. 새로고침 권장.');
        return true;
    },

    // ─── 내부 유틸 ──────────────────────────────────────

    /**
     * localStorage 접근 가능 여부 체크 (시크릿 모드/Safari private 등 대응)
     */
    _checkStorage() {
        try {
            const testKey = '__mergerpg_storage_test__';
            localStorage.setItem(testKey, '1');
            localStorage.removeItem(testKey);
            this._storageAvailable = true;
        } catch (e) {
            this._storageAvailable = false;
        }
    },

    /**
     * GameData 내용만 교체 (참조 유지)
     * 다른 모듈이 GameData를 이미 캡처했어도 새 값 참조 가능
     */
    _replaceGameData(newData) {
        for (const key of Object.keys(GameData)) {
            delete GameData[key];
        }
        Object.assign(GameData, newData);
    },

    /**
     * 파싱 실패한 원본을 타임스탬프 키로 백업 (덕팔님이 개발자 도구에서 복구 가능하게)
     */
    _backupCorrupted(raw) {
        try {
            const backupKey = `${this.STORAGE_KEY}_corrupted_${Date.now()}`;
            localStorage.setItem(backupKey, raw);
            console.warn(`[SaveManager] 손상된 저장을 ${backupKey} 키에 백업`);
        } catch (e) {
            console.error('[SaveManager] 백업 실패 (무시하고 진행):', e);
        }
    },

    /**
     * 스키마 마이그레이션
     * 현재는 v1만 존재. 추후 v2 도입 시 이 함수에 체인 추가
     */
    _migrate(data) {
        if (!data || typeof data !== 'object') return null;

        const ver = data.version || 0;

        if (ver > SCHEMA_VERSION) {
            console.error(`[SaveManager] 저장 버전(${ver})이 현재(${SCHEMA_VERSION})보다 최신 → 복구 불가`);
            return null;
        }

        // TODO: 버전 업 시 여기에 추가
        // if (ver < 2) data = this._migrate_v1_to_v2(data);

        data.version = SCHEMA_VERSION;
        return data;
    },

    /**
     * 누락 필드 기본값 채우기 (깊은 머지)
     * - 기존 키: 유지
     * - 누락 키: 기본값 깊은 복사 주입
     * - 배열/원시값: 기존 유지 (사용자 데이터 보존)
     */
    _fillMissingFields(target, defaults) {
        if (target === null || typeof target !== 'object') return defaults;

        for (const key of Object.keys(defaults)) {
            const defVal = defaults[key];

            if (!(key in target)) {
                // 키 자체 누락 → 기본값 깊은 복사로 주입
                target[key] = JSON.parse(JSON.stringify(defVal));
                continue;
            }

            // 둘 다 plain object면 재귀
            const targetVal = target[key];
            const isDefObj = defVal !== null && typeof defVal === 'object' && !Array.isArray(defVal);
            const isTargetObj = targetVal !== null && typeof targetVal === 'object' && !Array.isArray(targetVal);

            if (isDefObj && isTargetObj) {
                this._fillMissingFields(targetVal, defVal);
            }
            // 그 외(원시값, 배열)는 기존 값 유지
        }
        return target;
    },
};