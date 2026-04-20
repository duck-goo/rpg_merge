/**
 * EventBus.js
 * 단순 이벤트 브로드캐스트 (Phase 3-2 씬 분리 대비 미리 준비)
 *
 * 사용 예:
 *   EventBus.on('resources:changed', (data) => { ... });
 *   EventBus.emit('resources:changed', { gold: 150 });
 *   EventBus.off('resources:changed', myCallback);
 *
 * 이벤트 네이밍 규칙(권장): '카테고리:동작' (resources:changed, stage:cleared, inventory:added)
 */

const EventBus = {
    _listeners: {},

    on(event, callback) {
        if (typeof callback !== 'function') {
            console.warn(`[EventBus] on(${event}) → callback이 함수 아님`);
            return;
        }
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
    },

    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
        if (!this._listeners[event]) return;
        // 리스너 콜백에서 예외가 나도 다른 리스너에 영향 주지 않도록 slice + try/catch
        const listeners = this._listeners[event].slice();
        for (const cb of listeners) {
            try {
                cb(data);
            } catch (e) {
                console.error(`[EventBus] ${event} 리스너 에러:`, e);
            }
        }
    },

    clear() {
        this._listeners = {};
    },
};