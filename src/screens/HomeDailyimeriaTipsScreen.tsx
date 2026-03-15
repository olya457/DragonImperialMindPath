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
import { useFocusEffect } from '@react-navigation/native';

import type { MainTabParamList } from '../navigation/types';
import { TIP_CATEGORIES, DAILY_TASKS, TipCategoryId } from '../data/dailyTipsData';

type Props = BottomTabScreenProps<MainTabParamList, 'HomeDailyTips'>;

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_BACK = require('../assets/ic_back.png');
const IC_SHARE = require('../assets/ic_share.png');
const IC_SAVE = require('../assets/ic_save.png');
const IC_SAVE_FILLED = require('../assets/ic_save_filled.png');
const IC_REFRESH = require('../assets/ic_refresh.png');
const IC_PLAY = require('../assets/ic_play.png');
const IC_PAUSE = require('../assets/ic_pause.png');
const IC_CHECK = require('../assets/ic_check.png');
const IC_X = require('../assets/ic_x.png');

type Tab = 'insights' | 'focus';
type TaskPhase = 'pick' | 'running' | 'finished';

type SavedTipItem = {
  id: string;
  categoryId: TipCategoryId;
  categoryTitle: string;
  text: string;
  createdAt: number;
};

const KEY_SAVED_TIPS = 'saved_tips_v2';
const KEY_CHARACTER = 'selected_character_v2';
const KEY_DAILY_SCREEN_VISITS = 'daily_center_visits_v1';
const KEY_DAILY_FINISHED_TASKS = 'daily_finished_tasks_v1';

const GOLD = '#F5D37A';
const GOLD_LINE = 'rgba(245,211,122,0.42)';
const GOLD_SOFT = 'rgba(245,211,122,0.18)';
const PANEL = 'rgba(34, 10, 6, 0.68)';
const PANEL_SOFT = 'rgba(65, 18, 12, 0.58)';
const TEXT_MAIN = '#FFF8ED';
const TEXT_SUB = 'rgba(255,248,237,0.76)';
const TEXT_DIM = 'rgba(255,248,237,0.56)';
const BROWN = '#2B1200';
const GREEN = '#2ED573';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate() {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad2(m)}:${pad2(s)}`;
}

function pickRandomIndex(len: number, current?: number) {
  if (len <= 1) return 0;
  let next = Math.floor(Math.random() * len);
  if (typeof current === 'number' && len > 1 && next === current) {
    next = (next + 1) % len;
  }
  return next;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getCharacterLabel(value: 'empress' | 'emperor') {
  return value === 'empress' ? 'Empress Guide' : 'Emperor Guide';
}

function getGuideLine(tab: Tab, tipCat: TipCategoryId | null, phase: TaskPhase) {
  if (tab === 'insights') {
    if (tipCat === null) return 'Choose a theme to open a daily insight for your current mood.';
    return 'Read, save, share, or refresh the current insight.';
  }

  if (phase === 'pick') return 'Choose one focus task and start a timed practice session.';
  if (phase === 'running') return 'Stay with the task until the timer ends or pause when needed.';
  return 'Reflect honestly: did you complete the session or want to repeat it?';
}

export default function HomeDailyTipsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;
  const isSmallW = width <= 360;

  const topPad = Math.max(insets.top + 4, 8);
  const bottomPad = Math.max(insets.bottom + 10, 16);
  const sidePad = clamp(width * 0.04, 13, 20);
  const cardW = Math.min(470, width - sidePad * 2);

  const [tab, setTab] = useState<Tab>('insights');
  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');

  const [tipCat, setTipCat] = useState<TipCategoryId | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  const [savedIDs, setSavedIDs] = useState<Set<string>>(new Set());
  const [savedCount, setSavedCount] = useState(0);

  const [taskId, setTaskId] = useState(0);
  const [taskPhase, setTaskPhase] = useState<TaskPhase>('pick');
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);
  const [running, setRunning] = useState(false);

  const [visitCount, setVisitCount] = useState(0);
  const [finishedTasksCount, setFinishedTasksCount] = useState(0);

  const anim = useRef(new Animated.Value(0)).current;

  const today = useMemo(() => formatDate(), []);
  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  const activeCategory = useMemo(() => {
    if (!tipCat) return null;
    return TIP_CATEGORIES.find((c) => c.id === tipCat) ?? null;
  }, [tipCat]);

  const tipText = activeCategory ? activeCategory.tips[tipIndex] : '';

  const currentTipId = useMemo(() => {
    if (!activeCategory) return '';
    return `${activeCategory.id}_${tipIndex}`;
  }, [activeCategory, tipIndex]);

  const isSaved = currentTipId ? savedIDs.has(currentTipId) : false;

  const guideText = useMemo(
    () => getGuideLine(tab, tipCat, taskPhase),
    [tab, tipCat, taskPhase]
  );

  const tiles4 = useMemo(() => {
    const arr = TIP_CATEGORIES.slice(0, 4);
    while (arr.length < 4) {
      arr.push({
        id: (`__empty_${arr.length}` as unknown) as TipCategoryId,
        title: '',
        tips: [],
        glyphImage: undefined as any,
      });
    }
    return arr;
  }, []);

  const progressPercent = useMemo(() => {
    const tipsProgress = Math.min(savedCount, 8);
    const taskProgress = Math.min(finishedTasksCount, 8);
    return Math.min(100, Math.round(((tipsProgress + taskProgress) / 16) * 100));
  }, [savedCount, finishedTasksCount]);

  const animateIn = useCallback(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  useEffect(() => {
    animateIn();
  }, [tab, tipCat, tipIndex, taskPhase, taskId, animateIn]);

  const opacity = anim;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1] });

  const loadCharacter = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem(KEY_CHARACTER);
      if (v === 'empress' || v === 'emperor') {
        setSelectedCharacter(v);
      } else {
        setSelectedCharacter('empress');
      }
    } catch {
      setSelectedCharacter('empress');
    }
  }, []);

  const loadSaved = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_SAVED_TIPS);
      const arr: SavedTipItem[] = raw ? JSON.parse(raw) : [];
      const safeArr = Array.isArray(arr) ? arr : [];
      setSavedIDs(new Set(safeArr.map((x) => x.id)));
      setSavedCount(safeArr.length);
    } catch {
      setSavedIDs(new Set());
      setSavedCount(0);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const [visitsRaw, finishedRaw] = await Promise.all([
        AsyncStorage.getItem(KEY_DAILY_SCREEN_VISITS),
        AsyncStorage.getItem(KEY_DAILY_FINISHED_TASKS),
      ]);

      setVisitCount(Number(visitsRaw ?? 0) || 0);
      setFinishedTasksCount(Number(finishedRaw ?? 0) || 0);
    } catch {
      setVisitCount(0);
      setFinishedTasksCount(0);
    }
  }, []);

  const incrementVisits = useCallback(async () => {
    try {
      const next = visitCount + 1;
      setVisitCount(next);
      await AsyncStorage.setItem(KEY_DAILY_SCREEN_VISITS, String(next));
    } catch {}
  }, [visitCount]);

  const incrementFinishedTasks = useCallback(async () => {
    try {
      const next = finishedTasksCount + 1;
      setFinishedTasksCount(next);
      await AsyncStorage.setItem(KEY_DAILY_FINISHED_TASKS, String(next));
    } catch {}
  }, [finishedTasksCount]);

  useEffect(() => {
    loadCharacter();
    loadSaved();
    loadStats();
  }, [loadCharacter, loadSaved, loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
      loadSaved();
      loadStats();
      incrementVisits();

      setTab('insights');
      setTipCat(null);
      setTipIndex(0);

      setTaskId(0);
      setTaskPhase('pick');
      setRunning(false);
      setSecondsLeft(10 * 60);

      return undefined;
    }, [loadCharacter, loadSaved, loadStats, incrementVisits])
  );

  const onShareTip = useCallback(async () => {
    if (!activeCategory) return;
    try {
      await Share.share({
        message: `${activeCategory.title}: ${tipText}`,
      });
    } catch {}
  }, [activeCategory, tipText]);

  const saveOrUnsaveTip = useCallback(async () => {
    if (!activeCategory) return;

    try {
      const raw = await AsyncStorage.getItem(KEY_SAVED_TIPS);
      const arr: SavedTipItem[] = raw ? JSON.parse(raw) : [];
      const safeArr = Array.isArray(arr) ? arr : [];

      const id = currentTipId;
      const exists = safeArr.find((x) => x.id === id);

      let next: SavedTipItem[];

      if (exists) {
        next = safeArr.filter((x) => x.id !== id);
      } else {
        const item: SavedTipItem = {
          id,
          categoryId: activeCategory.id,
          categoryTitle: activeCategory.title,
          text: tipText,
          createdAt: Date.now(),
        };
        next = [item, ...safeArr];
      }

      await AsyncStorage.setItem(KEY_SAVED_TIPS, JSON.stringify(next));
      setSavedIDs(new Set(next.map((x) => x.id)));
      setSavedCount(next.length);
    } catch {}
  }, [activeCategory, currentTipId, tipText]);

  const randomizeTip = useCallback(() => {
    if (!activeCategory) return;
    setTipIndex((prev) => pickRandomIndex(activeCategory.tips.length, prev));
  }, [activeCategory]);

  const prevTip = useCallback(() => {
    if (!activeCategory) return;
    const len = activeCategory.tips.length;
    setTipIndex((p) => (p - 1 + len) % len);
  }, [activeCategory]);

  const nextTip = useCallback(() => {
    if (!activeCategory) return;
    const len = activeCategory.tips.length;
    setTipIndex((p) => (p + 1) % len);
  }, [activeCategory]);

  useEffect(() => {
    if (taskPhase !== 'running' || !running) return;

    const timer = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [taskPhase, running]);

  useEffect(() => {
    if (taskPhase === 'running' && secondsLeft === 0) {
      setRunning(false);
      setTaskPhase('finished');
    }
  }, [secondsLeft, taskPhase]);

  const startTask = useCallback(() => {
    setSecondsLeft(10 * 60);
    setTaskPhase('running');
    setRunning(true);
  }, []);

  const toggleRun = useCallback(() => {
    setRunning((p) => !p);
  }, []);

  const backToTaskPick = useCallback(() => {
    setRunning(false);
    setTaskPhase('pick');
    setSecondsLeft(10 * 60);
  }, []);

  const refreshTask = useCallback(() => {
    setTaskId((p) => (p + 1) % DAILY_TASKS.length);
  }, []);

  const completeTask = useCallback(async () => {
    await incrementFinishedTasks();
    backToTaskPick();
  }, [incrementFinishedTasks, backToTaskPick]);

  const resetTipView = useCallback(() => {
    setTipCat(null);
    setTipIndex(0);
  }, []);

  const headerImageSize = isTinyH ? 50 : isSmallH ? 54 : 60;
  const guideAvatarSize = isTinyH ? 48 : isSmallH ? 52 : 58;
  const sectionGap = isTinyH ? 10 : 12;

  const renderInsightTile = (c: any, idx: number, tileW: number, tileH: number) => {
    const isEmpty = String(c.id).startsWith('__empty_');

    if (isEmpty) {
      return <View key={`empty_${idx}`} style={{ width: tileW, height: tileH, opacity: 0 }} />;
    }

    return (
      <Pressable
        key={c.id}
        onPress={() => {
          setTipCat(c.id);
          setTipIndex(0);
        }}
        style={({ pressed }) => [
          styles.themeTile,
          { width: tileW, height: tileH },
          pressed && styles.btnPressed,
        ]}
      >
        <View style={styles.themeTileGlyphWrap}>
          <Image source={c.glyphImage} style={styles.themeTileGlyph} resizeMode="contain" />
        </View>

        <View style={styles.themeTileFooter}>
          <Text style={styles.themeTileTitle} numberOfLines={1}>
            {c.title}
          </Text>
          <View style={styles.themeTileMark} />
        </View>
      </Pressable>
    );
  };

  const tileGap = isTinyH ? 8 : 10;
  const tileW = Math.floor((cardW - 16 * 2 - tileGap) / 2);
  const tileH = isTinyH ? 120 : isSmallH ? 132 : 148;

  const insightBodyH = activeCategory ? undefined : tileH * 2 + tileGap + 32;
  const androidDown = Platform.OS === 'android' ? 14 : 0;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: topPad, paddingBottom: bottomPad }}>
        <View style={[styles.stage, { marginTop: androidDown }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              width: cardW,
              paddingBottom: bottomPad + 60,
            }}
          >
            <View style={[styles.headerCard, { marginBottom: sectionGap }]}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.headerThumbWrap,
                    { width: headerImageSize, height: headerImageSize, borderRadius: 16 },
                  ]}
                >
                  <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.headerEyebrow}>DAILY CENTER</Text>
                  <Text style={[styles.headerTitle, { fontSize: isTinyH ? 17 : 19 }]}>
                    Rituals and guidance
                  </Text>
                  <Text style={styles.headerDate}>Today: {today}</Text>
                </View>
              </View>

              <View style={styles.headerDot} />
            </View>

            <View style={[styles.summaryCard, { marginBottom: sectionGap }]}>
              <View style={styles.summaryGuideRow}>
                <View
                  style={[
                    styles.summaryAvatarWrap,
                    { width: guideAvatarSize, height: guideAvatarSize, borderRadius: 18 },
                  ]}
                >
                  <Image source={chosenAvatar} style={styles.summaryAvatar} resizeMode="contain" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryLabel}>CURRENT GUIDE</Text>
                  <Text style={styles.summaryTitle}>{getCharacterLabel(selectedCharacter)}</Text>
                  <Text style={styles.summaryText} numberOfLines={2}>
                    {guideText}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{savedCount}</Text>
                  <Text style={styles.statLabel}>Saved</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{finishedTasksCount}</Text>
                  <Text style={styles.statLabel}>Done</Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{progressPercent}%</Text>
                  <Text style={styles.statLabel}>Focus</Text>
                </View>
              </View>

              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>Visits: {visitCount}</Text>
              </View>
            </View>

            <View style={[styles.switchRow, { marginBottom: sectionGap }]}>
              <Pressable
                onPress={() => {
                  setTab('insights');
                  resetTipView();
                }}
                style={({ pressed }) => [
                  styles.switchBtn,
                  tab === 'insights' && styles.switchBtnActive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.switchText, tab === 'insights' && styles.switchTextActive]}>
                  Daily insights
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setTab('focus');
                  resetTipView();
                  backToTaskPick();
                }}
                style={({ pressed }) => [
                  styles.switchBtn,
                  tab === 'focus' && styles.switchBtnActive,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={[styles.switchText, tab === 'focus' && styles.switchTextActive]}>
                  Focus session
                </Text>
              </Pressable>
            </View>

            <Animated.View
              style={{
                opacity,
                transform: [{ translateY }, { scale }],
              }}
            >
              {tab === 'insights' ? (
                <View style={[styles.bodyCard, insightBodyH ? { minHeight: insightBodyH } : null]}>
                  {activeCategory === null ? (
                    <>
                      <Text style={styles.sectionTitle}>Choose a theme</Text>

                      <View style={[styles.tileRow, { marginBottom: tileGap }]}>
                        {renderInsightTile(tiles4[0], 0, tileW, tileH)}
                        <View style={{ width: tileGap }} />
                        {renderInsightTile(tiles4[1], 1, tileW, tileH)}
                      </View>

                      <View style={styles.tileRow}>
                        {renderInsightTile(tiles4[2], 2, tileW, tileH)}
                        <View style={{ width: tileGap }} />
                        {renderInsightTile(tiles4[3], 3, tileW, tileH)}
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.sectionTitle}>Insight view</Text>

                      <View style={styles.insightTopRow}>
                        <View style={styles.insightThemeCard}>
                          <View style={styles.insightThemeGlyph}>
                            <Image
                              source={activeCategory.glyphImage}
                              style={styles.insightThemeGlyphImg}
                              resizeMode="contain"
                            />
                          </View>
                          <Text style={styles.insightThemeTitle} numberOfLines={2}>
                            {activeCategory.title}
                          </Text>
                        </View>

                        <View style={styles.insightTextCard}>
                          <Text style={styles.insightTextLabel}>Daily insight</Text>
                          <Text
                            style={[
                              styles.insightTextBody,
                              {
                                fontSize: isTinyH ? 12.5 : isSmallH ? 13 : 14,
                                lineHeight: isTinyH ? 18 : 19,
                              },
                            ]}
                          >
                            {tipText}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.carouselRow}>
                        <Pressable
                          onPress={prevTip}
                          style={({ pressed }) => [
                            styles.iconRoundBtn,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <Image source={IC_BACK} style={styles.iconMd} resizeMode="contain" />
                        </Pressable>

                        <Pressable
                          onPress={nextTip}
                          style={({ pressed }) => [
                            styles.actionPillMuted,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <Text style={styles.actionPillMutedText}>Next</Text>
                        </Pressable>

                        <Pressable
                          onPress={randomizeTip}
                          style={({ pressed }) => [
                            styles.iconRoundBtn,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <Image source={IC_REFRESH} style={styles.iconMd} resizeMode="contain" />
                        </Pressable>
                      </View>

                      <View style={styles.actionsRow}>
                        <Pressable
                          onPress={onShareTip}
                          style={({ pressed }) => [
                            styles.actionPillPrimary,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <Image source={IC_SHARE} style={styles.iconSm} resizeMode="contain" />
                          <Text style={styles.actionPillPrimaryText}>Share insight</Text>
                        </Pressable>

                        <Pressable
                          onPress={saveOrUnsaveTip}
                          style={({ pressed }) => [
                            styles.iconRoundBtn,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <Image
                            source={isSaved ? IC_SAVE_FILLED : IC_SAVE}
                            style={styles.iconMd}
                            resizeMode="contain"
                          />
                        </Pressable>
                      </View>

                      <View style={styles.footerButtonsWrap}>
                        <Pressable
                          onPress={() => navigation.navigate('SavedNoData')}
                          style={({ pressed }) => [
                            styles.footerGhostBtn,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <Text style={styles.footerGhostBtnText}>Open saved archive</Text>
                        </Pressable>

                        <Pressable
                          onPress={resetTipView}
                          style={({ pressed }) => [
                            styles.footerGhostBtn,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <Text style={styles.footerGhostBtnText}>Back to themes</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              ) : taskPhase === 'pick' ? (
                <View style={styles.bodyCard}>
                  <Text style={styles.sectionTitle}>Select a focus task</Text>

                  <View style={styles.taskList}>
                    {DAILY_TASKS.map((t, i) => {
                      const active = i === taskId;
                      return (
                        <Pressable
                          key={`${t}_${i}`}
                          onPress={() => setTaskId(i)}
                          style={({ pressed }) => [
                            styles.taskCard,
                            active && styles.taskCardActive,
                            pressed && styles.btnPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.taskCardText,
                              active && styles.taskCardTextActive,
                            ]}
                            numberOfLines={2}
                          >
                            {t}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.focusBottomRow}>
                    <Pressable
                      onPress={startTask}
                      style={({ pressed }) => [
                        styles.primaryWideBtn,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text style={styles.primaryWideBtnText}>Start session</Text>
                    </Pressable>

                    <Pressable
                      onPress={refreshTask}
                      style={({ pressed }) => [
                        styles.iconRoundBtnLarge,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_REFRESH} style={styles.iconMd} resizeMode="contain" />
                    </Pressable>
                  </View>
                </View>
              ) : taskPhase === 'running' ? (
                <View style={styles.bodyCard}>
                  <Text style={styles.sectionTitle}>Focus session</Text>

                  <View style={styles.currentTaskCard}>
                    <Text style={styles.currentTaskLabel}>CURRENT TASK</Text>
                    <Text style={styles.currentTaskText}>{DAILY_TASKS[taskId]}</Text>
                  </View>

                  <View style={styles.timerRow}>
                    <View style={styles.timerIconWrap}>
                      <Text style={styles.timerEmoji}>⏱</Text>
                    </View>

                    <View style={styles.timerTextWrap}>
                      <Text style={styles.timerMainText}>{formatMMSS(secondsLeft)}</Text>
                      <Text style={styles.timerSubText}>
                        {running ? 'Session in progress' : 'Session paused'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.runningActionsRow}>
                    <Pressable
                      onPress={backToTaskPick}
                      style={({ pressed }) => [
                        styles.iconRoundBtnLarge,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_BACK} style={styles.iconMd} resizeMode="contain" />
                    </Pressable>

                    <Pressable
                      onPress={toggleRun}
                      style={({ pressed }) => [
                        styles.primaryWideBtn,
                        { marginHorizontal: 12 },
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image
                        source={running ? IC_PAUSE : IC_PLAY}
                        style={styles.iconSm}
                        resizeMode="contain"
                      />
                      <Text style={styles.primaryWideBtnText}>
                        {running ? 'Pause session' : 'Resume session'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.bodyCard}>
                  <Text style={styles.sectionTitle}>Session complete</Text>

                  <View style={styles.currentTaskCard}>
                    <Text style={styles.currentTaskLabel}>FINISHED SESSION</Text>
                    <Text style={styles.currentTaskText}>{DAILY_TASKS[taskId]}</Text>
                  </View>

                  <View style={styles.timerRow}>
                    <View style={styles.timerIconWrap}>
                      <Text style={styles.timerEmoji}>⏱</Text>
                    </View>

                    <View style={styles.timerTextWrap}>
                      <Text style={[styles.timerMainText, { fontSize: isTinyH ? 21 : 24 }]}>
                        Time is up
                      </Text>
                      <Text style={styles.timerSubText}>
                        Mark the result or return to your task list.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.finishActionsRow}>
                    <Pressable
                      onPress={backToTaskPick}
                      style={({ pressed }) => [
                        styles.iconRoundBtnLarge,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_BACK} style={styles.iconMd} resizeMode="contain" />
                    </Pressable>

                    <Pressable
                      onPress={completeTask}
                      style={({ pressed }) => [
                        styles.iconRoundBtnLarge,
                        styles.successBtn,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_CHECK} style={styles.iconMd} resizeMode="contain" />
                    </Pressable>

                    <Pressable
                      onPress={backToTaskPick}
                      style={({ pressed }) => [
                        styles.iconRoundBtnLarge,
                        styles.rejectBtn,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Image source={IC_X} style={styles.iconMd} resizeMode="contain" />
                    </Pressable>
                  </View>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },

  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  headerCard: {
    borderRadius: 24,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerThumbWrap: {
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
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },

  headerTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    lineHeight: 23,
  },

  headerDate: {
    marginTop: 6,
    color: TEXT_DIM,
    fontWeight: '700',
    fontSize: 12,
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
    borderRadius: 24,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    padding: 14,
  },

  summaryGuideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  summaryAvatarWrap: {
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 6,
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
    fontSize: 17,
  },

  summaryText: {
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

  statBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.22)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 16,
  },

  statLabel: {
    color: TEXT_DIM,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 4,
  },

  progressWrap: {
    marginTop: 12,
  },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: GOLD,
  },

  progressText: {
    marginTop: 8,
    color: TEXT_DIM,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },

  switchRow: {
    flexDirection: 'row',
    gap: 10,
  },

  switchBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(70,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  switchBtnActive: {
    backgroundColor: 'rgba(120,0,0,0.68)',
    borderColor: 'rgba(245,211,122,0.65)',
  },

  switchText: {
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '900',
    fontSize: 13,
  },

  switchTextActive: {
    color: GOLD,
  },

  bodyCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: GOLD_LINE,
    padding: 16,
  },

  sectionTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 14,
  },

  tileRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  themeTile: {
    borderRadius: 20,
    backgroundColor: 'rgba(60,0,0,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'space-between',
  },

  themeTileGlyphWrap: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    justifyContent: 'center',
  },

  themeTileGlyph: {
    width: '100%',
    height: '100%',
  },

  themeTileFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  themeTileTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 13,
    maxWidth: '80%',
  },

  themeTileMark: {
    width: 18,
    height: 18,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    backgroundColor: 'rgba(245,211,122,0.12)',
  },

  insightTopRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  insightThemeCard: {
    width: 106,
    borderRadius: 18,
    backgroundColor: 'rgba(60,0,0,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  insightThemeGlyph: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: 8,
  },

  insightThemeGlyphImg: {
    width: '100%',
    height: '100%',
  },

  insightThemeTitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
  },

  insightTextCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(60,0,0,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    padding: 12,
    justifyContent: 'center',
  },

  insightTextLabel: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 12,
    marginBottom: 6,
  },

  insightTextBody: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
  },

  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 12,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconRoundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconRoundBtnLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionPillPrimary: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 10,
  },

  actionPillPrimaryText: {
    color: BROWN,
    fontWeight: '900',
    fontSize: 16,
  },

  actionPillMuted: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },

  actionPillMutedText: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 15,
  },

  footerButtonsWrap: {
    marginTop: 12,
    gap: 8,
  },

  footerGhostBtn: {
    minHeight: 40,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.30)',
    backgroundColor: 'rgba(60,0,0,0.22)',
  },

  footerGhostBtnText: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 12,
  },

  taskList: {
    gap: 10,
  },

  taskCard: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(60,0,0,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },

  taskCardActive: {
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderColor: 'rgba(245,211,122,0.65)',
  },

  taskCardText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },

  taskCardTextActive: {
    color: GOLD,
  },

  focusBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },

  primaryWideBtn: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  primaryWideBtnText: {
    color: BROWN,
    fontWeight: '900',
    fontSize: 17,
  },

  currentTaskCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },

  currentTaskLabel: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 5,
  },

  currentTaskText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  timerIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  timerEmoji: {
    color: BROWN,
    fontWeight: '900',
  },

  timerTextWrap: {
    flex: 1,
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  timerMainText: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 27,
    letterSpacing: 0.6,
  },

  timerSubText: {
    marginTop: 3,
    color: TEXT_DIM,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },

  runningActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  finishActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  successBtn: {
    backgroundColor: GOLD,
  },

  rejectBtn: {
    backgroundColor: GOLD,
  },

  iconMd: {
    width: 22,
    height: 22,
  },

  iconSm: {
    width: 18,
    height: 18,
  },

  btnPressed: {
    transform: [{ scale: 0.988 }],
    opacity: 0.96,
  },
});
