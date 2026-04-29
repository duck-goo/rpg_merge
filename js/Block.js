/**
 * Block.js
 * 머지 보드 위의 블럭 (Phase 3-11-A: 스페이서 지원)
 *
 * 일반 블럭과 스페이서 블럭은 같은 클래스를 공유하되,
 * isSpawner 플래그로 외형/동작을 분기.
 */
class Block extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {number} size
     * @param {object} blockType - CONFIG.BLOCK.TYPES 중 하나
     * @param {number} grade
     */
    constructor(scene, x, y, size, blockType, grade) {
        super(scene, x, y);

        this.blockType = blockType;
        this.grade = grade;
        this.blockSize = size;

        // 보드 좌표
        this.boardCol = -1;
        this.boardRow = -1;

        // 드래그 보조
        this.dragStartX = 0;
        this.dragStartY = 0;

        // 위치 분류
        this.location = 'board';
        this.inventorySlot = -1;

        // ★ 스페이서 플래그
        this.isSpawner = !!blockType.isSpawner;

        this._draw();
        scene.add.existing(this);
    }

    _draw() {
        if (this.isSpawner) {
            this._drawSpawner();
        } else {
            this._drawNormal();
        }
        this.setSize(this.blockSize, this.blockSize);
        this.setInteractive({ draggable: true });
    }

    /**
     * 스페이서 외형: 외곽선 + 아이콘 + 이름
     */
    _drawSpawner() {
        const margin = CONFIG.BLOCK.MARGIN;
        const drawSize = this.blockSize - margin * 2;
        const radius = CONFIG.BLOCK.BORDER_RADIUS;

        const bg = this.scene.add.graphics();
        bg.fillStyle(this.blockType.color, 1);
        bg.fillRoundedRect(-drawSize / 2, -drawSize / 2, drawSize, drawSize, radius);
        // 외곽선으로 일반 블럭과 구분
        bg.lineStyle(3, 0xffffff, 0.85);
        bg.strokeRoundedRect(-drawSize / 2 + 1, -drawSize / 2 + 1, drawSize - 2, drawSize - 2, radius);
        this.add(bg);

        // 아이콘
        const iconText = this.scene.add.text(0, -drawSize * 0.08, this.blockType.icon || '?', {
            fontFamily: 'Arial',
            fontSize: `${Math.floor(drawSize * 0.42)}px`,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add(iconText);

        // 이름 (하단)
        const nameText = this.scene.add.text(0, drawSize / 2 - 8, this.blockType.name, {
            fontFamily: 'Arial',
            fontSize: '8px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add(nameText);
    }

    /**
     * 일반 블럭 외형: 등급 숫자 중앙 + 타입 약자 상단
     */
    _drawNormal() {
        const margin = CONFIG.BLOCK.MARGIN;
        const drawSize = this.blockSize - margin * 2;
        const radius = CONFIG.BLOCK.BORDER_RADIUS;

        const bg = this.scene.add.graphics();
        bg.fillStyle(this.blockType.color, 1);
        bg.fillRoundedRect(-drawSize / 2, -drawSize / 2, drawSize, drawSize, radius);
        this.add(bg);

        // 등급 숫자
        const gradeText = this.scene.add.text(0, 0, String(this.grade), {
            fontFamily: 'Arial',
            fontSize: `${Math.floor(drawSize * 0.45)}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
        }).setOrigin(0.5);
        this.add(gradeText);
        this.gradeText = gradeText;

        // 타입 약자 (상단)
        const typeLabel = this.blockType.key.charAt(0).toUpperCase();
        const labelText = this.scene.add.text(0, -drawSize / 2 + 10, typeLabel, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        this.add(labelText);
    }

    /**
     * 등급 변경 시 화면 갱신 (일반 블럭만)
     */
    setGrade(newGrade) {
        if (this.isSpawner) return;
        this.grade = newGrade;
        if (this.gradeText) this.gradeText.setText(String(newGrade));
    }
}