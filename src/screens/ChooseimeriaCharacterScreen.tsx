import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Image,
  useWindowDimensions,
  Platform,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Choose'>;

const BG = require('../assets/bg.png');
const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const KEY_CHARACTER = 'selected_character_v1';
const GOLD = '#f5d37a';

type CharacterId = 'empress' | 'emperor';

type CharacterCard = {
  id: CharacterId;
  title: string;
  role: string;
  shortText: string;
  traits: string[];
  image: any;
};

export default function ChooseCharacterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTinyH = height <= 640;
  const isSmallH = height <= 700;
  const isSmallW = width <= 360;

  const topPad = Math.max(10, insets.top);
  const bottomPad = Math.max(10, insets.bottom);

  const cardW = Math.min(430, width - 26);
  const gap = isTinyH ? 10 : isSmallH ? 12 : 14;

  const headerH = isTinyH ? 72 : isSmallH ? 82 : 92;
  const titleSize = isTinyH ? 19 : isSmallH ? 21 : 24;
  const titleLine = isTinyH ? 22 : isSmallH ? 24 : 27;
  const subtitleSize = isTinyH ? 11 : 12;

  const optionMinH = isTinyH ? 176 : isSmallH ? 196 : 214;
  const optionRadius = isTinyH ? 22 : 26;

  const previewH = isTinyH ? 160 : isSmallH ? 182 : 208;
  const previewRadius = isTinyH ? 20 : 24;

  const continueH = isTinyH ? 50 : 56;
  const iconBox = isTinyH ? 40 : 46;

  const imageBoxW = isTinyH ? 104 : isSmallH ? 112 : 120;
  const imageBoxH = isTinyH ? 128 : isSmallH ? 140 : 152;

  const stageShiftY = Platform.OS === 'android' ? -6 : 0;

  const characters: CharacterCard[] = useMemo(
    () => [
      {
        id: 'empress',
        title: 'Empress',
        role: 'Calm path',
        shortText:
          'A reflective guide for balance, diplomacy and thoughtful choices in everyday decisions.',
        traits: ['Balance', 'Insight', 'Grace'],
        image: AV_LEFT,
      },
      {
        id: 'emperor',
        title: 'Emperor',
        role: 'Bold path',
        shortText:
          'A focused guide for action, structure and confident movement when direction is needed.',
        traits: ['Focus', 'Strength', 'Action'],
        image: AV_RIGHT,
      },
    ],
    []
  );

  const [selectedId, setSelectedId] = useState<CharacterId | null>(null);
  const [savedId, setSavedId] = useState<CharacterId | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY_CHARACTER);
        if (saved === 'empress' || saved === 'emperor') {
          setSelectedId(saved);
          setSavedId(saved);
        }
      } catch {}
    })();
  }, []);

  const selectedCharacter = characters.find(item => item.id === selectedId) ?? characters[0];

  const entrance = useRef(new Animated.Value(0)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    previewAnim.setValue(0);
    Animated.timing(previewAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selectedId, previewAnim]);

  const rootOpacity = entrance;

  const rootTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [14 + stageShiftY, stageShiftY],
  });

  const previewOpacity = previewAnim;
  const previewScale = previewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  const onPick = useCallback((id: CharacterId) => {
    setSelectedId(id);
  }, []);

  const onContinue = useCallback(async () => {
    const finalChoice: CharacterId = selectedId ?? 'empress';
    try {
      await AsyncStorage.setItem(KEY_CHARACTER, finalChoice);
    } catch {}
    navigation.replace('MainTabs');
  }, [navigation, selectedId]);

  const topInfoText = selectedId
    ? `Selected: ${selectedCharacter.title}`
    : 'Select a guide to personalize your experience';

  const traitFont = isTinyH ? 10.5 : 11.5;
  const optionTitleSize = isTinyH ? 19 : isSmallW ? 20 : 21;
  const optionRoleSize = isTinyH ? 11 : 12;
  const previewTitleSize = isTinyH ? 18 : 20;
  const previewTextSize = isTinyH ? 12 : 13;

  const scrollBottomPad = bottomPad + (isTinyH ? 12 : 18);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={[styles.safe, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <Animated.View
          style={[
            styles.stage,
            {
              opacity: rootOpacity,
              transform: [{ translateY: rootTranslateY }],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: 'center',
              paddingBottom: scrollBottomPad,
            }}
          >
            <View style={[styles.header, { width: cardW, minHeight: headerH, marginBottom: gap }]}>
              <View
                style={[
                  styles.headerIconWrap,
                  { width: iconBox, height: iconBox, borderRadius: 14 },
                ]}
              >
                <Image source={AV_LEFT} style={styles.headerIcon} resizeMode="contain" />
              </View>

              <View style={styles.headerCenter}>
                <Text style={[styles.headerTitle, { fontSize: titleSize, lineHeight: titleLine }]}>
                  Choose your guide
                </Text>
                <Text style={[styles.headerSubtitle, { fontSize: subtitleSize }]}>
                  Personalize the journey before entering the main experience
                </Text>
              </View>

              <View
                style={[
                  styles.headerIconWrap,
                  { width: iconBox, height: iconBox, borderRadius: 14 },
                ]}
              >
                <Image source={AV_RIGHT} style={styles.headerIcon} resizeMode="contain" />
              </View>
            </View>

            <View style={[styles.infoStrip, { width: cardW, marginBottom: gap }]}>
              <Text style={styles.infoStripText}>{topInfoText}</Text>
            </View>

            {characters.map(item => {
              const active = selectedId === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => onPick(item.id)}
                  style={({ pressed }) => [
                    { width: cardW, marginBottom: gap },
                    pressed && { transform: [{ scale: 0.992 }] },
                  ]}
                >
                  <View
                    style={[
                      styles.optionCard,
                      {
                        minHeight: optionMinH,
                        borderRadius: optionRadius,
                      },
                      active && styles.optionCardActive,
                    ]}
                  >
                    <View style={[styles.optionLeft, { width: imageBoxW + 4 }]}>
                      <View
                        style={[
                          styles.optionImageWrap,
                          {
                            width: imageBoxW,
                            height: imageBoxH,
                          },
                          active && styles.optionImageWrapActive,
                        ]}
                      >
                        <Image source={item.image} style={styles.optionImage} resizeMode="contain" />
                      </View>
                    </View>

                    <View style={styles.optionRight}>
                      <View style={styles.optionTopRow}>
                        <View style={styles.optionTitleWrap}>
                          <Text style={[styles.optionTitle, { fontSize: optionTitleSize }]}>
                            {item.title}
                          </Text>
                          <Text style={[styles.optionRole, { fontSize: optionRoleSize }]}>
                            {item.role}
                          </Text>
                        </View>

                        <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                          {active ? <View style={styles.radioInner} /> : null}
                        </View>
                      </View>

                      <Text style={styles.optionText}>
                        {item.shortText}
                      </Text>

                      <View style={styles.traitsRow}>
                        {item.traits.map(trait => (
                          <View key={trait} style={[styles.traitPill, active && styles.traitPillActive]}>
                            <Text style={[styles.traitText, { fontSize: traitFont }]}>{trait}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <Animated.View
              style={[
                {
                  width: cardW,
                  opacity: previewOpacity,
                  transform: [{ scale: previewScale }],
                  marginBottom: gap,
                },
              ]}
            >
              <View
                style={[
                  styles.previewCard,
                  {
                    minHeight: previewH,
                    borderRadius: previewRadius,
                  },
                ]}
              >
                <View style={styles.previewHeaderRow}>
                  <Text style={styles.previewLabel}>Character preview</Text>

                  {savedId && selectedId === savedId ? (
                    <View style={styles.savedPill}>
                      <Text style={styles.savedPillText}>Saved before</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.previewBody}>
                  <View style={styles.previewImageWrap}>
                    <Image
                      source={selectedCharacter.image}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.previewTextWrap}>
                    <Text style={[styles.previewTitle, { fontSize: previewTitleSize }]}>
                      {selectedCharacter.title}
                    </Text>
                    <Text style={styles.previewRole}>{selectedCharacter.role}</Text>
                    <Text
                      style={[
                        styles.previewText,
                        {
                          fontSize: previewTextSize,
                          lineHeight: isTinyH ? 17 : 19,
                        },
                      ]}
                    >
                      {selectedCharacter.shortText}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Pressable
              onPress={onContinue}
              style={({ pressed }) => [
                { width: cardW },
                pressed && { transform: [{ scale: 0.992 }] },
              ]}
            >
              <View style={[styles.continueBtn, { height: continueH }]}>
                <Text style={styles.continueText}>
                  Continue as {selectedCharacter.title}
                </Text>
              </View>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

  stage: {
    flex: 1,
  },

  header: {
    backgroundColor: 'rgba(95, 10, 10, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.78)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  headerIconWrap: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  headerIcon: {
    width: '100%',
    height: '100%',
  },

  headerCenter: {
    flex: 1,
    paddingHorizontal: 10,
  },

  headerTitle: {
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
  },

  headerSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },

  infoStrip: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  infoStripText: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 13,
  },

  optionCard: {
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.55)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },

  optionCardActive: {
    borderColor: 'rgba(245, 211, 122, 0.95)',
    backgroundColor: 'rgba(80, 8, 8, 0.45)',
  },

  optionLeft: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 10,
    paddingTop: 2,
  },

  optionImageWrap: {
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 8,
  },

  optionImageWrapActive: {
    borderColor: 'rgba(245,211,122,0.50)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  optionImage: {
    width: '100%',
    height: '100%',
  },

  optionRight: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-start',
  },

  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  optionTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  optionTitle: {
    color: GOLD,
    fontWeight: '900',
    marginBottom: 2,
  },

  optionRole: {
    color: 'rgba(255,255,255,0.70)',
    fontWeight: '800',
  },

  optionText: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 12,
    flexShrink: 1,
  },

  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(245,211,122,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 2,
  },

  radioOuterActive: {
    borderColor: GOLD,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: GOLD,
  },

  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },

  traitPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.20)',
    marginRight: 8,
    marginBottom: 8,
  },

  traitPillActive: {
    backgroundColor: 'rgba(245,211,122,0.12)',
    borderColor: 'rgba(245,211,122,0.44)',
  },

  traitText: {
    color: 'rgba(255,255,255,0.84)',
    fontWeight: '800',
  },

  previewCard: {
    backgroundColor: 'rgba(95, 10, 10, 0.66)',
    borderWidth: 1,
    borderColor: 'rgba(245, 211, 122, 0.72)',
    padding: 14,
  },

  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  previewLabel: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 13,
    textTransform: 'uppercase',
    flex: 1,
  },

  savedPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  savedPillText: {
    color: 'rgba(255,255,255,0.80)',
    fontWeight: '800',
    fontSize: 11,
  },

  previewBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  previewImageWrap: {
    width: 110,
    height: 110,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.30)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginRight: 12,
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  previewTextWrap: {
    flex: 1,
  },

  previewTitle: {
    color: '#fff',
    fontWeight: '900',
    marginBottom: 2,
  },

  previewRole: {
    color: GOLD,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 8,
  },

  previewText: {
    color: 'rgba(255,255,255,0.86)',
    fontWeight: '700',
  },

  continueBtn: {
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  continueText: {
    color: '#2b1200',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
  },
});
