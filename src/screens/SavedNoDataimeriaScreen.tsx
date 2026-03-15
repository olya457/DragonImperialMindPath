import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  FlatList,
  Image,
  Share,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/od1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_SHARE = require('../assets/ic_share.png');
const IC_X = require('../assets/ic_x.png');

type Props = BottomTabScreenProps<MainTabParamList, 'SavedNoData'>;

type SavedTipItem = {
  id: string;
  categoryId: string;
  categoryTitle: string;
  text: string;
  createdAt: number;
};

const KEY_SAVED_TIPS = 'saved_tips_v2';
const KEY_CHARACTER = 'selected_character_v2';
const KEY_ARCHIVE_VISITS = 'saved_archive_visits_v1';

const GOLD = '#F5D37A';
const BROWN = '#2B1200';
const PANEL = 'rgba(34, 10, 6, 0.68)';
const PANEL_SOFT = 'rgba(65, 18, 12, 0.58)';
const GOLD_LINE = 'rgba(245,211,122,0.42)';
const GOLD_SOFT = 'rgba(245,211,122,0.18)';
const TEXT_MAIN = '#FFF8ED';
const TEXT_SUB = 'rgba(255,248,237,0.76)';
const TEXT_DIM = 'rgba(255,248,237,0.56)';
const GREEN = '#2ED573';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function todayStr() {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function getGuideLabel(value: 'empress' | 'emperor') {
  return value === 'empress' ? 'Empress Guide' : 'Emperor Guide';
}

function getArchiveState(count: number) {
  if (count === 0) return 'Archive is empty';
  if (count <= 3) return 'Archive is growing';
  if (count <= 8) return 'Archive is well stocked';
  return 'Archive is richly filled';
}

export default function SavedNoDataScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;

  const cardW = Math.min(470, width - 26);

  const [items, setItems] = useState<SavedTipItem[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<'empress' | 'emperor'>('empress');
  const [visitCount, setVisitCount] = useState(0);

  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;
  const archiveStatus = useMemo(() => getArchiveState(items.length), [items.length]);

  const readCharacter = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_CHARACTER);
      const value = (raw ?? '').trim();

      if (value === 'empress' || value === 'emperor') {
        setSelectedCharacter(value);
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
      const arr = raw ? JSON.parse(raw) : [];
      const safeArr = Array.isArray(arr) ? arr : [];
      setItems(safeArr);
    } catch {
      setItems([]);
    }
  }, []);

  const loadVisits = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_ARCHIVE_VISITS);
      setVisitCount(Number(raw ?? 0) || 0);
    } catch {
      setVisitCount(0);
    }
  }, []);

  const incrementVisits = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_ARCHIVE_VISITS);
      const current = Number(raw ?? 0) || 0;
      const next = current + 1;
      await AsyncStorage.setItem(KEY_ARCHIVE_VISITS, String(next));
      setVisitCount(next);
    } catch {}
  }, []);

  useEffect(() => {
    readCharacter();
    loadSaved();
    loadVisits();
  }, [readCharacter, loadSaved, loadVisits]);

  useFocusEffect(
    useCallback(() => {
      readCharacter();
      loadSaved();
      loadVisits();
      incrementVisits();
      return undefined;
    }, [readCharacter, loadSaved, loadVisits, incrementVisits])
  );

  const clearAll = useCallback(async () => {
    try {
      setItems([]);
      await AsyncStorage.setItem(KEY_SAVED_TIPS, JSON.stringify([]));
    } catch {}
  }, []);

  const removeOne = useCallback(
    async (id: string) => {
      try {
        const next = items.filter((x) => x.id !== id);
        setItems(next);
        await AsyncStorage.setItem(KEY_SAVED_TIPS, JSON.stringify(next));
      } catch {}
    },
    [items]
  );

  const shareOne = useCallback(async (item: SavedTipItem) => {
    try {
      await Share.share({
        message: `${item.categoryTitle}: ${item.text}`,
      });
    } catch {}
  }, []);

  const latestSavedDate = useMemo(() => {
    if (items.length === 0) return 'No saved entries yet';
    const latest = [...items].sort((a, b) => b.createdAt - a.createdAt)[0];
    return `Latest entry: ${formatDate(latest.createdAt)}`;
  }, [items]);

  const androidDown = Platform.OS === 'android' ? 10 : 0;
  const sectionGap = isTinyH ? 10 : 12;
  const headerImageSize = isTinyH ? 50 : isSmallH ? 54 : 58;
  const guideAvatarSize = isTinyH ? 50 : isSmallH ? 54 : 58;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={[styles.stage, { marginTop: androidDown }]}>
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            showsVerticalScrollIndicator={false}
            style={{ width: cardW }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
            ListHeaderComponent={
              <>
                <View style={[styles.headerCard, { marginBottom: sectionGap }]}>
                  <View style={styles.headerLeft}>
                    <View
                      style={[
                        styles.headerThumbWrap,
                        {
                          width: headerImageSize,
                          height: headerImageSize,
                          borderRadius: 16,
                        },
                      ]}
                    >
                      <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.headerEyebrow}>SAVED ARCHIVE</Text>
                      <Text style={styles.headerTitle}>Stored daily insights</Text>
                      <Text style={styles.headerDate}>Today: {todayStr()}</Text>
                    </View>
                  </View>

                  <View style={styles.headerDot} />
                </View>

                <View style={[styles.summaryCard, { marginBottom: sectionGap }]}>
                  <View style={styles.summaryGuideRow}>
                    <View
                      style={[
                        styles.summaryAvatarWrap,
                        {
                          width: guideAvatarSize,
                          height: guideAvatarSize,
                          borderRadius: 18,
                        },
                      ]}
                    >
                      <Image source={chosenAvatar} style={styles.summaryAvatar} resizeMode="contain" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.summaryLabel}>CURRENT GUIDE</Text>
                      <Text style={styles.summaryTitle}>{getGuideLabel(selectedCharacter)}</Text>
                      <Text style={styles.summaryText} numberOfLines={2}>
                        This archive stores the insights you decided to keep for later reading and sharing.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{items.length}</Text>
                      <Text style={styles.statLabel}>Saved</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{visitCount}</Text>
                      <Text style={styles.statLabel}>Visits</Text>
                    </View>

                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{archiveStatus}</Text>
                      <Text style={styles.statLabel}>State</Text>
                    </View>
                  </View>

                  <Text style={styles.summaryMeta}>{latestSavedDate}</Text>
                </View>

                <View style={[styles.archiveHeadRow, { marginBottom: sectionGap }]}>
                  <View>
                    <Text style={styles.archiveHeadTitle}>Archive entries</Text>
                    <Text style={styles.archiveHeadSub}>
                      {items.length === 0
                        ? 'No saved insight cards yet'
                        : `${items.length} saved item${items.length === 1 ? '' : 's'} available`}
                    </Text>
                  </View>

                  {items.length > 0 ? (
                    <Pressable
                      onPress={clearAll}
                      style={({ pressed }) => [
                        styles.clearBtn,
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text style={styles.clearText}>Clear all</Text>
                    </Pressable>
                  ) : null}
                </View>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <View style={styles.emptyTopRow}>
                  <View style={styles.emptyAvatarWrap}>
                    <Image source={chosenAvatar} style={styles.emptyAvatarImg} resizeMode="contain" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyTitle}>Your archive is empty</Text>
                    <Text style={styles.emptyText}>
                      Save a daily insight from the Daily Center and it will appear here for later reading.
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => navigation.goBack()}
                  style={({ pressed }) => [
                    styles.emptyBackBtn,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={styles.emptyBackText}>Return</Text>
                </Pressable>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.entryCard}>
                <View style={styles.entryTopRow}>
                  <View style={styles.entryMetaWrap}>
                    <Text style={styles.entryDate}>{formatDate(item.createdAt)}</Text>
                    <Text style={styles.entryCategory} numberOfLines={1}>
                      {item.categoryTitle}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => removeOne(item.id)}
                    style={({ pressed }) => [
                      styles.removeBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Image source={IC_X} style={styles.removeIcon} resizeMode="contain" />
                  </Pressable>
                </View>

                <Text style={styles.entryLabel}>Saved insight</Text>
                <Text style={styles.entryText} numberOfLines={4}>
                  {item.text}
                </Text>

                <View style={styles.entryActionsRow}>
                  <Pressable
                    onPress={() => shareOne(item)}
                    style={({ pressed }) => [
                      styles.shareBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Image source={IC_SHARE} style={styles.shareIcon} resizeMode="contain" />
                    <Text style={styles.shareText}>Share</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
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
    fontSize: 19,
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
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.22)',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 14,
    textAlign: 'center',
  },

  statLabel: {
    color: TEXT_DIM,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },

  summaryMeta: {
    marginTop: 12,
    color: TEXT_DIM,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },

  archiveHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  archiveHeadTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 21,
  },

  archiveHeadSub: {
    color: TEXT_DIM,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
  },

  clearBtn: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearText: {
    color: BROWN,
    fontWeight: '900',
    fontSize: 13,
  },

  emptyCard: {
    borderRadius: 24,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 10,
  },

  emptyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyAvatarWrap: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
    padding: 6,
  },

  emptyAvatarImg: {
    width: '100%',
    height: '100%',
  },

  emptyTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 4,
  },

  emptyText: {
    flex: 1,
    color: TEXT_SUB,
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 19,
  },

  emptyBackBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyBackText: {
    color: BROWN,
    fontWeight: '900',
    fontSize: 15,
  },

  entryCard: {
    borderRadius: 22,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    marginBottom: 12,
  },

  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  entryMetaWrap: {
    flex: 1,
  },

  entryDate: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 12,
  },

  entryCategory: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '900',
    fontSize: 14,
  },

  removeBtn: {
    width: 42,
    height: 36,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeIcon: {
    width: 16,
    height: 16,
  },

  entryLabel: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  entryText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 19,
  },

  entryActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  shareBtn: {
    height: 42,
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },

  shareIcon: {
    width: 18,
    height: 18,
  },

  shareText: {
    color: BROWN,
    fontWeight: '900',
    fontSize: 14,
  },

  btnPressed: {
    transform: [{ scale: 0.988 }],
    opacity: 0.96,
  },
});
