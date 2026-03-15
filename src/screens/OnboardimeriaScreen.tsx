import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  FlatList,
  useWindowDimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboard'>;

const BG = require('../assets/bg.png');

const IMG_1 = require('../assets/od1.png');
const IMG_2 = require('../assets/od2.png');
const IMG_3 = require('../assets/od3.png');
const IMG_4 = require('../assets/od4.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

type Slide = {
  key: string;
  image: any;
  chapter: string;
  title: string;
  subtitle: string;
  bubbles: { side: 'left' | 'right'; text: string }[];
  cta: string;
};

const GOLD = '#F5D37A';
const PANEL = 'rgba(28, 8, 5, 0.68)';
const PANEL_SOFT = 'rgba(60, 16, 10, 0.56)';
const TEXT_MAIN = '#FFF8ED';
const TEXT_SUB = 'rgba(255,248,237,0.76)';
const TEXT_DIM = 'rgba(255,248,237,0.56)';
const GREEN = '#2ED573';
const BROWN = '#2B1200';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Bubble({
  side,
  text,
  maxWidth,
  compact,
}: {
  side: 'left' | 'right';
  text: string;
  maxWidth: number;
  compact: boolean;
}) {
  const isLeft = side === 'left';

  return (
    <View
      style={[
        styles.bubbleRow,
        isLeft ? { justifyContent: 'flex-start' } : { justifyContent: 'flex-end' },
      ]}
    >
      {isLeft && (
        <View style={[styles.avatarWrap, compact && styles.avatarWrapCompact]}>
          <Image source={AV_LEFT} style={styles.avatar} resizeMode="contain" />
        </View>
      )}

      <View style={[styles.bubble, { maxWidth }, compact && styles.bubbleCompact]}>
        <Text style={[styles.bubbleText, compact && styles.bubbleTextCompact]}>
          {text}
        </Text>
      </View>

      {!isLeft && (
        <View style={[styles.avatarWrap, compact && styles.avatarWrapCompact]}>
          <Image source={AV_RIGHT} style={styles.avatar} resizeMode="contain" />
        </View>
      )}
    </View>
  );
}

export default function OnboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);

  const isTinyH = height <= 640;
  const isSmallH = height <= 700;
  const isSmallW = width <= 360;
  const compact = isTinyH || isSmallH;

  const topPad = Math.max(8, insets.top);
  const bottomPad = Math.max(10, insets.bottom);

  const outerSide = isSmallW ? 12 : 14;
  const cardW = Math.min(430, width - outerSide * 2);

  const slides: Slide[] = useMemo(
    () => [
      {
        key: 's1',
        image: IMG_1,
        chapter: 'CHAPTER 1',
        title: 'Arrival to the imperial path',
        subtitle: 'Guided introduction before entering the main experience.',
        bubbles: [
          { side: 'left', text: 'You have not come to our Empire by chance.' },
          { side: 'right', text: 'Those who cross these gates are ready to guide their own destiny.' },
          { side: 'left', text: 'From today, your steps follow a more deliberate path.' },
        ],
        cta: 'Continue',
      },
      {
        key: 's2',
        image: IMG_2,
        chapter: 'CHAPTER 2',
        title: 'Choose your inner direction',
        subtitle: 'A first decision shapes the mood of the day ahead.',
        bubbles: [
          { side: 'left', text: 'A strong ruler first understands today’s inner state.' },
          { side: 'right', text: 'Calm, determination, strength, or reflection — each mood shapes the day.' },
          { side: 'left', text: 'Your guide will answer according to the path you choose.' },
        ],
        cta: 'Next chapter',
      },
      {
        key: 's3',
        image: IMG_3,
        chapter: 'CHAPTER 3',
        title: 'Small rituals build discipline',
        subtitle: 'Short daily actions create long-term balance and focus.',
        bubbles: [
          { side: 'left', text: 'Each day begins with short imperial tasks.' },
          { side: 'right', text: 'Ten focused minutes can reshape attention and routine.' },
          { side: 'left', text: 'Progress is not built in one leap. It grows in repeated actions.' },
        ],
        cta: 'Understood',
      },
      {
        key: 's4',
        image: IMG_4,
        chapter: 'CHAPTER 4',
        title: 'The hidden crown awaits',
        subtitle: 'A final note before you enter the main journey.',
        bubbles: [
          { side: 'left', text: 'Beyond the palace shadows, the Golden Dragon guards the Crown.' },
          { side: 'right', text: 'Only one gate is true, and only three attempts are given.' },
          { side: 'left', text: 'Find the right path and the archive will reveal a reward.' },
        ],
        cta: 'Enter',
      },
    ],
    []
  );

  const [index, setIndex] = useState(0);

  const fade = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const moveY = useRef(new Animated.Value(0)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;

  const playEnter = useCallback(() => {
    fade.setValue(0);
    scale.setValue(0.988);
    moveY.setValue(10);
    lineAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(moveY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(lineAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [fade, scale, moveY, lineAnim]);

  useEffect(() => {
    playEnter();
  }, [playEnter]);

  const goNext = useCallback(() => {
    const next = index + 1;

    if (next < slides.length) {
      setIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated: false });
      playEnter();
    } else {
      navigation.replace('Choose');
    }
  }, [index, slides.length, navigation, playEnter]);

  const chapterProgress = `${index + 1}/${slides.length}`;

  const progressWidth = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const stageReserved = topPad + bottomPad + (isTinyH ? 14 : 22);
  const cardH = clamp(
    height - stageReserved,
    isTinyH ? 530 : isSmallH ? 590 : 655,
    780
  );

  const topInfoMinH = isTinyH ? 126 : isSmallH ? 136 : 148;
  const imageH = isTinyH ? 108 : isSmallH ? 128 : 160;
  const bottomAreaH = isTinyH ? 108 : isSmallH ? 116 : 124;

  const innerHorizontal = isTinyH ? 10 : 14;
  const bubbleMaxW = Math.min(cardW - 84, isTinyH ? 228 : isSmallH ? 252 : 300);
  const bubbleGap = isTinyH ? 6 : 8;
  const actionBtnH = isTinyH ? 46 : isSmallH ? 48 : 52;

  const bottomButtonsOffset = 60;

  const bubblesScrollH =
    cardH -
    topInfoMinH -
    imageH -
    bottomAreaH -
    bottomButtonsOffset -
    (isTinyH ? 32 : 40);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView
        style={[
          styles.safe,
          {
            paddingTop: topPad,
            paddingBottom: bottomPad,
          },
        ]}
      >
        <View style={styles.stage}>
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(s) => s.key}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View
                  style={[
                    styles.card,
                    {
                      width: cardW,
                      height: cardH,
                      opacity: fade,
                      transform: [{ translateY: moveY }, { scale }],
                    },
                  ]}
                >
                  <View style={[styles.topInfoCard, { minHeight: topInfoMinH }]}>
                    <View style={styles.topInfoRow}>
                      <View style={[styles.chapterPill, { minHeight: isTinyH ? 26 : 30 }]}>
                        <Text style={styles.chapterPillText}>{item.chapter}</Text>
                      </View>

                      <View style={styles.liveDot} />
                    </View>

                    <Text
                      style={[
                        styles.slideTitle,
                        isTinyH
                          ? { fontSize: 15, lineHeight: 19 }
                          : isSmallH
                            ? { fontSize: 16, lineHeight: 20 }
                            : { fontSize: 19, lineHeight: 23 },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text
                      style={[
                        styles.slideSub,
                        isTinyH
                          ? { fontSize: 10.5, lineHeight: 14, marginTop: 4 }
                          : isSmallH
                            ? { fontSize: 11, lineHeight: 15, marginTop: 4 }
                            : { fontSize: 12, lineHeight: 16, marginTop: 5 },
                      ]}
                    >
                      {item.subtitle}
                    </Text>

                    <View style={styles.progressHeadRow}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressValue}>{chapterProgress}</Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.imageCard,
                      {
                        height: imageH,
                        marginTop: isTinyH ? 8 : 10,
                      },
                    ]}
                  >
                    <Image source={item.image} style={styles.topImage} resizeMode="contain" />
                  </View>

                  <ScrollView
                    style={[
                      styles.bubblesScroll,
                      {
                        height: bubblesScrollH,
                        marginTop: isTinyH ? 8 : 10,
                      },
                    ]}
                    contentContainerStyle={{
                      paddingTop: 6,
                      paddingHorizontal: innerHorizontal,
                      paddingBottom: 10,
                      gap: bubbleGap,
                    }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    {item.bubbles.map((b, idx) => (
                      <Bubble
                        key={`${item.key}_${idx}`}
                        side={b.side}
                        text={b.text}
                        maxWidth={bubbleMaxW}
                        compact={compact}
                      />
                    ))}
                  </ScrollView>

                  <View
                    style={[
                      styles.bottomArea,
                      {
                        minHeight: bottomAreaH,
                        paddingBottom: 90,
                      },
                    ]}
                  >
                    <View style={styles.bottomMetaRow}>
                      <Text style={[styles.bottomMetaText, isTinyH && { fontSize: 11 }]}>
                        Imperial prologue
                      </Text>

                      <View style={styles.pageDotsRow}>
                        {slides.map((_, i) => (
                          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                        ))}
                      </View>
                    </View>

                    <Pressable
                      onPress={goNext}
                      style={({ pressed }) => [
                        styles.ctaBtn,
                        {
                          height: actionBtnH,
                          position: 'absolute',
                          left: 4,
                          right: 4,
                          bottom: -60,
                        },
                        pressed && styles.btnPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ctaText,
                          isTinyH
                            ? { fontSize: 16 }
                            : isSmallH
                              ? { fontSize: 17 }
                              : { fontSize: 18 },
                        ]}
                      >
                        {item.cta}
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </View>
            )}
            contentContainerStyle={{
              paddingBottom: bottomPad + 140,
            }}
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

  safe: {
    flex: 1,
  },

  stage: {
    flex: 1,
    justifyContent: 'center',
  },

  card: {
    borderRadius: 26,
    backgroundColor: PANEL,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },

  topInfoCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  chapterPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(245,211,122,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.26)',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chapterPillText: {
    color: GOLD,
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: GREEN,
  },

  slideTitle: {
    color: TEXT_MAIN,
    fontWeight: '900',
  },

  slideSub: {
    color: TEXT_SUB,
    fontWeight: '700',
  },

  progressHeadRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  progressLabel: {
    color: TEXT_DIM,
    fontSize: 10.5,
    fontWeight: '800',
  },

  progressValue: {
    color: GOLD,
    fontSize: 10.5,
    fontWeight: '900',
  },

  progressTrack: {
    marginTop: 6,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: GOLD,
  },

  imageCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  topImage: {
    width: '100%',
    height: '100%',
  },

  bubblesScroll: {
    flexGrow: 0,
  },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  avatarWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },

  avatarWrapCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },

  avatar: {
    width: '100%',
    height: '100%',
  },

  bubble: {
    backgroundColor: '#5B0B0B',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    flexShrink: 1,
  },

  bubbleCompact: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  bubbleText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11.2,
    lineHeight: 15,
    fontWeight: '700',
  },

  bubbleTextCompact: {
    fontSize: 10.5,
    lineHeight: 14,
  },

  bottomArea: {
    justifyContent: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },

  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  bottomMetaText: {
    color: TEXT_DIM,
    fontSize: 12,
    fontWeight: '800',
  },

  pageDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },

  dotActive: {
    width: 18,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },

  ctaBtn: {
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaText: {
    color: BROWN,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  btnPressed: {
    transform: [{ scale: 0.986 }],
    opacity: 0.97,
  },
});