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

const IMG_1 = require('../assets/onboard1.png');
const IMG_2 = require('../assets/onboard2.png');
const IMG_3 = require('../assets/onboard3.png');
const IMG_4 = require('../assets/onboard4.png');

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
        title: 'Welcome to the royal path',
        subtitle: 'A refined beginning before you enter your daily guidance journey.',
        bubbles: [
          { side: 'left', text: 'You did not arrive here by accident.' },
          { side: 'right', text: 'Every path begins with a choice, and every choice shapes the day ahead.' },
          { side: 'left', text: 'From this moment, your journey follows a more thoughtful direction.' },
        ],
        cta: 'Continue',
      },
      {
        key: 's2',
        image: IMG_2,
        chapter: 'CHAPTER 2',
        title: 'Choose your royal role',
        subtitle: 'Your selected guide changes the tone of the experience.',
        bubbles: [
          { side: 'left', text: 'A queen leads with grace, balance, and clear reflection.' },
          { side: 'right', text: 'A king moves with focus, structure, and decisive intention.' },
          { side: 'left', text: 'Whichever role you choose, the guidance will adapt to your path.' },
        ],
        cta: 'Next chapter',
      },
      {
        key: 's3',
        image: IMG_3,
        chapter: 'CHAPTER 3',
        title: 'Daily rituals shape the mind',
        subtitle: 'Small repeated actions create discipline, calm, and momentum.',
        bubbles: [
          { side: 'left', text: 'Each day begins with a short focus ritual.' },
          { side: 'right', text: 'A few deliberate actions can change the rhythm of an entire day.' },
          { side: 'left', text: 'Progress grows through consistency, not through one perfect moment.' },
        ],
        cta: 'Understood',
      },
      {
        key: 's4',
        image: IMG_4,
        chapter: 'CHAPTER 4',
        title: 'The golden crown awaits',
        subtitle: 'A final step before entering the main experience.',
        bubbles: [
          { side: 'left', text: 'Guidance, tasks, and reflection are now ready for you.' },
          { side: 'right', text: 'The Crown is not only a symbol of power, but of balance and intention.' },
          { side: 'left', text: 'Step forward and begin your royal journey.' },
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
    isTinyH ? 510 : isSmallH ? 570 : 635,
    760
  );

  const topInfoH = isTinyH ? 118 : isSmallH ? 126 : 136;
  const imageH = isTinyH ? 98 : isSmallH ? 118 : 150;
  const bottomAreaH = isTinyH ? 88 : isSmallH ? 92 : 100;

  const innerHorizontal = isTinyH ? 10 : 14;
  const bubbleMaxW = Math.min(cardW - 84, isTinyH ? 228 : isSmallH ? 252 : 300);
  const bubbleGap = isTinyH ? 6 : 8;
  const actionBtnH = isTinyH ? 46 : isSmallH ? 48 : 52;

  const bubblesScrollH =
    cardH -
    topInfoH -
    imageH -
    bottomAreaH -
    (isTinyH ? 28 : 34);

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
                  <View style={[styles.topInfoCard, { minHeight: topInfoH }]}>
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
                      numberOfLines={2}
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
                      numberOfLines={2}
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
                        marginTop: isTinyH ? 6 : 8,
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
                        marginTop: isTinyH ? 6 : 8,
                      },
                    ]}
                    contentContainerStyle={{
                      paddingHorizontal: innerHorizontal,
                      paddingBottom: 4,
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

                  <View style={[styles.bottomArea, { minHeight: bottomAreaH }]}>
                    <View style={styles.bottomMetaRow}>
                      <Text style={[styles.bottomMetaText, isTinyH && { fontSize: 11 }]}>
                        Royal introduction
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
                        { height: actionBtnH },
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
    overflow: 'hidden',
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
    paddingVertical: 8,
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
    marginTop: 7,
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
    marginTop: 5,
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
    paddingVertical: 6,
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
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 4,
  },

  bottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
