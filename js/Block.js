/**
 * Block.js
 * 머지 보드 위의 개별 블럭
 * 데이터(type, grade)와 화면 표현(Container)을 함께 관리
 */
class Block extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - 화면 x 좌표
     * @param {number} y - 화면 y 좌표
     * @param {number} size - 블럭 크기 (px)
     * @param {object} blockType - CONFIG.BLOCK.TYPES 중 하나
     * @param {number} grade - 등급 (1~)
     */
    constructor(scene, x, y, size, blockType, grade) {
        super(scene, x, y);

        this.blockType = blockType;
        this.grade = grade;
        this.blockSize = size;

        // 보드 상 위치 (col, row) — BoardManager가 설정
        this.boardCol = -1;
        this.boardRow = -1;

        // 드래그 시작 위치 저장용
        this.dragStartX = 0;
        this.dragStartY = 0;
        // 블럭 소속: 'board' 또는 'queue'
        this.location = 'board';
        // 인벤토리 슬롯 인덱스 (location === 'inventory'일 때만 유효)
        this.inventorySlot = -1;

        this._draw();
        scene.add.existing(this);
    }

    /**
     * 블럭 외형 그리기
     */
    _draw() {
        const margin = CONFIG.BLOCK.MARGIN;
        const drawSize = this.blockSize - margin * 2;
        const radius = CONFIG.BLOCK.BORDER_RADIUS;

        // 배경 사각형
        const bg = this.scene.add.graphics();
        bg.fillStyle(this.blockType.color, 1);
        bg.fillRoundedRect(
            -drawSize / 2, -drawSize / 2,
            drawSize, drawSize,
            radius
        );
        this.add(bg);

        // 등급 텍스트
        const gradeText = this.scene.add.text(0, 0, String(this.grade), {
            fontFamily: 'Arial, sans-serif',
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
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#ffffff',
            alpha: 0.7,
            align: 'center',
        }).setOrigin(0.5);
        this.add(labelText);

        // 인터랙티브 영역 설정 (드래그용)
        this.setSize(this.blockSize, this.blockSize);
        this.setInteractive({ draggable: true });
    }

    /**
     * 등급 변경 시 화면 갱신
     */
    setGrade(newGrade) {
        this.grade = newGrade;
        this.gradeText.setText(String(newGrade));
    }
}