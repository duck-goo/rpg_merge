/**
 * PlaceholderTab.js
 * 영웅/창고/이벤트 탭 공용 플레이스홀더
 * "준비 중" 안내 + 연결 예정 Phase 표시
 */
class PlaceholderTab {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} area - { x, y, width, height }
     * @param {object} info - { icon, title, description, phaseLabel }
     */
    constructor(scene, area, info) {
        this.scene = scene;
        this.area = area;
        this.info = info;

        this.container = null;
        this._build();
        this.hide();
    }

    _build() {
        const { x, y, width, height } = this.area;
        this.container = this.scene.add.container(0, 0);

        const cx = x + width / 2;
        const cy = y + height / 2;

        // 아이콘
        const iconText = this.scene.add.text(cx, cy - 50, this.info.icon, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '64px',
        }).setOrigin(0.5).setAlpha(0.4);
        this.container.add(iconText);

        // 타이틀
        const titleText = this.scene.add.text(cx, cy + 10, this.info.title, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.container.add(titleText);

        // 설명
        const descText = this.scene.add.text(cx, cy + 36, this.info.description, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#aaaaaa',
            align: 'center',
            wordWrap: { width: width - 40 },
            lineSpacing: 4,
        }).setOrigin(0.5, 0);
        this.container.add(descText);

        // 연결 예정 Phase
        if (this.info.phaseLabel) {
            const phaseText = this.scene.add.text(cx, cy + 90, this.info.phaseLabel, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#f1c40f',
            }).setOrigin(0.5);
            this.container.add(phaseText);
        }
    }

    show() {
        if (this.container) this.container.setVisible(true);
    }

    hide() {
        if (this.container) this.container.setVisible(false);
    }

    destroy() {
        this.container = null;
    }
}