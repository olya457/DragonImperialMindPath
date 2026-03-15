import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  useWindowDimensions,
  ScrollView,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/onboard1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_SHARE = require('../assets/ic_share.png');

const REWARD_1 = require('../assets/reward_1.png');
const REWARD_2 = require('../assets/reward_2.png');
const REWARD_3 = require('../assets/reward_3.png');
const REWARD_4 = require('../assets/reward_4.png');
const REWARD_5 = require('../assets/reward_5.png');
const REWARD_6 = require('../assets/reward_6.png');
const REWARD_7 = require('../assets/reward_7.png');

const KEY_REWARDS = 'rewards_unlocked_v2';
const KEY_CHARACTER = 'selected_character_v2';
const KEY_COLLECTION_LAST_OPEN = 'collection_last_open_v2';

type CharacterType = 'empress' | 'emperor';

type RewardItem = {
  id: string;
  image: any;
  index: number;
  title: string;
  tier: 'common' | 'rare' | 'legend';
};

const GOLD = '#F5D37A';
const GOLD_LINE = 'rgba(245,211,122,0.38)';
const PANEL = 'rgba(33, 9, 5, 0.68)';
const PANEL_SOFT = 'rgba(58, 22, 12, 0.55)';
const TEXT_MAIN = '#FFF8ED';
const TEXT_SUB = 'rgba(255,248,237,0.74)';
const TEXT_DIM = 'rgba(255,248,237,0.56)';
const GREEN = '#2ED573';
const BROWN = '#2B1200';

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function dateStrNow() {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getCollectionStatus(count: number) {
  if (count === 0) return 'No rewards collected yet';
  if (count <= 2) return 'Collection is just beginning';
  if (count <= 4) return 'Collection is growing steadily';
  if (count <= 6) return 'Collection is nearly complete';
  return 'Full collection completed';
}

function getGuideLabel(type: CharacterType) {
  return type === 'empress' ? 'Empress Guide' : 'Emperor Guide';
}

function getTierLabel(tier: RewardItem['tier']) {
  if (tier === 'legend') return 'Legend';
  if (tier === 'rare') return 'Rare';
  return 'Common';
}

export default function CollectionScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;
  const isSmallW = width <= 360;

  const topPad = Math.max(insets.top + 4, 8);
  const bottomSafe = insets.bottom + tabBarHeight + (isTinyH ? 10 : 16);

  const sidePad = clamp(width * 0.04, 13, 20);
  const cardW = Math.min(460, width - sidePad * 2);

  const [today] = useState(() => dateStrNow());
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('empress');
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<boolean[]>(() => new Array(7).fill(false));

  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  const allRewards = useMemo<RewardItem[]>(
    () => [
      { id: 'r1', image: REWARD_1, index: 0, title: 'Golden Seal', tier: 'common' },
      { id: 'r2', image: REWARD_2, index: 1, title: 'Jade Mark', tier: 'common' },
      { id: 'r3', image: REWARD_3, index: 2, title: 'Imperial Echo', tier: 'rare' },
      { id: 'r4', image: REWARD_4, index: 3, title: 'Scarlet Crest', tier: 'rare' },
      { id: 'r5', image: REWARD_5, index: 4, title: 'Moon Relic', tier: 'rare' },
      { id: 'r6', image: REWARD_6, index: 5, title: 'Royal Flame', tier: 'legend' },
      { id: 'r7', image: REWARD_7, index: 6, title: 'Dragon Archive', tier: 'legend' },
    ],
    []
  );

  const openedRewards = useMemo(
    () => allRewards.filter((r) => unlocked[r.index]),
    [allRewards, unlocked]
  );

  const openedCount = useMemo(() => unlocked.filter(Boolean).length, [unlocked]);
  const progressPercent = useMemo(() => Math.round((openedCount / 7) * 100), [openedCount]);
  const statusText = useMemo(() => getCollectionStatus(openedCount), [openedCount]);

  const loadCharacter = useCallback(async () => {
    try {
      const v = await AsyncStorage.getItem(KEY_CHARACTER);
      if (v === 'empress' || v === 'emperor') {
        setSelectedCharacter(v);
      }
    } catch {}
  }, []);

  const loadRewards = useCallback(async () => {
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

  const loadLastOpen = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_COLLECTION_LAST_OPEN);
      if (raw) setLastOpened(raw);
    } catch {}
  }, []);

  const saveLastOpen = useCallback(async () => {
    try {
      const now = dateStrNow();
      await AsyncStorage.setItem(KEY_COLLECTION_LAST_OPEN, now);
      setLastOpened(now);
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
      loadRewards();
      loadLastOpen();
      saveLastOpen();
      return undefined;
    }, [loadCharacter, loadRewards, loadLastOpen, saveLastOpen])
  );

  useEffect(() => {
    loadCharacter();
    loadRewards();
    loadLastOpen();
    saveLastOpen();
  }, [loadCharacter, loadRewards, loadLastOpen, saveLastOpen]);

  const headerH = isTinyH ? 84 : isSmallH ? 94 : 102;
  const gap = isTinyH ? 10 : 12;
  const gridGap = isTinyH ? 10 : 12;
  const gridPaddingX = isTinyH ? 8 : 10;

  const cellW = Math.floor((cardW - gridPaddingX * 2 - gridGap) / 2);
  const cellH = Math.floor(cellW * 1.12);

  const onShareReward = useCallback(async (item: RewardItem) => {
    try {
      await Share.share({
        message: `I unlocked "${item.title}" in my collection.`,
      });
    } catch {}
  }, []);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: topPad }}>
        <View style={styles.stage}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              width: cardW,
              paddingBottom: bottomSafe,
            }}
          >
            <View style={[styles.headerCard, { height: headerH, marginBottom: gap }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.headerThumbWrap, isTinyH && { width: 52, height: 52 }]}>
                  <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.headerEyebrow, { fontSize: isTinyH ? 11 : 12 }]}>
                    COLLECTION ARCHIVE
                  </Text>
                  <Text style={[styles.headerTitle, { fontSize: isTinyH ? 17 : 19 }]}>
                    Reward gallery
                  </Text>
                  <Text style={[styles.headerDate, { fontSize: isTinyH ? 11 : 12 }]}>
                    Today: {today}
                  </Text>
                </View>
              </View>

              <View style={styles.headerDot} />
            </View>

            <View style={[styles.summaryCard, { marginBottom: gap }]}>
              <View style={styles.summaryTopRow}>
                <View style={styles.summaryGuideWrap}>
                  <View style={styles.summaryAvatarWrap}>
                    <Image source={chosenAvatar} style={styles.summaryAvatar} resizeMode="contain" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLabel}>CURRENT GUIDE</Text>
                    <Text style={styles.summaryGuideTitle}>{getGuideLabel(selectedCharacter)}</Text>
                    <Text style={styles.summaryGuideSub}>
                      {lastOpened ? `Last archive visit: ${lastOpened}` : 'Archive session started'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressWrap}>
                <View style={styles.progressHead}>
                  <Text style={styles.progressTitle}>Collection progress</Text>
                  <Text style={styles.progressValue}>{progressPercent}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>

                <View style={styles.summaryMetaRow}>
                  <Text style={styles.summaryMeta}>Unlocked: {openedCount}/7</Text>
                  <Text style={styles.summaryMeta}>{statusText}</Text>
                </View>
              </View>
            </View>

            {openedCount === 0 ? (
              <View style={[styles.emptyCard, { marginTop: isTinyH ? 8 : 10 }]}>
                <View style={styles.emptyRow}>
                  <View style={styles.emptyAvatarWrap}>
                    <Image source={chosenAvatar} style={styles.emptyAvatarImg} resizeMode="contain" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.emptyTitle, isTinyH && { fontSize: 15 }]}>
                      Your archive is empty
                    </Text>
                    <Text style={[styles.emptyText, isTinyH && { fontSize: 13 }]}>
                      Reward items will appear here after they are unlocked during your experience.
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.galleryCard, { paddingHorizontal: gridPaddingX, paddingTop: isTinyH ? 10 : 14 }]}>
                <View style={[styles.grid, { columnGap: gridGap, rowGap: gridGap }]}>
                  {openedRewards.map((item) => {
                    return (
                      <View key={item.id} style={[styles.rewardCard, { width: cellW, height: cellH }]}>
                        <Image source={item.image} style={styles.rewardImg} resizeMode="cover" />

                        <View style={styles.rewardOverlay}>
                          <View style={styles.rewardInfo}>
                            <Text style={styles.rewardTier}>{getTierLabel(item.tier)}</Text>
                            <Text style={styles.rewardTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => onShareReward(item)}
                            style={({ pressed }) => [
                              styles.shareRound,
                              pressed && { transform: [{ scale: 0.98 }] },
                            ]}
                            hitSlop={12}
                          >
                            <Image source={IC_SHARE} style={styles.shareIcon} resizeMode="contain" />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>

                <Text style={styles.countHint}>
                  Archive contains {openedCount} unlocked reward{openedCount === 1 ? '' : 's'}.
                </Text>
              </View>
            )}
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
    marginBottom: 14,
  },

  summaryGuideWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 7,
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

  summaryGuideTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 17,
  },

  summaryGuideSub: {
    color: TEXT_DIM,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
  },

  progressWrap: {},

  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  progressTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 15,
  },

  progressValue: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 14,
  },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: GOLD,
  },

  summaryMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  summaryMeta: {
    flex: 1,
    color: TEXT_SUB,
    fontWeight: '700',
    fontSize: 12,
  },

  emptyCard: {
    borderRadius: 22,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },

  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emptyAvatarWrap: {
    width: 60,
    height: 60,
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

  emptyAvatarImg: {
    width: '100%',
    height: '100%',
  },

  emptyTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 4,
  },

  emptyText: {
    color: TEXT_SUB,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
  },

  galleryCard: {
    borderRadius: 22,
    backgroundColor: 'rgba(30, 8, 4, 0.36)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  rewardCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: GOLD_LINE,
  },

  rewardImg: {
    width: '100%',
    height: '100%',
  },

  rewardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 7, 4, 0.30)',
  },

  rewardInfo: {
    flex: 1,
    paddingRight: 8,
  },

  rewardTier: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  rewardTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
    fontSize: 13,
  },

  shareRound: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shareIcon: {
    width: 16,
    height: 16,
  },

  countHint: {
    marginTop: 12,
    textAlign: 'center',
    color: TEXT_SUB,
    fontWeight: '800',
    fontSize: 12,
  },
});
