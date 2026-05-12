/**
 * config.js
 * 게임 전역 설정값
 * 레이아웃, 보드 크기, 색상 등 한 곳에서 관리
 */
const CONFIG = {
    // 게임 논리 해상도
    GAME_WIDTH: 360,
    GAME_HEIGHT: 640,

    // 보드 설정
    BOARD: {
        COLS: 6,
        ROWS: 7,
        GAP: 2,           // 칸 사이 간격 (px)
        PADDING: 10,      // 보드 좌우 여백 (px)
    },

    // 인벤토리 설정
    INVENTORY: {
        INITIAL_SLOTS: 20,    // 초기 칸수
        COLS: 5,              // 인벤 창 가로 칸수
        CELL_SIZE: 52,        // 인벤 창 셀 크기
        CELL_GAP: 4,
    },

    // UI 레이아웃 (Y 기준, 비율 → 픽셀 변환)
    LAYOUT: {
        // 적군 영역: 0% ~ 15%
        ENEMY_Y: 0,
        ENEMY_HEIGHT: 0.15,

        // 보드 영역: 23% ~ 83%
        BOARD_Y: 0.23,
        BOARD_HEIGHT: 0.60,

        // 하단 버튼 영역: 83% ~ 95%
        BUTTON_Y: 0.83,
        BUTTON_HEIGHT: 0.12,
    },

    // 임시 색상 (추후 에셋으로 교체)
    COLORS: {
        BOARD_BG: 0x16213e,       // 보드 배경
        CELL_EMPTY: 0x0f3460,     // 빈 칸
        CELL_BORDER: 0x1a1a2e,    // 칸 테두리 (배경과 동일 = 간격 효과)
        ENEMY_AREA: 0x1a1a2e,     // 적군 영역 (현재 배경색)
        BUTTON_AREA: 0x1a1a2e,    // 버튼 영역
        // 인벤토리
        INV_OVERLAY: 0x000000,     // 반투명 배경 (알파로 투명도 조절)
        INV_PANEL: 0x16213e,       // 인벤 창 배경
        INV_SLOT: 0x0f3460,        // 인벤 셀
        INV_SLOT_EMPTY: 0x233554,  // 빈 인벤 셀
    },
    
    // 블럭 설정
    BLOCK: {
        TYPES: {
            // ─── 영웅 (16종 - v2 네이밍) ───
            // 0차
            HERO_ADVENTURER: { key: 'hero_adventurer', name: '모험가', short: '모', color: 0x95a5a6, category: 'hero', tier: 0, line: 'common' },

            // 1차 (5종)
            HERO_WARRIOR: { key: 'hero_warrior', name: '워리어', short: '워', color: 0xe74c3c, category: 'hero', tier: 1, line: 'warrior' },
            HERO_ARCHER:  { key: 'hero_archer',  name: '궁수',   short: '궁', color: 0xe67e22, category: 'hero', tier: 1, line: 'archer' },
            HERO_MAGE:    { key: 'hero_mage',    name: '마법사', short: '마', color: 0x3498db, category: 'hero', tier: 1, line: 'mage' },
            HERO_CLERIC:  { key: 'hero_cleric',  name: '사제',   short: '사', color: 0xf1c40f, category: 'hero', tier: 1, line: 'cleric' },
            HERO_THIEF:   { key: 'hero_thief',   name: '도적',   short: '도', color: 0x8e44ad, category: 'hero', tier: 1, line: 'thief' },

            // 2차 (10종)
            HERO_SWORDSMAN: { key: 'hero_swordsman', name: '검사',     short: '검', color: 0xc0392b, category: 'hero', tier: 2, line: 'warrior' },
            HERO_LANCER_T1: { key: 'hero_lancer_t1', name: '창기사',   short: '창', color: 0xa93226, category: 'hero', tier: 2, line: 'warrior' },
            HERO_SNIPER:    { key: 'hero_sniper',    name: '저격수',   short: '저', color: 0xd35400, category: 'hero', tier: 2, line: 'archer' },
            HERO_DUALIST:   { key: 'hero_dualist',   name: '쌍수전사', short: '쌍', color: 0xba4a00, category: 'hero', tier: 2, line: 'archer' },
            HERO_ARCHMAGE:  { key: 'hero_archmage',  name: '대마법사', short: '대', color: 0x2980b9, category: 'hero', tier: 2, line: 'mage' },
            HERO_SUMMONER:  { key: 'hero_summoner',  name: '술사',     short: '술', color: 0x21618c, category: 'hero', tier: 2, line: 'mage' },
            HERO_BISHOP:    { key: 'hero_bishop',    name: '신관',     short: '신', color: 0xd4ac0d, category: 'hero', tier: 2, line: 'cleric' },
            HERO_MONK:      { key: 'hero_monk',      name: '수도사',   short: '수', color: 0xb7950b, category: 'hero', tier: 2, line: 'cleric' },
            HERO_ASSASSIN:  { key: 'hero_assassin',  name: '암살자',   short: '암', color: 0x7d3c98, category: 'hero', tier: 2, line: 'thief' },
            HERO_RAIDER:    { key: 'hero_raider',    name: '약탈자',   short: '약', color: 0x6c3483, category: 'hero', tier: 2, line: 'thief' },

            // 3차 (20종) — 2차에서 분기
            HERO_KNIGHT:           { key: 'hero_knight',           name: '기사',         short: '기', color: 0x922b21, category: 'hero', tier: 3, line: 'warrior' },
            HERO_SHIELDER:         { key: 'hero_shielder',         name: '방패병',       short: '방', color: 0x7b241c, category: 'hero', tier: 3, line: 'warrior' },
            HERO_DRAGOON:          { key: 'hero_dragoon',          name: '용기병',       short: '용', color: 0x641e16, category: 'hero', tier: 3, line: 'warrior' },
            HERO_LANCER_T3:        { key: 'hero_lancer_t3',        name: '랜스기사',     short: '랜', color: 0x4d1612, category: 'hero', tier: 3, line: 'warrior' },
            HERO_MARKSMAN:         { key: 'hero_marksman',         name: '명사수',       short: '명', color: 0xa04000, category: 'hero', tier: 3, line: 'archer' },
            HERO_RANGER:           { key: 'hero_ranger',           name: '레인저',       short: '레', color: 0x873600, category: 'hero', tier: 3, line: 'archer' },
            HERO_TRACKER:          { key: 'hero_tracker',          name: '추적자',       short: '추', color: 0x6e2c00, category: 'hero', tier: 3, line: 'archer' },
            HERO_SWIFT_BLADE:      { key: 'hero_swift_blade',      name: '쾌검사',       short: '쾌', color: 0x4d2900, category: 'hero', tier: 3, line: 'archer' },
            HERO_ELEMENTALIST:     { key: 'hero_elementalist',     name: '원소술사',     short: '원', color: 0x1f618d, category: 'hero', tier: 3, line: 'mage' },
            HERO_SPELLCASTER:      { key: 'hero_spellcaster',      name: '주문사',       short: '주', color: 0x154360, category: 'hero', tier: 3, line: 'mage' },
            HERO_NECROMANCER:      { key: 'hero_necromancer',      name: '사령술사',     short: '사', color: 0x4a235a, category: 'hero', tier: 3, line: 'mage' },
            HERO_SUMMONER_T3:      { key: 'hero_summoner_t3',      name: '소환사',       short: '소', color: 0x39184a, category: 'hero', tier: 3, line: 'mage' },
            HERO_PRIEST:           { key: 'hero_priest',           name: '주교',         short: '교', color: 0xb9770e, category: 'hero', tier: 3, line: 'cleric' },
            HERO_PALADIN:          { key: 'hero_paladin',          name: '성기사',       short: '성', color: 0x9c640c, category: 'hero', tier: 3, line: 'cleric' },
            HERO_FIST_MASTER:      { key: 'hero_fist_master',      name: '권사',         short: '권', color: 0x7d6608, category: 'hero', tier: 3, line: 'cleric' },
            HERO_TEMPLE_GUARD:     { key: 'hero_temple_guard',     name: '수호기사',     short: '수', color: 0x5b4a06, category: 'hero', tier: 3, line: 'cleric' },
            HERO_SHADOW_ASSASSIN:  { key: 'hero_shadow_assassin',  name: '저격 암살자',  short: '저', color: 0x5b2c6f, category: 'hero', tier: 3, line: 'thief' },
            HERO_SHADOW_TRACKER:   { key: 'hero_shadow_tracker',   name: '그림자추적자', short: '그', color: 0x4a235a, category: 'hero', tier: 3, line: 'thief' },
            HERO_BERSERKER:        { key: 'hero_berserker',        name: '광전사',       short: '광', color: 0x39184a, category: 'hero', tier: 3, line: 'thief' },
            HERO_VIPER:            { key: 'hero_viper',            name: '독사',         short: '독', color: 0x2d0f3a, category: 'hero', tier: 3, line: 'thief' },

            // 4차 (20종) — 3차 강화
            HERO_GRAND_KNIGHT:        { key: 'hero_grand_knight',        name: '대기사',         short: '대기', color: 0x6e1812, category: 'hero', tier: 4, line: 'warrior' },
            HERO_ROYAL_GUARD:         { key: 'hero_royal_guard',         name: '근위병',         short: '근', color: 0x5b1310, category: 'hero', tier: 4, line: 'warrior' },
            HERO_ROYAL_DRAGOON:       { key: 'hero_royal_dragoon',       name: '왕실 용기병',    short: '왕용', color: 0x4d1612, category: 'hero', tier: 4, line: 'warrior' },
            HERO_ROYAL_LANCER:        { key: 'hero_royal_lancer',        name: '왕실 랜스기사',  short: '왕랜', color: 0x3a100e, category: 'hero', tier: 4, line: 'warrior' },
            HERO_EAGLE_EYE:           { key: 'hero_eagle_eye',           name: '독수리눈',       short: '독', color: 0x7d3500, category: 'hero', tier: 4, line: 'archer' },
            HERO_WIND_GUARDIAN:       { key: 'hero_wind_guardian',       name: '바람의 수호자',  short: '바', color: 0x652900, category: 'hero', tier: 4, line: 'archer' },
            HERO_BEAST_TRACKER:       { key: 'hero_beast_tracker',       name: '맹수 추적자',    short: '맹', color: 0x521f00, category: 'hero', tier: 4, line: 'archer' },
            HERO_BLADE_DANCER:        { key: 'hero_blade_dancer',        name: '검무사',         short: '검무', color: 0x401900, category: 'hero', tier: 4, line: 'archer' },
            HERO_GRAND_ELEMENTALIST:  { key: 'hero_grand_elementalist',  name: '대원소술사',     short: '대원', color: 0x16456c, category: 'hero', tier: 4, line: 'mage' },
            HERO_SKY_CASTER:          { key: 'hero_sky_caster',          name: '천공술사',       short: '천', color: 0x0e3550, category: 'hero', tier: 4, line: 'mage' },
            HERO_ABYSS_CASTER:        { key: 'hero_abyss_caster',        name: '심연술사',       short: '심', color: 0x39184a, category: 'hero', tier: 4, line: 'mage' },
            HERO_SUMMON_MASTER:       { key: 'hero_summon_master',       name: '소환 대가',      short: '소대', color: 0x2a1239, category: 'hero', tier: 4, line: 'mage' },
            HERO_HIGH_PRIEST:         { key: 'hero_high_priest',         name: '대주교',         short: '대주', color: 0x9c640c, category: 'hero', tier: 4, line: 'cleric' },
            HERO_HOLY_KNIGHT:         { key: 'hero_holy_knight',         name: '신성기사',       short: '신', color: 0x7d6608, category: 'hero', tier: 4, line: 'cleric' },
            HERO_GRAND_FIST:          { key: 'hero_grand_fist',          name: '대권사',         short: '대권', color: 0x5b4a06, category: 'hero', tier: 4, line: 'cleric' },
            HERO_INQUISITOR:          { key: 'hero_inquisitor',          name: '심판자',         short: '심판', color: 0x423605, category: 'hero', tier: 4, line: 'cleric' },
            HERO_PHANTOM_KILLER:      { key: 'hero_phantom_killer',      name: '환영살수',       short: '환', color: 0x4a235a, category: 'hero', tier: 4, line: 'thief' },
            HERO_NIGHT_TRACKER:       { key: 'hero_night_tracker',       name: '밤의 추적자',    short: '밤', color: 0x39184a, category: 'hero', tier: 4, line: 'thief' },
            HERO_RAGING_BERSERKER:    { key: 'hero_raging_berserker',    name: '광전 광전사',    short: '광전', color: 0x2a1239, category: 'hero', tier: 4, line: 'thief' },
            HERO_VIPER_LORD:          { key: 'hero_viper_lord',          name: '독사 군주',      short: '독군', color: 0x1f0e2c, category: 'hero', tier: 4, line: 'thief' },
            
            // 5차 (20종) — 최종
            HERO_SWORD_LORD:          { key: 'hero_sword_lord',          name: '검의 군주',         short: '검군', color: 0x4a0e0a, category: 'hero', tier: 5, line: 'warrior' },
            HERO_KING_SHIELD:         { key: 'hero_king_shield',         name: '왕의 방패',         short: '왕방', color: 0x3a0908, category: 'hero', tier: 5, line: 'warrior' },
            HERO_HOLY_DRAGOON:        { key: 'hero_holy_dragoon',        name: '성스러운 용기병',   short: '성용', color: 0x2d0606, category: 'hero', tier: 5, line: 'warrior' },
            HERO_TEMPEST_LANCER:      { key: 'hero_tempest_lancer',      name: '폭풍의 랜스기사',   short: '폭', color: 0x230304, category: 'hero', tier: 5, line: 'warrior' },
            HERO_DEAD_EYE:            { key: 'hero_dead_eye',            name: '데드아이',          short: '데', color: 0x521f00, category: 'hero', tier: 5, line: 'archer' },
            HERO_WIND_PATHFINDER:     { key: 'hero_wind_pathfinder',     name: '바람의 길잡이',     short: '바길', color: 0x401900, category: 'hero', tier: 5, line: 'archer' },
            HERO_SHADOW_HUNTER:       { key: 'hero_shadow_hunter',       name: '그림자 추격자',     short: '그추', color: 0x2e1100, category: 'hero', tier: 5, line: 'archer' },
            HERO_MOONLIGHT_DANCER:    { key: 'hero_moonlight_dancer',    name: '달빛 검무사',       short: '달', color: 0x1f0a00, category: 'hero', tier: 5, line: 'archer' },
            HERO_ELEMENTAL_LORD:      { key: 'hero_elemental_lord',      name: '원소의 군주',       short: '원군', color: 0x0a2c44, category: 'hero', tier: 5, line: 'mage' },
            HERO_TIME_CASTER:         { key: 'hero_time_caster',         name: '시간의 술사',       short: '시', color: 0x051b2c, category: 'hero', tier: 5, line: 'mage' },
            HERO_DIABLO:              { key: 'hero_diablo',              name: '디아블로',          short: '디', color: 0x2a1239, category: 'hero', tier: 5, line: 'mage' },
            HERO_ARCANA_LORD:         { key: 'hero_arcana_lord',         name: '아카나의 군주',     short: '아', color: 0x1f0e2c, category: 'hero', tier: 5, line: 'mage' },
            HERO_ORACLE:              { key: 'hero_oracle',              name: '오라클',            short: '오', color: 0x7d6608, category: 'hero', tier: 5, line: 'cleric' },
            HERO_HEAVEN_KNIGHT:       { key: 'hero_heaven_knight',       name: '천상의 기사',       short: '천기', color: 0x5b4a06, category: 'hero', tier: 5, line: 'cleric' },
            HERO_HEAVEN_FIST:         { key: 'hero_heaven_fist',         name: '천상의 권사',       short: '천권', color: 0x423605, category: 'hero', tier: 5, line: 'cleric' },
            HERO_DIVINE_JUDGE:        { key: 'hero_divine_judge',        name: '신의 심판관',       short: '신판', color: 0x2a2304, category: 'hero', tier: 5, line: 'cleric' },
            HERO_ABYSS_PHANTOM:       { key: 'hero_abyss_phantom',       name: '심연의 환영',       short: '심환', color: 0x39184a, category: 'hero', tier: 5, line: 'thief' },
            HERO_NIGHT_LORD:          { key: 'hero_night_lord',          name: '밤의 군주',         short: '밤군', color: 0x2a1239, category: 'hero', tier: 5, line: 'thief' },
            HERO_BLOOD_BERSERKER:     { key: 'hero_blood_berserker',     name: '피의 광전사',       short: '피광', color: 0x1f0e2c, category: 'hero', tier: 5, line: 'thief' },
            HERO_DOOM_VIPER:          { key: 'hero_doom_viper',          name: '재앙의 독사',       short: '재', color: 0x110720, category: 'hero', tier: 5, line: 'thief' },

            // ─── 장비 1차 (5종) — 대장간(보급고)에서 랜덤 ───
            EQ_SHORT_SWORD: { key: 'eq_short_sword', name: '숏소드',     short: '검', color: 0x5dade2, category: 'equip', tier: 1, line: 'sword' },
            EQ_SHORT_BOW:   { key: 'eq_short_bow',   name: '숏보우',     short: '활', color: 0x48c9b0, category: 'equip', tier: 1, line: 'bow' },
            EQ_WOOD_STICK:  { key: 'eq_wood_stick',  name: '나무 막대기', short: '봉', color: 0x5499c7, category: 'equip', tier: 1, line: 'staff' },
            EQ_HOLY_WATER:  { key: 'eq_holy_water',  name: '성수병',     short: '성', color: 0xf7dc6f, category: 'equip', tier: 1, line: 'holy' },
            EQ_KNIFE:       { key: 'eq_knife',       name: '나이프',     short: '단', color: 0xbb8fce, category: 'equip', tier: 1, line: 'dagger' },

            // ─── 장비 2차 (10종) — 1차 분기 ───
            EQ_LONG_SWORD:  { key: 'eq_long_sword',  name: '롱소드',     short: '검', color: 0x2e86c1, category: 'equip', tier: 2, line: 'sword' },
            EQ_SPEAR:       { key: 'eq_spear',       name: '스피어',     short: '창', color: 0x922b21, category: 'equip', tier: 2, line: 'spear' },
            EQ_LONG_BOW:    { key: 'eq_long_bow',    name: '롱보우',     short: '활', color: 0x16a085, category: 'equip', tier: 2, line: 'bow' },
            EQ_DUAL_DAGGER: { key: 'eq_dual_dagger', name: '듀얼대거',   short: '쌍', color: 0xe67e22, category: 'equip', tier: 2, line: 'dual' },
            EQ_MAGIC_STAFF: { key: 'eq_magic_staff', name: '마법 지팡이', short: '봉', color: 0x1b4f72, category: 'equip', tier: 2, line: 'staff' },
            EQ_ORB:         { key: 'eq_orb',         name: '수정구',     short: '구', color: 0x6c3483, category: 'equip', tier: 2, line: 'orb' },
            EQ_CROSS:       { key: 'eq_cross',       name: '십자가',     short: '십', color: 0xd4ac0d, category: 'equip', tier: 2, line: 'cross' },
            EQ_FLAIL:       { key: 'eq_flail',       name: '도리깨',     short: '도', color: 0xb9770e, category: 'equip', tier: 2, line: 'flail' },
            EQ_DAGGER:      { key: 'eq_dagger',      name: '단검',       short: '단', color: 0x76448a, category: 'equip', tier: 2, line: 'dagger' },
            EQ_HAND_AXE:    { key: 'eq_hand_axe',    name: '핸드 엑스',   short: '도', color: 0x884ea0, category: 'equip', tier: 2, line: 'axe' },

            // ─── 장비 3차 (20종) — 2차 분기. B-2-A에서는 단순 정의만, 영웅 진화는 B-2-B에서 ───
            EQ_BROAD_SWORD:   { key: 'eq_broad_sword',   name: '브로드소드',    short: '검', color: 0x1f618d, category: 'equip', tier: 3, line: 'sword' },
            EQ_KITE_SHIELD:   { key: 'eq_kite_shield',   name: '카이트실드',    short: '방', color: 0x154360, category: 'equip', tier: 3, line: 'shield' },
            EQ_JAVELIN:       { key: 'eq_javelin',       name: '재블린',         short: '창', color: 0x7b241c, category: 'equip', tier: 3, line: 'spear' },
            EQ_LANCE:         { key: 'eq_lance',         name: '랜스',           short: '랜', color: 0x641e16, category: 'equip', tier: 3, line: 'lance' },
            EQ_CROSSBOW:      { key: 'eq_crossbow',      name: '크로스보우',     short: '쇠', color: 0x117864, category: 'equip', tier: 3, line: 'bow' },
            EQ_ELVEN_BOW:     { key: 'eq_elven_bow',     name: '엘븐보우',       short: '대', color: 0x0e6655, category: 'equip', tier: 3, line: 'great_bow' },
            EQ_SILVER_DUAL:   { key: 'eq_silver_dual',   name: '실버 듀얼대거',  short: '쌍', color: 0xaf601a, category: 'equip', tier: 3, line: 'dual' },
            EQ_RAPIER:        { key: 'eq_rapier',        name: '레이피어',       short: '레', color: 0x935116, category: 'equip', tier: 3, line: 'rapier' },
            EQ_RUNE_STAFF:    { key: 'eq_rune_staff',    name: '마법석 지팡이', short: '봉', color: 0x1a5276, category: 'equip', tier: 3, line: 'staff' },
            EQ_STAR_WAND:     { key: 'eq_star_wand',     name: '별빛 완드',      short: '완', color: 0x1a5490, category: 'equip', tier: 3, line: 'wand' },
            EQ_RUNE_TOME:     { key: 'eq_rune_tome',     name: '룬 마도서',      short: '책', color: 0x512e5f, category: 'equip', tier: 3, line: 'tome' },
            EQ_SUMMON_ORB:    { key: 'eq_summon_orb',    name: '소환 수정구',    short: '구', color: 0x4a235a, category: 'equip', tier: 3, line: 'orb' },
            EQ_BISHOP_CROSS:  { key: 'eq_bishop_cross',  name: '주교의 십자가',  short: '십', color: 0xb9770e, category: 'equip', tier: 3, line: 'cross' },
            EQ_HOLY_MACE:     { key: 'eq_holy_mace',     name: '성직 메이스',    short: '메', color: 0xa04000, category: 'equip', tier: 3, line: 'mace' },
            EQ_IRON_KNUCKLE:  { key: 'eq_iron_knuckle',  name: '쇠 너클',        short: '너', color: 0x9c640c, category: 'equip', tier: 3, line: 'knuckle' },
            EQ_SILVER_HALBERD:{ key: 'eq_silver_halberd',name: '실버 할버드',    short: '할', color: 0x7d6608, category: 'equip', tier: 3, line: 'halberd' },
            EQ_SILVER_DAGGER: { key: 'eq_silver_dagger', name: '실버 단검',      short: '단', color: 0x5b2c6f, category: 'equip', tier: 3, line: 'dagger' },
            EQ_TWIN_SWORD:    { key: 'eq_twin_sword',    name: '쌍지검',         short: '쌍', color: 0x4a235a, category: 'equip', tier: 3, line: 'twin' },
            EQ_DUAL_AXE:      { key: 'eq_dual_axe',      name: '듀얼 액스',      short: '도', color: 0x6c3483, category: 'equip', tier: 3, line: 'axe' },
            EQ_POISON_SPIKE:  { key: 'eq_poison_spike',  name: '독묻은 송곳',    short: '독', color: 0x4a235a, category: 'equip', tier: 3, line: 'poison' },

            // ─── 장비 4차 (20종) — 3차 단일 진화 ───
            EQ_CLAYMORE:        { key: 'eq_claymore',        name: '클레이모어',         short: '검', color: 0x154360, category: 'equip', tier: 4, line: 'sword' },
            EQ_TOWER_SHIELD:    { key: 'eq_tower_shield',    name: '타워실드',           short: '방', color: 0x0e3550, category: 'equip', tier: 4, line: 'shield' },
            EQ_GLAIVE:          { key: 'eq_glaive',          name: '글레이브',           short: '창', color: 0x6e1812, category: 'equip', tier: 4, line: 'spear' },
            EQ_CAVALIER_LANCE:  { key: 'eq_cavalier_lance',  name: '카발리어 랜스',      short: '랜', color: 0x4d1612, category: 'equip', tier: 4, line: 'lance' },
            EQ_AQUA_CROSSBOW:   { key: 'eq_aqua_crossbow',   name: '아쿠아 크로스보우',  short: '쇠', color: 0x0e6655, category: 'equip', tier: 4, line: 'bow' },
            EQ_GREAT_BOW:       { key: 'eq_great_bow',       name: '대궁',               short: '대', color: 0x0a5347, category: 'equip', tier: 4, line: 'great_bow' },
            EQ_BEAST_DUAL:      { key: 'eq_beast_dual',      name: '비스트 듀얼대거',    short: '쌍', color: 0x935116, category: 'equip', tier: 4, line: 'dual' },
            EQ_SILVER_RAPIER:   { key: 'eq_silver_rapier',   name: '실버 레이피어',      short: '레', color: 0x6e3a0d, category: 'equip', tier: 4, line: 'rapier' },
            EQ_GRAND_STAFF:     { key: 'eq_grand_staff',     name: '대마법 지팡이',      short: '봉', color: 0x16456c, category: 'equip', tier: 4, line: 'staff' },
            EQ_TIME_WAND:       { key: 'eq_time_wand',       name: '시간의 완드',        short: '완', color: 0x12446e, category: 'equip', tier: 4, line: 'wand' },
            EQ_ABYSS_TOME:      { key: 'eq_abyss_tome',      name: '심연의 마도서',      short: '책', color: 0x39184a, category: 'equip', tier: 4, line: 'tome' },
            EQ_RADIANCE_ORB:    { key: 'eq_radiance_orb',    name: '광휘 수정구',        short: '구', color: 0x2a1239, category: 'equip', tier: 4, line: 'orb' },
            EQ_CATHEDRAL_CROSS: { key: 'eq_cathedral_cross', name: '대성당의 십자가',    short: '십', color: 0x9c640c, category: 'equip', tier: 4, line: 'cross' },
            EQ_HEAVEN_MACE:     { key: 'eq_heaven_mace',     name: '천상의 메이스',      short: '메', color: 0x7d3500, category: 'equip', tier: 4, line: 'mace' },
            EQ_STEEL_KNUCKLE:   { key: 'eq_steel_knuckle',   name: '강철 너클',          short: '너', color: 0x7d6608, category: 'equip', tier: 4, line: 'knuckle' },
            EQ_JUSTICE_HALBERD: { key: 'eq_justice_halberd', name: '저스티스 할버드',    short: '할', color: 0x5b4a06, category: 'equip', tier: 4, line: 'halberd' },
            EQ_PHANTOM_DAGGER:  { key: 'eq_phantom_dagger',  name: '팬텀 단검',          short: '단', color: 0x4a235a, category: 'equip', tier: 4, line: 'dagger' },
            EQ_KNIGHT_TWIN:     { key: 'eq_knight_twin',     name: '나이트 쌍지검',      short: '쌍', color: 0x39184a, category: 'equip', tier: 4, line: 'twin' },
            EQ_RAGE_HAND_AXE:   { key: 'eq_rage_hand_axe',   name: '광폭 핸드엑스',      short: '도', color: 0x5b2c6f, category: 'equip', tier: 4, line: 'axe' },
            EQ_VIPER_SPIKE:     { key: 'eq_viper_spike',     name: '바이퍼 송곳',        short: '독', color: 0x39184a, category: 'equip', tier: 4, line: 'poison' },

            // ─── 장비 5차 (20종) — 4차 단일 진화 (최종) ───
            EQ_DAWN_SWORD:        { key: 'eq_dawn_sword',        name: '여명검',           short: '검', color: 0x0e3550, category: 'equip', tier: 5, line: 'sword' },
            EQ_AEGIS_SHIELD:      { key: 'eq_aegis_shield',      name: '아이기스 실드',    short: '방', color: 0x0a2c44, category: 'equip', tier: 5, line: 'shield' },
            EQ_BELTRIM_SPEAR:     { key: 'eq_beltrim_spear',     name: '벨트림 창',        short: '창', color: 0x4a0e0a, category: 'equip', tier: 5, line: 'spear' },
            EQ_TEMPEST_LANCE:     { key: 'eq_tempest_lance',     name: '템페스트 랜스',    short: '랜', color: 0x3a0908, category: 'equip', tier: 5, line: 'lance' },
            EQ_DEADEYE_BOW:       { key: 'eq_deadeye_bow',       name: '데드아이 보우',    short: '쇠', color: 0x0a5347, category: 'equip', tier: 5, line: 'bow' },
            EQ_WIND_BOW:          { key: 'eq_wind_bow',          name: '윈드 보우',        short: '대', color: 0x07423a, category: 'equip', tier: 5, line: 'great_bow' },
            EQ_SHADOW_DUAL:       { key: 'eq_shadow_dual',       name: '섀도우 듀얼대거',  short: '쌍', color: 0x6e3a0d, category: 'equip', tier: 5, line: 'dual' },
            EQ_MOONLIGHT_RAPIER:  { key: 'eq_moonlight_rapier',  name: '문라이트 레이피어', short: '레', color: 0x521f00, category: 'equip', tier: 5, line: 'rapier' },
            EQ_ETHER_STAFF:       { key: 'eq_ether_staff',       name: '에테르 지팡이',    short: '봉', color: 0x0a2c44, category: 'equip', tier: 5, line: 'staff' },
            EQ_CHRONOS_WAND:      { key: 'eq_chronos_wand',      name: '크로노스 완드',    short: '완', color: 0x051b2c, category: 'equip', tier: 5, line: 'wand' },
            EQ_DIABLO_TOME:       { key: 'eq_diablo_tome',       name: '디아블로 마도서',  short: '책', color: 0x2a1239, category: 'equip', tier: 5, line: 'tome' },
            EQ_ARCANIC_ORB:       { key: 'eq_arcanic_orb',       name: '아카닉 수정구',    short: '구', color: 0x1f0e2c, category: 'equip', tier: 5, line: 'orb' },
            EQ_ORACLE_CROSS:      { key: 'eq_oracle_cross',      name: '신탁의 십자가',    short: '십', color: 0x7d6608, category: 'equip', tier: 5, line: 'cross' },
            EQ_JUDGE_MORNINGSTAR: { key: 'eq_judge_morningstar', name: '심판의 모닝스타',  short: '메', color: 0x521f00, category: 'equip', tier: 5, line: 'mace' },
            EQ_HEAVEN_KNUCKLE:    { key: 'eq_heaven_knuckle',    name: '천상 너클',        short: '너', color: 0x5b4a06, category: 'equip', tier: 5, line: 'knuckle' },
            EQ_HOLY_HALBERD:      { key: 'eq_holy_halberd',      name: '신성 할버드',      short: '할', color: 0x423605, category: 'equip', tier: 5, line: 'halberd' },
            EQ_ABYSS_DAGGER:      { key: 'eq_abyss_dagger',      name: '심연 단검',        short: '단', color: 0x39184a, category: 'equip', tier: 5, line: 'dagger' },
            EQ_SHADOW_TWIN:       { key: 'eq_shadow_twin',       name: '섀도우 쌍지검',    short: '쌍', color: 0x2a1239, category: 'equip', tier: 5, line: 'twin' },
            EQ_BLOOD_HAND_AXE:    { key: 'eq_blood_hand_axe',    name: '피의 핸드엑스',    short: '도', color: 0x4a235a, category: 'equip', tier: 5, line: 'axe' },
            EQ_PLAGUE_SPIKE:      { key: 'eq_plague_spike',      name: '플레이그 송곳',    short: '독', color: 0x2a1239, category: 'equip', tier: 5, line: 'poison' },
            
            // ─── 물약 ───
            POTION_HP: { key: 'potion_hp', name: 'HP물약', short: 'H', color: 0x2ecc71, category: 'potion', tier: 1, line: 'hp' },
            POTION_MP: { key: 'potion_mp', name: 'MP물약', short: 'M', color: 0x9b59b6, category: 'potion', tier: 1, line: 'mp' },

            // ─── 스페이서 ───
            SPAWNER_GUILD: {
                key: 'spawner_guild', name: '길드', short: '길', color: 0xd4a574,
                category: 'spawner', isSpawner: true,
                produces: 'hero_adventurer',
                icon: '⚔',
            },
            SPAWNER_HERB_SHOP: {
                key: 'spawner_herb_shop', name: '약초상', short: '약', color: 0x52b788,
                category: 'spawner', isSpawner: true,
                produces: ['potion_hp', 'potion_mp'],
                icon: '⚗',
            },
            SPAWNER_BLACKSMITH: {
                key: 'spawner_blacksmith', name: '대장간', short: '대', color: 0xb19cd9,
                category: 'spawner', isSpawner: true,
                produces: ['eq_short_sword', 'eq_short_bow', 'eq_wood_stick', 'eq_holy_water', 'eq_knife'],
                icon: '⚒',
            },
        },
        MAX_GRADE: 3,       // 현재 생성 가능한 최대 등급
        INIT_GRADE: 1,      // 초기 생성 등급
        BORDER_RADIUS: 6,   // 블럭 둥근 모서리
        MARGIN: 3,          // 셀 내부 여백

        // ★ 신규 — 스페이서 초기 배치 위치
        INITIAL_SPAWNERS: [
            { typeKey: 'spawner_guild',      col: 1, row: 3 },
            { typeKey: 'spawner_herb_shop',  col: 3, row: 3 },
            { typeKey: 'spawner_blacksmith', col: 5, row: 3 },
        ],
    },

    // 전투 설정
    COMBAT: {
        PLAYER_HP: 100,
        // 블럭 효과 = 등급 × 배율
        HERO_DMG_MULT: 10,      // 영웅 데미지 배율
        EQUIP_DMG_MULT: 7,      // 장비 데미지 배율
        HP_HEAL_MULT: 8,        // HP물약 회복 배율
        MP_HEAL_MULT: 5,        // MP물약 임시 회복 배율 (Phase 2에서 스킬게이지로 전환)
    },

    // 리트라이 설정
    RETRY: {
        AD_DURATION_MS: 3000,       // 광고 시뮬레이션 시간 (실제 광고로 교체 예정)
        MAX_AD_PER_STAGE: 1,        // 스테이지당 광고 리트라이 횟수
    },

    // 튜토리얼 (스테이지별 안내 문구)
    TUTORIAL: {       
    },

    // Phase 3-11-B: 진화 트리
    EVOLUTION: {
        // 영웅 진화: 영웅 Lv.3 + 장비 Lv.3 = 다음 영웅 Lv.1
        // 형식: { 영웅키: { 장비키: 결과영웅키 } }
        HERO: {
            // 0차 → 1차
            hero_adventurer: {
                eq_short_sword: 'hero_warrior',
                eq_short_bow:   'hero_archer',
                eq_wood_stick:  'hero_mage',
                eq_holy_water:  'hero_cleric',
                eq_knife:       'hero_thief',
            },
            // 1차 → 2차 (각 1차 영웅이 2차 장비 2종 받아 분기)
            hero_warrior: {
                eq_long_sword: 'hero_swordsman',
                eq_spear:      'hero_lancer_t1',
            },
            hero_archer: {
                eq_long_bow:    'hero_sniper',
                eq_dual_dagger: 'hero_dualist',
            },
            hero_mage: {
                eq_magic_staff: 'hero_archmage',
                eq_orb:         'hero_summoner',
            },
            hero_cleric: {
                eq_cross: 'hero_bishop',
                eq_flail: 'hero_monk',
            },
            hero_thief: {
                eq_dagger:   'hero_assassin',
                eq_hand_axe: 'hero_raider',
            },
            // 2차 → 3차는 B-2-B에서 추가
            // 2차 → 3차 (각 2차 영웅이 3차 장비 2종 받아 분기)
            hero_swordsman: {
                eq_broad_sword: 'hero_knight',
                eq_kite_shield: 'hero_shielder',
            },
            hero_lancer_t1: {
                eq_javelin: 'hero_dragoon',
                eq_lance:   'hero_lancer_t3',
            },
            hero_sniper: {
                eq_crossbow:  'hero_marksman',
                eq_elven_bow: 'hero_ranger',
            },
            hero_dualist: {
                eq_silver_dual: 'hero_tracker',
                eq_rapier:      'hero_swift_blade',
            },
            hero_archmage: {
                eq_rune_staff: 'hero_elementalist',
                eq_star_wand:  'hero_spellcaster',
            },
            hero_summoner: {
                eq_rune_tome:  'hero_necromancer',
                eq_summon_orb: 'hero_summoner_t3',
            },
            hero_bishop: {
                eq_bishop_cross: 'hero_priest',
                eq_holy_mace:    'hero_paladin',
            },
            hero_monk: {
                eq_iron_knuckle:   'hero_fist_master',
                eq_silver_halberd: 'hero_temple_guard',
            },
            hero_assassin: {
                eq_silver_dagger: 'hero_shadow_assassin',
                eq_twin_sword:    'hero_shadow_tracker',
            },
            hero_raider: {
                eq_dual_axe:     'hero_berserker',
                eq_poison_spike: 'hero_viper',
            },

            // 3차 → 4차 (단일 진화)
            hero_knight:          { eq_claymore:           'hero_grand_knight' },
            hero_shielder:        { eq_tower_shield:       'hero_royal_guard' },
            hero_dragoon:         { eq_glaive:             'hero_royal_dragoon' },
            hero_lancer_t3:       { eq_cavalier_lance:     'hero_royal_lancer' },
            hero_marksman:        { eq_aqua_crossbow:      'hero_eagle_eye' },
            hero_ranger:          { eq_great_bow:          'hero_wind_guardian' },
            hero_tracker:         { eq_beast_dual:         'hero_beast_tracker' },
            hero_swift_blade:     { eq_silver_rapier:      'hero_blade_dancer' },
            hero_elementalist:    { eq_grand_staff:        'hero_grand_elementalist' },
            hero_spellcaster:     { eq_time_wand:          'hero_sky_caster' },
            hero_necromancer:     { eq_abyss_tome:         'hero_abyss_caster' },
            hero_summoner_t3:     { eq_radiance_orb:       'hero_summon_master' },
            hero_priest:          { eq_cathedral_cross:    'hero_high_priest' },
            hero_paladin:         { eq_heaven_mace:        'hero_holy_knight' },
            hero_fist_master:     { eq_steel_knuckle:      'hero_grand_fist' },
            hero_temple_guard:    { eq_justice_halberd:    'hero_inquisitor' },
            hero_shadow_assassin: { eq_phantom_dagger:     'hero_phantom_killer' },
            hero_shadow_tracker:  { eq_knight_twin:        'hero_night_tracker' },
            hero_berserker:       { eq_rage_hand_axe:      'hero_raging_berserker' },
            hero_viper:           { eq_viper_spike:        'hero_viper_lord' },

            // 4차 → 5차 (단일 진화)
            hero_grand_knight:        { eq_dawn_sword:           'hero_sword_lord' },
            hero_royal_guard:         { eq_aegis_shield:         'hero_king_shield' },
            hero_royal_dragoon:       { eq_beltrim_spear:        'hero_holy_dragoon' },
            hero_royal_lancer:        { eq_tempest_lance:        'hero_tempest_lancer' },
            hero_eagle_eye:           { eq_deadeye_bow:          'hero_dead_eye' },
            hero_wind_guardian:       { eq_wind_bow:             'hero_wind_pathfinder' },
            hero_beast_tracker:       { eq_shadow_dual:          'hero_shadow_hunter' },
            hero_blade_dancer:        { eq_moonlight_rapier:     'hero_moonlight_dancer' },
            hero_grand_elementalist:  { eq_ether_staff:          'hero_elemental_lord' },
            hero_sky_caster:          { eq_chronos_wand:         'hero_time_caster' },
            hero_abyss_caster:        { eq_diablo_tome:          'hero_diablo' },
            hero_summon_master:       { eq_arcanic_orb:          'hero_arcana_lord' },
            hero_high_priest:         { eq_oracle_cross:         'hero_oracle' },
            hero_holy_knight:         { eq_judge_morningstar:    'hero_heaven_knight' },
            hero_grand_fist:          { eq_heaven_knuckle:       'hero_heaven_fist' },
            hero_inquisitor:          { eq_holy_halberd:         'hero_divine_judge' },
            hero_phantom_killer:      { eq_abyss_dagger:         'hero_abyss_phantom' },
            hero_night_tracker:       { eq_shadow_twin:          'hero_night_lord' },
            hero_raging_berserker:    { eq_blood_hand_axe:       'hero_blood_berserker' },
            hero_viper_lord:          { eq_plague_spike:         'hero_doom_viper' },
        },

        // 장비 진화: 장비 Lv.3 ×2 = 다음 등급 Lv.1
        // 형식: { 장비키: { branches: [선택지1, 선택지2] } 또는 { result: 결과키 } }
        EQUIP: {
            // 1차 → 2차 (분기)
            eq_short_sword: { branches: ['eq_long_sword', 'eq_spear'] },
            eq_short_bow:   { branches: ['eq_long_bow', 'eq_dual_dagger'] },
            eq_wood_stick:  { branches: ['eq_magic_staff', 'eq_orb'] },
            eq_holy_water:  { branches: ['eq_cross', 'eq_flail'] },
            eq_knife:       { branches: ['eq_dagger', 'eq_hand_axe'] },

            // 2차 → 3차 (분기)
            eq_long_sword:  { branches: ['eq_broad_sword', 'eq_kite_shield'] },
            eq_spear:       { branches: ['eq_javelin', 'eq_lance'] },
            eq_long_bow:    { branches: ['eq_crossbow', 'eq_elven_bow'] },
            eq_dual_dagger: { branches: ['eq_silver_dual', 'eq_rapier'] },
            eq_magic_staff: { branches: ['eq_rune_staff', 'eq_star_wand'] },
            eq_orb:         { branches: ['eq_rune_tome', 'eq_summon_orb'] },
            eq_cross:       { branches: ['eq_bishop_cross', 'eq_holy_mace'] },
            eq_flail:       { branches: ['eq_iron_knuckle', 'eq_silver_halberd'] },
            eq_dagger:      { branches: ['eq_silver_dagger', 'eq_twin_sword'] },
            eq_hand_axe:    { branches: ['eq_dual_axe', 'eq_poison_spike'] },

            // 3차 → 4차는 B-2-B에서 추가 (단일 진화)
            // 3차 → 4차 (단일 진화)
            eq_broad_sword:    { result: 'eq_claymore' },
            eq_kite_shield:    { result: 'eq_tower_shield' },
            eq_javelin:        { result: 'eq_glaive' },
            eq_lance:          { result: 'eq_cavalier_lance' },
            eq_crossbow:       { result: 'eq_aqua_crossbow' },
            eq_elven_bow:      { result: 'eq_great_bow' },
            eq_silver_dual:    { result: 'eq_beast_dual' },
            eq_rapier:         { result: 'eq_silver_rapier' },
            eq_rune_staff:     { result: 'eq_grand_staff' },
            eq_star_wand:      { result: 'eq_time_wand' },
            eq_rune_tome:      { result: 'eq_abyss_tome' },
            eq_summon_orb:     { result: 'eq_radiance_orb' },
            eq_bishop_cross:   { result: 'eq_cathedral_cross' },
            eq_holy_mace:      { result: 'eq_heaven_mace' },
            eq_iron_knuckle:   { result: 'eq_steel_knuckle' },
            eq_silver_halberd: { result: 'eq_justice_halberd' },
            eq_silver_dagger:  { result: 'eq_phantom_dagger' },
            eq_twin_sword:     { result: 'eq_knight_twin' },
            eq_dual_axe:       { result: 'eq_rage_hand_axe' },
            eq_poison_spike:   { result: 'eq_viper_spike' },

            // 4차 → 5차 (단일 진화)
            eq_claymore:        { result: 'eq_dawn_sword' },
            eq_tower_shield:    { result: 'eq_aegis_shield' },
            eq_glaive:          { result: 'eq_beltrim_spear' },
            eq_cavalier_lance:  { result: 'eq_tempest_lance' },
            eq_aqua_crossbow:   { result: 'eq_deadeye_bow' },
            eq_great_bow:       { result: 'eq_wind_bow' },
            eq_beast_dual:      { result: 'eq_shadow_dual' },
            eq_silver_rapier:   { result: 'eq_moonlight_rapier' },
            eq_grand_staff:     { result: 'eq_ether_staff' },
            eq_time_wand:       { result: 'eq_chronos_wand' },
            eq_abyss_tome:      { result: 'eq_diablo_tome' },
            eq_radiance_orb:    { result: 'eq_arcanic_orb' },
            eq_cathedral_cross: { result: 'eq_oracle_cross' },
            eq_heaven_mace:     { result: 'eq_judge_morningstar' },
            eq_steel_knuckle:   { result: 'eq_heaven_knuckle' },
            eq_justice_halberd: { result: 'eq_holy_halberd' },
            eq_phantom_dagger:  { result: 'eq_abyss_dagger' },
            eq_knight_twin:     { result: 'eq_shadow_twin' },
            eq_rage_hand_axe:   { result: 'eq_blood_hand_axe' },
            eq_viper_spike:     { result: 'eq_plague_spike' },
        },
    },

    // Phase 3-11-B-3: 영웅별 발동 효과
    // 키 = 영웅의 blockType.key
    // effects = 효과 배열 (한 영웅이 여러 효과 동시 보유 가능)
    //
    // 효과 타입:
    // - damage_single:    { type, mult }                        단일 데미지 = grade × baseUnit × mult
    // - damage_multi_hit: { type, mult, hits }                  같은 적에게 hits회 공격
    // - damage_aoe:       { type, mult }                        (단일 적 환경에선 동일)
    // - crit:             { type, chance, critMult }            확률적 치명타 (damage_single 수정자)
    // - dot:              { type, mult, turns }                 적에게 turns턴 지속 데미지
    // - debuff:           { type, kind, value, turns }          kind: 'damage_taken' | 'silence'
    // - shield:           { type, amount }                      플레이어 실드 부여 (덮어쓰기)
    // - heal:             { type, amount, target }              target: 'self' | 'all'
    // - summon:           { type, blockKey, count }             보드에 블럭 소환
    HERO_EFFECTS: {
        // ─── 0차 ───
        hero_adventurer: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.0 }],
        },

        // ─── 1차 (5종) ───
        hero_warrior: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.3 }],
        },
        hero_archer: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.0 }],
            // 회피무시는 적 시스템 도입 후 (Phase 3-11-C). 지금은 동일 데미지.
        },
        hero_mage: {
            baseUnit: 10,
            effects: [{ type: 'damage_aoe', mult: 0.8 }],
            // AOE는 적 다수 도입 후 의미. 지금은 단일과 동일.
        },
        hero_cleric: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 0.9 },
                { type: 'heal', amount: 5, target: 'self' },
            ],
        },
        hero_thief: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 1.0 },
                { type: 'crit', chance: 0.15, critMult: 2.5 },
            ],
        },

        // ─── 2차 (10종) ───
        hero_swordsman: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.5 }],
        },
        hero_lancer_t1: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.4 }],
            // 다음 영웅 +10% 버프는 후속 패치
        },
        hero_sniper: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.3 }],
        },
        hero_dualist: {
            baseUnit: 10,
            effects: [{ type: 'damage_multi_hit', mult: 1.2, hits: 2 }],
        },
        hero_archmage: {
            baseUnit: 10,
            effects: [{ type: 'damage_aoe', mult: 1.0 }],
        },
        hero_summoner: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.5 }],
        },
        hero_bishop: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 1.0 },
                { type: 'heal', amount: 5, target: 'self' },
            ],
            // 'all' 회복은 다중 영웅 시스템 도입 후
        },
        hero_monk: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.4 }],
        },
        hero_assassin: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.7 }],
        },
        hero_raider: {
            baseUnit: 10,
            effects: [{ type: 'damage_multi_hit', mult: 1.0, hits: 2 }],
        },

        // ─── 3차 (20종) ───

        // 워리어 계열
        hero_knight: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 1.5 },
                { type: 'crit', chance: 0.30, critMult: 2.5 },
            ],
        },
        hero_shielder: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 0.8 },
                { type: 'shield', amount: 30 },
            ],
        },
        hero_dragoon: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.6 }],
            // 자체 버프(다음 턴 +20%)는 후속 패치
        },
        hero_lancer_t3: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.5 }],
            // 관통(방어 무시)은 적 방어 시스템 도입 후 (Phase 3-11-C)
        },

        // 보우맨 계열
        hero_marksman: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.5 }],
            // 약점 노출 디버프는 디버프 시스템 후
        },
        hero_ranger: {
            baseUnit: 10,
            effects: [
                { type: 'damage_aoe', mult: 1.0 },
                { type: 'crit', chance: 0.25, critMult: 2.0 },
            ],
        },
        hero_tracker: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.3 }],
            // 50% 행동봉인 디버프는 디버프 시스템 후
        },
        hero_swift_blade: {
            baseUnit: 10,
            effects: [{ type: 'damage_multi_hit', mult: 1.4, hits: 2 }],
        },

        // 메이지 계열
        hero_elementalist: {
            baseUnit: 10,
            effects: [{ type: 'damage_aoe', mult: 1.3 }],
        },
        hero_spellcaster: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 1.0 },
                { type: 'dot', mult: 0.3, turns: 3 },
            ],
        },
        hero_necromancer: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.8 }],
            // 받는 데미지 +20% 디버프는 디버프 시스템 후
        },
        hero_summoner_t3: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.0 }],
            // 정령 소환은 Phase 3-11.5에서 본격 구현
        },

        // 클레릭 계열
        hero_priest: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 1.3 },
                { type: 'heal', amount: 10, target: 'self' },
            ],
            // 'all' 타겟은 다중 영웅 시스템 도입 후
        },
        hero_paladin: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 1.5 },
                { type: 'heal', amount: 5, target: 'self' },
            ],
        },
        hero_fist_master: {
            baseUnit: 10,
            effects: [{ type: 'damage_multi_hit', mult: 1.6, hits: 2 }],
        },
        hero_temple_guard: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 1.7 },
                { type: 'shield', amount: 20 },
            ],
            // 받는데미지 -30% 자체버프는 후속 패치
        },

        // 도적 계열
        hero_shadow_assassin: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 2.5 }],   // 확정 치명타 = 단순 강한 단일 데미지로 표현
        },
        hero_shadow_tracker: {
            baseUnit: 10,
            effects: [{ type: 'damage_single', mult: 1.5 }],
            // 처치시 다음 +20% 버프는 후속 패치
        },
        hero_berserker: {
            baseUnit: 10,
            effects: [{ type: 'damage_multi_hit', mult: 1.4, hits: 3 }],
        },
        hero_viper: {
            baseUnit: 10,
            effects: [
                { type: 'damage_single', mult: 1.0 },
                { type: 'dot', mult: 0.4, turns: 5 },
            ],
        },
    },

    // ─── 4차 (20종) — 3차 효과 강화 ───
    // 워리어 계열
    hero_grand_knight: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 1.8 },
            { type: 'crit', chance: 0.50, critMult: 2.5 },
        ],
    },
    hero_royal_guard: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 0.9 },
            { type: 'shield', amount: 60 },
        ],
    },
    hero_royal_dragoon: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 1.9 }],
    },
    hero_royal_lancer: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 1.8 }],
    },

    // 보우맨 계열
    hero_eagle_eye: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 1.8 }],
    },
    hero_wind_guardian: {
        baseUnit: 10,
        effects: [
            { type: 'damage_aoe', mult: 1.2 },
            { type: 'crit', chance: 0.40, critMult: 2.5 },
        ],
    },
    hero_beast_tracker: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 1.6 }],
    },
    hero_blade_dancer: {
        baseUnit: 10,
        effects: [{ type: 'damage_multi_hit', mult: 1.4, hits: 3 }],
    },

    // 메이지 계열
    hero_grand_elementalist: {
        baseUnit: 10,
        effects: [{ type: 'damage_aoe', mult: 1.6 }],
    },
    hero_sky_caster: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 1.3 },
            { type: 'dot', mult: 0.5, turns: 3 },
        ],
    },
    hero_abyss_caster: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 2.1 }],
    },
    hero_summon_master: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 1.3 }],
        // 정령 2개 소환은 Phase 3-11.5
    },

    // 클레릭 계열
    hero_high_priest: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 1.6 },
            { type: 'heal', amount: 20, target: 'self' },
        ],
    },
    hero_holy_knight: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 1.8 },
            { type: 'heal', amount: 10, target: 'self' },
        ],
    },
    hero_grand_fist: {
        baseUnit: 10,
        effects: [{ type: 'damage_multi_hit', mult: 1.7, hits: 3 }],
    },
    hero_inquisitor: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 2.0 },
            { type: 'shield', amount: 40 },
        ],
    },

    // 도적 계열
    hero_phantom_killer: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 2.8 }],
    },
    hero_night_tracker: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 1.8 }],
    },
    hero_raging_berserker: {
        baseUnit: 10,
        effects: [{ type: 'damage_multi_hit', mult: 1.4, hits: 4 }],
    },
    hero_viper_lord: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 1.2 },
            { type: 'dot', mult: 0.6, turns: 5 },
        ],
    },

    // ─── 5차 (20종) — 최종 ───

    // 워리어 계열
    hero_sword_lord: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 2.1 },
            { type: 'crit', chance: 0.70, critMult: 3.0 },
        ],
    },
    hero_king_shield: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 1.0 },
            { type: 'shield', amount: 100 },
        ],
    },
    hero_holy_dragoon: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 2.2 }],
    },
    hero_tempest_lancer: {
        baseUnit: 10,
        effects: [{ type: 'damage_aoe', mult: 1.5 }],
    },

    // 보우맨 계열
    hero_dead_eye: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 2.2 }],
    },
    hero_wind_pathfinder: {
        baseUnit: 10,
        effects: [
            { type: 'damage_aoe', mult: 1.4 },
            { type: 'crit', chance: 0.50, critMult: 3.0 },
        ],
    },
    hero_shadow_hunter: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 1.8 }],
    },
    hero_moonlight_dancer: {
        baseUnit: 10,
        effects: [{ type: 'damage_multi_hit', mult: 1.5, hits: 4 }],
    },

    // 메이지 계열
    hero_elemental_lord: {
        baseUnit: 10,
        effects: [{ type: 'damage_aoe', mult: 1.9 }],
    },
    hero_time_caster: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 1.5 },
            { type: 'dot', mult: 0.6, turns: 4 },
        ],
    },
    hero_diablo: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 2.4 }],
    },
    hero_arcana_lord: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 1.5 }],
        // 정령 3개 소환은 Phase 3-11.5
    },

    // 클레릭 계열
    hero_oracle: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 1.9 },
            { type: 'heal', amount: 30, target: 'self' },
        ],
    },
    hero_heaven_knight: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 2.1 },
            { type: 'heal', amount: 20, target: 'self' },
        ],
    },
    hero_heaven_fist: {
        baseUnit: 10,
        effects: [{ type: 'damage_multi_hit', mult: 1.8, hits: 4 }],
    },
    hero_divine_judge: {
        baseUnit: 10,
        effects: [
            { type: 'damage_single', mult: 2.3 },
            { type: 'shield', amount: 80 },
        ],
    },

    // 도적 계열
    hero_abyss_phantom: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 3.2 }],
    },
    hero_night_lord: {
        baseUnit: 10,
        effects: [{ type: 'damage_single', mult: 2.0 }],
    },
    hero_blood_berserker: {
        baseUnit: 10,
        effects: [{ type: 'damage_multi_hit', mult: 1.5, hits: 5 }],
    },
    hero_doom_viper: {
        baseUnit: 10,
        effects: [
            { type: 'damage_aoe', mult: 1.0 },
            { type: 'dot', mult: 0.7, turns: 5 },
        ],
    },

    // 스테이지 데이터
    STAGES: [
        { stage: 1, enemy: { name: '슬라임',     hp: 80,  attack: 4  } },
        { stage: 2, enemy: { name: '고블린',     hp: 120, attack: 6  } },
        { stage: 3, enemy: { name: '스켈레톤',   hp: 160, attack: 8  } },
        { stage: 4, enemy: { name: '오크 전사',  hp: 220, attack: 11 } },
        { stage: 5, enemy: { name: '다크 나이트', hp: 300, attack: 15 } },
    ],

    // Phase 3-11-A: 던전 룰
    DUNGEON: {
        BASE_ACTIONS_PER_TURN: 3,
    },

    // ─── Phase 3-3: 로비 마을 ─────────────────
    
    // 로비 건물 목록 (지침서 3.4 기준 18종)
    // Phase 3-3에서는 시각 배치만. 3-5부터 실제 기능 연결.
    LOBBY_BUILDINGS: [
        // 생산
        { id: 'farm',       name: '농장',       category: 'production',     unlockLevel: 1,  icon: '🌾' },
        { id: 'lumberyard', name: '벌목장',     category: 'production',     unlockLevel: 3,  icon: '🪓' },
        { id: 'quarry',     name: '채석장',     category: 'production',     unlockLevel: 5,  icon: '🪨' },
        { id: 'market',     name: '시장',       category: 'production',     unlockLevel: 5,  icon: '🏪' },
        { id: 'mine',       name: '광산',       category: 'production',     unlockLevel: 10, icon: '⛏️' },
        { id: 'shrine',     name: '여신상',     category: 'production',     unlockLevel: 15, icon: '💎' },
        // 패시브 기본
        { id: 'training',   name: '훈련소',     category: 'passive_basic',  unlockLevel: 10, icon: '🥊' },
        { id: 'canteen',    name: '식당',       category: 'passive_basic',  unlockLevel: 10, icon: '🍖' },
        { id: 'smithy',     name: '대장간',     category: 'passive_basic',  unlockLevel: 15, icon: '🔨' },
        { id: 'alchemy',    name: '연금술 공방', category: 'passive_basic',  unlockLevel: 15, icon: '⚗️' },
        // 패시브 직업
        { id: 'barracks',   name: '기사단 병영', category: 'passive_job',    unlockLevel: 20, icon: '🛡️' },
        { id: 'archery',    name: '사격장',     category: 'passive_job',    unlockLevel: 20, icon: '🎯' },
        { id: 'magehall',   name: '마법전당',   category: 'passive_job',    unlockLevel: 20, icon: '🔮' },
        { id: 'cathedral',  name: '성당',       category: 'passive_job',    unlockLevel: 20, icon: '⛪' },
        { id: 'tavern',     name: '선술집',     category: 'passive_job',    unlockLevel: 20, icon: '🍺' },
        // 패시브 시스템
        { id: 'warehouse',  name: '창고',       category: 'passive_system', unlockLevel: 10, icon: '📦' },
        { id: 'command',    name: '지휘소',     category: 'passive_system', unlockLevel: 20, icon: '🚩' },
        { id: 'lab',        name: '전술 연구소', category: 'passive_system', unlockLevel: 25, icon: '📜' },
    ],

    // 로비 메뉴 버튼 6종 (Phase 3 각 단계에서 연결)
    LOBBY_MENUS: [
        { id: 'summon',    label: '소환', icon: '🎲', phase: '3-12' },
        { id: 'warehouse', label: '창고', icon: '📦', phase: '3-10' },
        { id: 'book',      label: '도감', icon: '📚', phase: '3-16' },
        { id: 'quest',     label: '의뢰', icon: '📜', phase: '3-15' },
        { id: 'dispatch',  label: '파견', icon: '🚶', phase: '3-17' },
        { id: 'settings',  label: '설정', icon: '⚙️', phase: '3-21' },
    ],

    // 로비 UI 상수
    LOBBY: {
        TAP_THRESHOLD_PX: 8,    // 드래그/탭 구분 임계값
        TILE_SIZE: 72,          // 건물 타일 크기
        TILE_GAP: 16,
        CATEGORY_GAP: 36,       // 카테고리 간 추가 간격
    },

    // ─── Phase 3-3: 탭 내비게이션 ─────────────────

    // 하단 탭 정의 (순서: 영웅-마을-던전-창고-이벤트)
    TABS: [
        { id: 'hero',    label: '영웅',   icon: '👤',  pageName: '영웅' },
        { id: 'village', label: '마을',   icon: '🏘️', pageName: '마을' },
        { id: 'dungeon', label: '던전',   icon: '⚔️',  pageName: '로비' },
        { id: 'storage', label: '창고',   icon: '📦',  pageName: '창고' },
        { id: 'event',   label: '이벤트', icon: '🎁',  pageName: '이벤트' },
    ],

    // 초기 진입 탭 (던전 탭이 중앙이자 메인)
    DEFAULT_TAB_ID: 'dungeon',

    // 상단 HUD에 표시할 자원 3종 (나머지 3종은 상점 팝업에서 표시 예정)
    RESOURCE_HUD_KEYS: [
        { key: 'gold', icon: '💰' },
        { key: 'food', icon: '🍞' },
        { key: 'gem',  icon: '💎' },
    ],

    // HUD/TabBar 높이 상수
    LOBBY_LAYOUT: {
        HUD_HEIGHT: 56,
        TABBAR_HEIGHT: 64,
    },

    // ─── Phase 3-4: 던전 연결 ─────────────────

    // 던전 입장 비용 (식량)
    DUNGEON_COST: {
        FOOD_PER_ENTRY: 5,   // 던전 한 번 입장 시 차감 (챕터 확장 시 재설계 예정)
    },

    // 스테이지별 클리어 보상 (지침서 3.1)
    // Phase 3-4 조정: 식량은 보상에서 제외 (소모와 보상이 상쇄되어 피로도 무의미해지는 문제)
    // 식량은 Phase 3-5 이후 농장 건물 생산 + Phase 3 상점 구매로만 획득
    STAGE_REWARDS: {
        1: { gold: 20, wood: 10, stone: 0,  food: 0 },
        2: { gold: 30, wood: 15, stone: 5,  food: 0 },
        3: { gold: 45, wood: 20, stone: 10, food: 0 },
        4: { gold: 60, wood: 25, stone: 15, food: 0 },
        5: { gold: 80, wood: 30, stone: 20, food: 0 },
    },

    // 경험치 설정
    EXP_SETTINGS: {
        // 스테이지 클리어 경험치: stageNumber × MULT
        STAGE_CLEAR_MULT: 20,
        // 다음 레벨 필요 경험치: currentLevel × BASE
        LEVEL_UP_BASE: 100,
        // 최대 레벨 (임의 상한, 나중에 확장)
        MAX_LEVEL: 99,
    },

    // ─── Phase 3-5: 건물 스펙 ─────────────────

    // 건물 18종 스펙 (LOBBY_BUILDINGS의 id와 1:1 매칭)
    // 비용 공식: 다음레벨비용 = buildCost × (1 + costMult × (currentLevel - 1))
    // 계정 레벨 요구: unlockLevel + currentLevel × levelPerAccount
    //   (단, Lv.1 건설은 unlockLevel만 만족하면 됨)
    // ─── Phase 3-5/3-6: 건물 스펙 ─────────────────

    BUILDING_SPECS: {
        // ─ 생산 ─
        // ─ 생산 ─
        farm:       { maxLevel: 20, buildCost: { gold: 50,  wood: 20 },              costMult: 0.5, levelPerAccount: 2, effect: '식량 자동 생산 (시간 누적)',
                      production: { resource: 'food',  basePerHour: 10,  baseCap: 60  } },
        lumberyard: { maxLevel: 20, buildCost: { gold: 80,  wood: 30 },              costMult: 0.5, levelPerAccount: 2, effect: '목재 자동 생산 (시간 누적)',
                      production: { resource: 'wood',  basePerHour: 8,   baseCap: 48  } },
        quarry:     { maxLevel: 20, buildCost: { gold: 100, wood: 40 },              costMult: 0.5, levelPerAccount: 2, effect: '석재 자동 생산 (시간 누적)',
                      production: { resource: 'stone', basePerHour: 6,   baseCap: 36  } },
        market:     { maxLevel: 20, buildCost: { gold: 150, wood: 30, stone: 20 },   costMult: 0.5, levelPerAccount: 2, effect: '골드 자동 생산 (시간 누적)',
                      production: { resource: 'gold',  basePerHour: 20,  baseCap: 120 } },
        mine:       { maxLevel: 20, buildCost: { gold: 200, wood: 50, stone: 30 },   costMult: 0.5, levelPerAccount: 3, effect: '철 자동 생산 (시간 누적)',
                      production: { resource: 'iron',  basePerHour: 4,   baseCap: 24  } },
        shrine:     { maxLevel: 10, buildCost: { gold: 500, wood: 100, stone: 80, iron: 30 }, costMult: 0.8, levelPerAccount: 5, effect: '보석(유료 재화) 소량 자동 생산',
                      production: { resource: 'gem',   basePerHour: 0.2, baseCap: 2   } },

        // ─ 패시브 기본 ─
        training:   { maxLevel: 20, buildCost: { gold: 150, wood: 60, stone: 30 },   costMult: 0.5, levelPerAccount: 2, effect: '영웅 블럭 공격력 증가' },
        canteen:    { maxLevel: 20, buildCost: { gold: 150, wood: 60, stone: 30 },   costMult: 0.5, levelPerAccount: 2, effect: '플레이어 최대 HP 증가' },
        smithy:     { maxLevel: 20, buildCost: { gold: 250, wood: 80, stone: 50, iron: 20 },  costMult: 0.5, levelPerAccount: 2, effect: '장비 블럭 효과 증가' },
        alchemy:    { maxLevel: 20, buildCost: { gold: 250, wood: 80, stone: 50, iron: 20 },  costMult: 0.5, levelPerAccount: 2, effect: 'HP/MP 물약 효과 증가' },

        // ─ 패시브 직업 ─
        barracks:   { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '워리어 계열 영웅 강화' },
        archery:    { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '보우맨 계열 영웅 강화' },
        magehall:   { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '메이지 계열 영웅 강화' },
        cathedral:  { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '클레릭 계열 영웅 강화' },
        tavern:     { maxLevel: 20, buildCost: { gold: 400, wood: 100, stone: 80, iron: 40 }, costMult: 0.5, levelPerAccount: 2, effect: '도적 계열 영웅 강화' },

        // ─ 패시브 시스템 ─
        warehouse:  { maxLevel: 10, buildCost: { gold: 200, wood: 80, stone: 60 },   costMult: 0.6, levelPerAccount: 5,  effect: '던전 인벤토리 확장 (Lv당 +1, 기본 5칸)' },
        command:    { maxLevel: 2,  buildCost: { gold: 800, wood: 200, stone: 150, iron: 80 }, costMult: 1.0, levelPerAccount: 20, effect: '던전 대기칸 확장 (Lv당 +1, 최대 5칸)' },
        lab:        { maxLevel: 20, buildCost: { gold: 300, wood: 100, stone: 80, iron: 30 }, costMult: 0.5, levelPerAccount: 2, effect: '케미 효과 상승' },
    },

    // 건물 상세 팝업 사이즈
    BUILDING_POPUP: {
        WIDTH: 300,
        HEIGHT: 420,
    },
};

/**
 * 숫자를 K/M 단위로 축약
 * 999 이하: 그대로 (예: 999)
 * 1000~999999: K 단위 (예: 1.2K, 123K)
 * 1000000 이상: M 단위 (예: 1.23M, 123M)
 *
 * 소수점 1자리 or 정수로 자동 결정:
 * - 10 미만이면 소수점 2자리 (1.23K, 1.23M)
 * - 10~99.9면 소수점 1자리 (12.3K, 12.3M)
 * - 100 이상이면 정수 (123K, 123M)
 */
function formatCompactNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const n = Number(num);
    if (n < 1000) return String(Math.floor(n));

    const units = [
        { value: 1_000_000_000, suffix: 'B' },
        { value: 1_000_000,     suffix: 'M' },
        { value: 1_000,         suffix: 'K' },
    ];

    for (const u of units) {
        if (n >= u.value) {
            const scaled = n / u.value;
            let formatted;
            if (scaled < 10)       formatted = scaled.toFixed(2);
            else if (scaled < 100) formatted = scaled.toFixed(1);
            else                   formatted = Math.floor(scaled).toString();
            // 소수점 끝 0 제거 (1.20K → 1.2K, 1.00K → 1K)
            formatted = formatted.replace(/\.?0+$/, '');
            return formatted + u.suffix;
        }
    }
    return String(Math.floor(n));
}