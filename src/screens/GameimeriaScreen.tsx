import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  useWindowDimensions,
  Animated,
  Easing,
  Share,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Game'>;

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_BACK = require('../assets/ic_back.png');
const IC_SHARE = require('../assets/ic_share.png');

const IMG_DRAGON = require('../assets/game_dragon.png');
const IMG_CROWN_TILE = require('../assets/game_crown_tile.png');
const IMG_CROWN_RESULT = require('../assets/game_crown_result.png');

const REWARD_1 = require('../assets/reward_1.png');
const REWARD_2 = require('../assets/reward_2.png');
const REWARD_3 = require('../assets/reward_3.png');
const REWARD_4 = require('../assets/reward_4.png');
const REWARD_5 = require('../assets/reward_5.png');
const REWARD_6 = require('../assets/reward_6.png');
const REWARD_7 = require('../assets/reward_7.png');

const KEY_CHARACTER = 'selected_character_v2';
const KEY_REWARDS = 'rewards_unlocked_v2';
const KEY_GAME_SESSIONS = 'dragon_hunt_sessions_v2';
const KEY_GAME_WINS = 'dragon_hunt_wins_v2';

type CharacterType = 'empress' | 'emperor';
type Step = 'briefing' | 'search' | 'victory' | 'archive' | 'defeat';

type GameState = {
  step: Step;
  attemptsLeft: number;
  crownIndex: number;
  opened: number[];
  selectedIndex: number | null;
  rewardIndex: number | null;
};

const ROWS = 3;
const COLS = 5;
const TILES_TOTAL = ROWS * COLS;
const ATTEMPTS_TOTAL = 3;

const GOLD = '#F5D37A';
const GOLD_LINE = 'rgba(245,211,122,0.46)';
const GOLD_SOFT = 'rgba(245,211,122,0.18)';
const BROWN = '#2B1200';
const PANEL = 'rgba(33, 9, 5, 0.68)';
const PANEL_SOFT = 'rgba(74, 22, 14, 0.58)';
const TEXT_MAIN = '#FFF8ED';
const TEXT_SUB = 'rgba(255,248,237,0.76)';
const TEXT_DIM = 'rgba(255,248,237,0.58)';
const GREEN = '#30D158';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function dateStrNow() {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function randInt(maxExclusive: number) {
  return Math.floor(Math.random() * maxExclusive);
}

function getGuideLabel(type: CharacterType) {
  return type === 'empress' ? 'Empress Guide' : 'Emperor Guide';
}

function getArchiveTitle(index: number | null) {
  const titles = [
    'Golden Seal',
    'Moon Relic',
    'Royal Mark',
    'Scarlet Crest',
    'Imperial Echo',
    'Flame Emblem',
    'Archive Crown',
  ];
  if (index === null) return titles[0];
  return titles[index] ?? titles[0];
}

const DEFAULT_STATE: GameState = {
  step: 'briefing',
  attemptsLeft: ATTEMPTS_TOTAL,
  crownIndex: 0,
  opened: [],
  selectedIndex: null,
  rewardIndex: null,
};

export default function GameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarH = useBottomTabBarHeight();
  const { width, height } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;
  const isSmallW = width <= 360;

  const topPad = Math.max(insets.top + 4, 8);
  const bottomPad = insets.bottom;
  const cardW = Math.min(460, width - 26);

  const overlayH = Math.max(tabBarH, isTinyH ? 78 : isSmallH ? 84 : 92);
  const bottomGuard = bottomPad + overlayH + (isTinyH ? 8 : 12) + 40;
  const stageOffsetY = isTinyH ? -10 : isSmallH ? -14 : -16;

  const headerH = isTinyH ? 88 : isSmallH ? 98 : 108;
  const gap = isTinyH ? 10 : 12;

  const introDragonH = isTinyH ? 150 : isSmallH ? 170 : 205;
  const playDragonH = isTinyH ? 164 : isSmallH ? 184 : 220;

  const gridW = Math.min(cardW, width - 30);
  const gridGap = isTinyH ? 7 : isSmallH ? 8 : 10;

  const tileSize = useMemo(() => {
    const raw = Math.floor((gridW - gridGap * (COLS - 1)) / COLS);
    const hard = isTinyH ? 48 : isSmallH ? 52 : 60;
    return Math.min(raw, hard);
  }, [gridW, gridGap, isTinyH, isSmallH]);

  const gridBlockW = tileSize * COLS + gridGap * (COLS - 1);

  const [today] = useState(() => dateStrNow());
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('empress');
  const [unlocked, setUnlocked] = useState<boolean[]>(() => new Array(7).fill(false));
  const [sessionCount, setSessionCount] = useState(0);
  const [winCount, setWinCount] = useState(0);
  const [state, setState] = useState<GameState>(DEFAULT_STATE);

  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;
  const rewards = useMemo(
    () => [REWARD_1, REWARD_2, REWARD_3, REWARD_4, REWARD_5, REWARD_6, REWARD_7],
    []
  );

  const unlockedCount = useMemo(() => unlocked.filter(Boolean).length, [unlocked]);
  const collectionPercent = useMemo(
    () => Math.round((unlockedCount / rewards.length) * 100),
    [unlockedCount, rewards.length]
  );

  const anim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  useEffect(() => {
    animateIn();
  }, [state.step, state.attemptsLeft, state.selectedIndex, state.rewardIndex, animateIn]);

  const fade = anim;
  const y = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1] });

  const loadCharacter = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem(KEY_CHARACTER);
      if (value === 'empress' || value === 'emperor') {
        setSelectedCharacter(value);
      }
    } catch {}
  }, []);

  const loadUnlocked = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_REWARDS);
      if (!raw) {
        setUnlocked(new Array(7).fill(false));
        return;
      }

      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const normalized = new Array(7).fill(false).map((_, i) => Boolean(arr[i]));
        setUnlocked(normalized);
      } else {
        setUnlocked(new Array(7).fill(false));
      }
    } catch {
      setUnlocked(new Array(7).fill(false));
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [sessionsRaw, winsRaw] = await Promise.all([
        AsyncStorage.getItem(KEY_GAME_SESSIONS),
        AsyncStorage.getItem(KEY_GAME_WINS),
      ]);
      setSessionCount(Number(sessionsRaw ?? 0) || 0);
      setWinCount(Number(winsRaw ?? 0) || 0);
    } catch {
      setSessionCount(0);
      setWinCount(0);
    }
  }, []);

  const persistUnlocked = useCallback(async (arr: boolean[]) => {
    try {
      await AsyncStorage.setItem(KEY_REWARDS, JSON.stringify(arr));
    } catch {}
  }, []);

  const incrementSessions = useCallback(async () => {
    try {
      const next = sessionCount + 1;
      setSessionCount(next);
      await AsyncStorage.setItem(KEY_GAME_SESSIONS, String(next));
    } catch {}
  }, [sessionCount]);

  const incrementWins = useCallback(async () => {
    try {
      const next = winCount + 1;
      setWinCount(next);
      await AsyncStorage.setItem(KEY_GAME_WINS, String(next));
    } catch {}
  }, [winCount]);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
      loadUnlocked();
      loadStats();
      setState(DEFAULT_STATE);
      return undefined;
    }, [loadCharacter, loadUnlocked, loadStats])
  );

  useEffect(() => {
    loadCharacter();
    loadUnlocked();
    loadStats();
  }, [loadCharacter, loadUnlocked, loadStats]);

  const startNewRound = useCallback(async () => {
    await incrementSessions();
    setState({
      step: 'search',
      attemptsLeft: ATTEMPTS_TOTAL,
      crownIndex: randInt(TILES_TOTAL),
      opened: [],
      selectedIndex: null,
      rewardIndex: null,
    });
  }, [incrementSessions]);

  const backToBriefing = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const pickTile = useCallback(
    (idx: number) => {
      if (state.step !== 'search') return;
      if (state.opened.includes(idx)) return;
      setState(prev => ({ ...prev, selectedIndex: idx }));
    },
    [state.step, state.opened]
  );

  const openSelected = useCallback(async () => {
    if (state.step !== 'search') return;
    if (state.selectedIndex === null) return;
    if (state.opened.includes(state.selectedIndex)) return;

    const idx = state.selectedIndex;
    const opened = [idx, ...state.opened];
    const hit = idx === state.crownIndex;

    if (hit) {
      const rewardIndex = randInt(7);

      const nextUnlocked = [...unlocked];
      nextUnlocked[rewardIndex] = true;
      setUnlocked(nextUnlocked);
      await persistUnlocked(nextUnlocked);
      await incrementWins();

      setState(prev => ({
        ...prev,
        opened,
        selectedIndex: null,
        step: 'victory',
        rewardIndex,
      }));
      return;
    }

    const attemptsLeft = clamp(state.attemptsLeft - 1, 0, ATTEMPTS_TOTAL);

    if (attemptsLeft === 0) {
      setState(prev => ({
        ...prev,
        opened,
        attemptsLeft,
        selectedIndex: null,
        step: 'defeat',
        rewardIndex: null,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      opened,
      attemptsLeft,
      selectedIndex: null,
    }));
  }, [
    state.step,
    state.selectedIndex,
    state.opened,
    state.crownIndex,
    state.attemptsLeft,
    unlocked,
    persistUnlocked,
    incrementWins,
  ]);

  const goToArchiveReward = useCallback(() => {
    if (state.step !== 'victory') return;
    setState(prev => ({ ...prev, step: 'archive' }));
  }, [state.step]);

  const tryAgain = useCallback(async () => {
    await startNewRound();
  }, [startNewRound]);

  const shareResult = useCallback(async () => {
    try {
      let msg = 'I explored the archive challenge.';
      if (state.step === 'victory') msg = 'I found the hidden crown in the archive challenge.';
      if (state.step === 'archive' && state.rewardIndex !== null) {
        msg = `I unlocked "${getArchiveTitle(state.rewardIndex)}" in my collection.`;
      }
      if (state.step === 'defeat') msg = 'I missed the hidden crown this round, but I will try again.';
      await Share.share({ message: msg });
    } catch {}
  }, [state.step, state.rewardIndex]);

  const attemptText = useMemo(() => {
    const used = ATTEMPTS_TOTAL - state.attemptsLeft;
    const current = clamp(used + 1, 1, ATTEMPTS_TOTAL);
    return `Search ${current}/${ATTEMPTS_TOTAL}`;
  }, [state.attemptsLeft]);

  const canOpen = state.step === 'search' && state.selectedIndex !== null;

  const rewardBoxSize = useMemo(() => {
    const base = Math.min(cardW, width - 26);
    const half = Math.floor(base * 0.52);
    const hard = isTinyH ? 170 : isSmallH ? 190 : 214;
    return Math.min(half, hard);
  }, [cardW, width, isTinyH, isSmallH]);

  const btnH = isTinyH ? 50 : isSmallH ? 53 : 56;
  const secondaryBtnH = isTinyH ? 48 : isSmallH ? 50 : 52;
  const androidDown = Platform.OS === 'android' ? 16 : 0;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: topPad }}>
        <View style={[styles.stage, { marginTop: stageOffsetY + androidDown }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              width: cardW,
              paddingBottom: bottomGuard,
            }}
          >
            <View style={[styles.headerCard, { height: headerH, marginBottom: gap }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.headerThumbWrap, isTinyH && { width: 52, height: 52 }]}>
                  <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.headerEyebrow, { fontSize: isTinyH ? 11 : 12 }]}>
                    ARCHIVE CHALLENGE
                  </Text>
                  <Text style={[styles.headerTitle, { fontSize: isTinyH ? 17 : 19 }]}>
                    Hidden Crown Hunt
                  </Text>
                  <Text style={[styles.headerDate, { fontSize: isTinyH ? 11 : 12 }]}>
                    Session date: {today}
                  </Text>
                </View>
              </View>

              <View style={styles.headerDot} />
            </View>

            <Animated.View
              style={{
                opacity: fade,
                transform: [{ translateY: y }, { scale }],
              }}
            >
              {state.step === 'briefing' ? (
                <>
                  <View style={[styles.summaryCard, { marginBottom: gap }]}>
                    <View style={styles.summaryTopRow}>
                      <View style={styles.summaryAvatarWrap}>
                        <Image source={chosenAvatar} style={styles.summaryAvatar} resizeMode="contain" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.summaryLabel}>CURRENT GUIDE</Text>
                        <Text style={styles.summaryTitle}>{getGuideLabel(selectedCharacter)}</Text>
                        <Text style={styles.summarySub}>
                          Explore the archive, choose tiles, and uncover the hidden crown within three attempts.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statPill}>
                        <Text style={styles.statPillValue}>{sessionCount}</Text>
                        <Text style={styles.statPillLabel}>Rounds</Text>
                      </View>

                      <View style={styles.statPill}>
                        <Text style={styles.statPillValue}>{winCount}</Text>
                        <Text style={styles.statPillLabel}>Wins</Text>
                      </View>

                      <View style={styles.statPill}>
                        <Text style={styles.statPillValue}>{collectionPercent}%</Text>
                        <Text style={styles.statPillLabel}>Archive</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.dragonCard, { height: introDragonH, marginBottom: gap }]}>
                    <Image source={IMG_DRAGON} style={styles.dragonImg} resizeMode="cover" />
                  </View>

                  <View style={[styles.briefCard, { marginBottom: gap }]}>
                    <Text style={styles.briefTitle}>Mission rules</Text>
                    <Text style={styles.briefText}>
                      Each round hides one crown among fifteen archive tiles. Select a tile, reveal it,
                      and continue until you find the correct place. A successful round unlocks one
                      reward image in your collection.
                    </Text>
                  </View>

                  <Pressable
                    onPress={startNewRound}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      { height: btnH },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.primaryBtnText}>Begin round</Text>
                  </Pressable>

                  <Text style={styles.footerHint}>
                    Collection progress: {unlockedCount}/7 unlocked
                  </Text>
                </>
              ) : null}

              {state.step === 'search' ? (
                <>
                  <View style={[styles.roundStatusCard, { marginBottom: gap }]}>
                    <View style={styles.roundStatusTop}>
                      <Text style={styles.roundStatusTitle}>Search phase</Text>
                      <Text style={styles.roundStatusValue}>{attemptText}</Text>
                    </View>

                    <Text style={styles.roundStatusText}>
                      Choose one archive tile. If the crown is hidden there, you unlock a new reward.
                    </Text>
                  </View>

                  <View style={[styles.dragonCard, { height: playDragonH, marginBottom: gap }]}>
                    <Image source={IMG_DRAGON} style={styles.dragonImg} resizeMode="cover" />
                  </View>

                  <View style={[styles.attemptPill, { alignSelf: 'center', marginBottom: gap }]}>
                    <Text style={styles.attemptText}>{attemptText}</Text>
                  </View>

                  <View style={{ width: gridBlockW, alignSelf: 'center', marginBottom: gap }}>
                    {Array.from({ length: ROWS }).map((_, r) => (
                      <View key={`row_${r}`} style={[styles.gridRow, { marginBottom: r === ROWS - 1 ? 0 : gridGap }]}>
                        {Array.from({ length: COLS }).map((__, c) => {
                          const idx = r * COLS + c;
                          const isOpened = state.opened.includes(idx);
                          const isSelected = state.selectedIndex === idx;

                          return (
                            <Pressable
                              key={`tile_${idx}`}
                              onPress={() => pickTile(idx)}
                              style={({ pressed }) => [
                                styles.tile,
                                {
                                  width: tileSize,
                                  height: tileSize,
                                  marginRight: c === COLS - 1 ? 0 : gridGap,
                                  borderRadius: isTinyH ? 11 : 13,
                                },
                                isSelected && styles.tileSelected,
                                pressed && !isOpened && styles.btnPressed,
                              ]}
                            >
                              <View style={styles.tileInner}>
                                {!isOpened ? (
                                  <Image
                                    source={IMG_CROWN_TILE}
                                    style={[styles.tileCrownImg, isTinyH && { width: 18, height: 18 }]}
                                    resizeMode="contain"
                                  />
                                ) : idx === state.crownIndex ? (
                                  <Image
                                    source={IMG_CROWN_TILE}
                                    style={[styles.tileCrownImgBig, isTinyH && { width: 24, height: 24 }]}
                                    resizeMode="contain"
                                  />
                                ) : (
                                  <Text style={styles.tileEmptyText}>
                                    Empty{'\n'}tile
                                  </Text>
                                )}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    ))}
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={backToBriefing}
                      style={({ pressed }) => [
                        styles.roundBtn,
                        styles.iconBtn,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_BACK} style={styles.backIcon} resizeMode="contain" />
                    </Pressable>

                    <Pressable
                      disabled={!canOpen}
                      onPress={openSelected}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        { flex: 1, height: secondaryBtnH, marginLeft: 12 },
                        !canOpen && styles.btnDisabled,
                        pressed && canOpen && styles.btnPressed,
                      ]}
                    >
                      <Text style={styles.primaryBtnText}>Reveal tile</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.footerHint}>
                    Collection progress: {unlockedCount}/7 unlocked
                  </Text>
                </>
              ) : null}

              {state.step === 'victory' ? (
                <>
                  <View style={[styles.resultCard, { marginBottom: gap, height: isTinyH ? 240 : isSmallH ? 280 : 320 }]}>
                    <Image source={IMG_CROWN_RESULT} style={styles.resultImg} resizeMode="contain" />
                  </View>

                  <View style={[styles.dialogCard, { marginBottom: gap }]}>
                    <View style={styles.dialogRow}>
                      <View style={styles.dialogAvatarWrap}>
                        <Image source={chosenAvatar} style={styles.dialogAvatarImg} resizeMode="contain" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.dialogTitle}>Archive unlocked</Text>
                        <Text style={styles.dialogText}>
                          You found the hidden crown. This round added a new reward to your collection archive.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    onPress={goToArchiveReward}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      { height: btnH },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.primaryBtnText}>Open reward archive</Text>
                  </Pressable>
                </>
              ) : null}

              {state.step === 'archive' ? (
                <>
                  <View style={[styles.archiveCard, { marginBottom: gap }]}>
                    <View style={[styles.rewardBox, { width: rewardBoxSize, height: rewardBoxSize }]}>
                      <Image
                        source={state.rewardIndex !== null ? rewards[state.rewardIndex] : rewards[0]}
                        style={styles.rewardImg}
                        resizeMode="cover"
                      />
                    </View>

                    <Text style={styles.archiveRewardTitle}>
                      {getArchiveTitle(state.rewardIndex)}
                    </Text>
                    <Text style={styles.archiveRewardSub}>
                      This reward image has been saved in your collection.
                    </Text>
                  </View>

                  <View style={[styles.dialogCard, { marginBottom: gap }]}>
                    <View style={styles.dialogRow}>
                      <View style={styles.dialogAvatarWrap}>
                        <Image source={chosenAvatar} style={styles.dialogAvatarImg} resizeMode="contain" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.dialogTitle}>Collection updated</Text>
                        <Text style={styles.dialogText}>
                          Your archive now contains {unlockedCount} unlocked reward{unlockedCount === 1 ? '' : 's'}.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={backToBriefing}
                      style={({ pressed }) => [
                        styles.roundBtn,
                        styles.iconBtn,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_BACK} style={styles.backIcon} resizeMode="contain" />
                    </Pressable>

                    <Pressable
                      onPress={shareResult}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        { flex: 1, height: btnH, marginLeft: 12 },
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_SHARE} style={styles.shareIcon} resizeMode="contain" />
                      <Text style={styles.primaryBtnText}>Share reward</Text>
                    </Pressable>
                  </View>

                  <View style={{ height: 12 }} />

                  <Pressable
                    onPress={tryAgain}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      { height: secondaryBtnH },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.secondaryBtnText}>Start another round</Text>
                  </Pressable>
                </>
              ) : null}

              {state.step === 'defeat' ? (
                <>
                  <View style={[styles.dragonCard, { height: playDragonH, marginBottom: gap }]}>
                    <Image source={IMG_DRAGON} style={styles.dragonImg} resizeMode="cover" />
                    <View style={styles.gameOverBadge}>
                      <Text style={styles.gameOverText}>Round ended</Text>
                    </View>
                  </View>

                  <View style={[styles.dialogCard, { marginBottom: gap }]}>
                    <View style={styles.dialogRow}>
                      <View style={styles.dialogAvatarWrap}>
                        <Image source={chosenAvatar} style={styles.dialogAvatarImg} resizeMode="contain" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.dialogTitle}>Crown not found</Text>
                        <Text style={styles.dialogText}>
                          The hidden crown stayed in the archive this time. Start another round to continue the search.
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={backToBriefing}
                      style={({ pressed }) => [
                        styles.roundBtn,
                        styles.iconBtn,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_BACK} style={styles.backIcon} resizeMode="contain" />
                    </Pressable>

                    <Pressable
                      onPress={shareResult}
                      style={({ pressed }) => [
                        styles.primaryBtn,
                        { flex: 1, height: btnH, marginLeft: 12 },
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_SHARE} style={styles.shareIcon} resizeMode="contain" />
                      <Text style={styles.primaryBtnText}>Share round</Text>
                    </Pressable>
                  </View>

                  <View style={{ height: 12 }} />

                  <Pressable
                    onPress={tryAgain}
                    style={({ pressed }) => [
                      styles.secondaryBtn,
                      { height: secondaryBtnH },
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.secondaryBtnText}>Try another round</Text>
                  </Pressable>
                </>
              ) : null}
            </Animated.View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  headerCard: {
    borderRadius: 22,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerThumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 12,
  },

  headerThumb: {
    width: '100%',
    height: '100%',
  },

  headerEyebrow: {
    color: GOLD,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },

  headerTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    lineHeight: 22,
  },

  headerDate: {
    marginTop: 6,
    color: TEXT_DIM,
    fontWeight: '700',
  },

  headerDot: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: GREEN,
  },

  summaryCard: {
    borderRadius: 22,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    padding: 14,
  },

  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  summaryAvatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    overflow: 'hidden',
    marginRight: 12,
  },

  summaryAvatar: {
    width: '100%',
    height: '100%',
  },

  summaryLabel: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.9,
    marginBottom: 4,
  },

  summaryTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 18,
  },

  summarySub: {
    color: TEXT_SUB,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  statPill: {
    flex: 1,
    backgroundColor: GOLD_SOFT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.22)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statPillValue: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 16,
  },

  statPillLabel: {
    color: TEXT_DIM,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 3,
  },

  dragonCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: GOLD_LINE,
  },

  dragonImg: {
    width: '100%',
    height: '100%',
  },

  briefCard: {
    borderRadius: 22,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 14,
  },

  briefTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 8,
  },

  briefText: {
    color: TEXT_SUB,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 19,
  },

  roundStatusCard: {
    borderRadius: 20,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  roundStatusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  roundStatusTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 15,
  },

  roundStatusValue: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 13,
  },

  roundStatusText: {
    color: TEXT_SUB,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 7,
  },

  attemptPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
  },

  attemptText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 12,
  },

  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tile: {
    backgroundColor: 'rgba(120,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.45)',
    overflow: 'hidden',
  },

  tileSelected: {
    borderColor: 'rgba(245,211,122,0.98)',
    backgroundColor: 'rgba(160,0,0,0.62)',
  },

  tileInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },

  tileCrownImg: {
    width: 20,
    height: 20,
    opacity: 0.92,
  },

  tileCrownImgBig: {
    width: 26,
    height: 26,
  },

  tileEmptyText: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '900',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  roundBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: GOLD,
  },

  backIcon: {
    width: 22,
    height: 22,
  },

  primaryBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  primaryBtnText: {
    color: BROWN,
    fontWeight: '900',
    fontSize: 18,
  },

  secondaryBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryBtnText: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 17,
  },

  btnPressed: {
    transform: [{ scale: 0.988 }],
    opacity: 0.96,
  },

  btnDisabled: {
    opacity: 0.55,
  },

  footerHint: {
    textAlign: 'center',
    color: TEXT_DIM,
    fontWeight: '800',
    fontSize: 12,
    marginTop: 10,
  },

  resultCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: GOLD_LINE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultImg: {
    width: '100%',
    height: '100%',
  },

  archiveCard: {
    borderRadius: 22,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  rewardBox: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: GOLD_LINE,
  },

  rewardImg: {
    width: '100%',
    height: '100%',
  },

  archiveRewardTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 19,
    marginTop: 14,
    textAlign: 'center',
  },

  archiveRewardSub: {
    color: TEXT_SUB,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },

  dialogCard: {
    borderRadius: 22,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  dialogRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dialogAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'hidden',
    marginRight: 12,
  },

  dialogAvatarImg: {
    width: '100%',
    height: '100%',
  },

  dialogTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 4,
  },

  dialogText: {
    color: TEXT_SUB,
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 18,
  },

  shareIcon: {
    width: 18,
    height: 18,
  },

  gameOverBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
  },

  gameOverText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 12,
  },
});
