import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Animated,
  Easing,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Advisors'>;

const BG = require('../assets/bg.png');
const HEADER_IMG = require('../assets/od1.png');

const AV_LEFT = require('../assets/avatar_left.png');
const AV_RIGHT = require('../assets/avatar_right.png');

const IC_BACK = require('../assets/ic_back.png');
const IC_SHARE = require('../assets/ic_share.png');

const IMG_WISE = require('../assets/advisor_wise.png');
const IMG_MILITARY = require('../assets/advisor_military.png');
const IMG_PEASANTS = require('../assets/advisor_peasants.png');

const KEY_CHARACTER = 'selected_character_v1';
const KEY_HISTORY = 'advisors_consultation_history_v2';

const GOLD = '#f5d37a';

type ScreenStage = 'advisorList' | 'questionList' | 'thinking' | 'result';

type AdvisorId = 'wise' | 'military' | 'peasants';
type CharacterId = 'empress' | 'emperor';
type QuestionKind =
  | 'decision'
  | 'discipline'
  | 'stress'
  | 'relationships'
  | 'purpose'
  | 'recovery'
  | 'clarity';

type QuestionItem = {
  id: string;
  label: string;
  kind: QuestionKind;
};

type Advisor = {
  id: AdvisorId;
  title: string;
  subtitle: string;
  image: any;
  toneLabel: string;
  intro: string;
  focus: string[];
  questions: QuestionItem[];
};

type ConsultationRecord = {
  id: string;
  advisorId: AdvisorId;
  advisorTitle: string;
  question: string;
  answer: string;
  createdAt: number;
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickBySeed<T>(items: T[], seed: string) {
  if (!items.length) return items[0];
  const idx = hashString(seed) % items.length;
  return items[idx];
}

export default function AdvisorsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarH = useBottomTabBarHeight();
  const { width, height } = useWindowDimensions();

  const isSmallH = height <= 700;
  const isTinyH = height <= 640;
  const cardW = Math.min(430, width - 26);

  const topPad = insets.top;
  const bottomPad = insets.bottom;
  const gap = isTinyH ? 8 : isSmallH ? 10 : 12;
  const headerH = isTinyH ? 74 : isSmallH ? 84 : 98;
  const contentShiftY = isTinyH ? -8 : isSmallH ? -10 : -18;
  const androidDown = Platform.OS === 'android' ? 20 : 0;

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('empress');
  const [stage, setStage] = useState<ScreenStage>('advisorList');
  const [advisorId, setAdvisorId] = useState<AdvisorId>('wise');
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [history, setHistory] = useState<ConsultationRecord[]>([]);
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chosenAvatar = selectedCharacter === 'empress' ? AV_LEFT : AV_RIGHT;

  useEffect(() => {
    (async () => {
      try {
        const savedCharacter = await AsyncStorage.getItem(KEY_CHARACTER);
        if (savedCharacter === 'empress' || savedCharacter === 'emperor') {
          setSelectedCharacter(savedCharacter);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY_HISTORY);
        if (raw) {
          const parsed = JSON.parse(raw) as ConsultationRecord[];
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (thinkingTimer.current) {
        clearTimeout(thinkingTimer.current);
      }
    };
  }, []);

  const dateStr = useMemo(() => {
    const d = new Date();
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }, []);

  const advisors: Advisor[] = useMemo(
    () => [
      {
        id: 'wise',
        title: 'Wise Advisors',
        subtitle: 'Reflective guidance for choices, meaning and calm thinking.',
        image: IMG_WISE,
        toneLabel: 'Reflective tone',
        intro: 'This council helps you slow down, observe patterns and choose with clarity.',
        focus: ['Clarity', 'Purpose', 'Balance'],
        questions: [
          {
            id: 'wise_1',
            label: 'How do I make a thoughtful decision when I feel uncertain?',
            kind: 'decision',
          },
          {
            id: 'wise_2',
            label: 'How do I stay calm when my thoughts become too loud?',
            kind: 'stress',
          },
          {
            id: 'wise_3',
            label: 'How do I understand what really matters to me now?',
            kind: 'purpose',
          },
          {
            id: 'wise_4',
            label: 'How do I find clarity when emotions affect my judgment?',
            kind: 'clarity',
          },
        ],
      },
      {
        id: 'military',
        title: 'Military Advisors',
        subtitle: 'Direct guidance for action, structure and persistence.',
        image: IMG_MILITARY,
        toneLabel: 'Command tone',
        intro: 'This council is built for momentum: simplify the mission, act, review, repeat.',
        focus: ['Action', 'Discipline', 'Recovery'],
        questions: [
          {
            id: 'military_1',
            label: 'How do I stop delaying important work today?',
            kind: 'discipline',
          },
          {
            id: 'military_2',
            label: 'How do I stay consistent when motivation is low?',
            kind: 'discipline',
          },
          {
            id: 'military_3',
            label: 'What should I do first when everything feels urgent?',
            kind: 'decision',
          },
          {
            id: 'military_4',
            label: 'How do I get back on track after a setback?',
            kind: 'recovery',
          },
        ],
      },
      {
        id: 'peasants',
        title: 'People’s Advisors',
        subtitle: 'Practical guidance for daily life, home rhythm and relationships.',
        image: IMG_PEASANTS,
        toneLabel: 'Practical tone',
        intro: 'This council gives small useful steps for ordinary days and real conversations.',
        focus: ['Routine', 'Home', 'Connection'],
        questions: [
          {
            id: 'peasants_1',
            label: 'How do I lower stress during a busy day?',
            kind: 'stress',
          },
          {
            id: 'peasants_2',
            label: 'How do I improve a relationship without starting conflict?',
            kind: 'relationships',
          },
          {
            id: 'peasants_3',
            label: 'How do I make my space feel more organized?',
            kind: 'clarity',
          },
          {
            id: 'peasants_4',
            label: 'How do I feel better when my energy is very low?',
            kind: 'recovery',
          },
        ],
      },
    ],
    []
  );

  const activeAdvisor = useMemo(
    () => advisors.find((item) => item.id === advisorId) ?? advisors[0],
    [advisors, advisorId]
  );

  const recentHistory = useMemo(() => history.slice(0, 3), [history]);

  const dailyFocus = useMemo(() => {
    const allFocus = [
      'Choose one priority and protect it.',
      'Slow the pace before making a decision.',
      'Complete one unfinished task today.',
      'Listen fully before replying.',
      'Clear one small space around you.',
      'Rest before pushing harder.',
      'Return to the simplest next step.',
      'Review what matters, not what is loudest.',
    ];
    return pickBySeed(allFocus, `${selectedCharacter}_${getTodayKey()}`);
  }, [selectedCharacter]);

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, stage, advisorId]);

  useFocusEffect(
    useCallback(() => {
      setStage('advisorList');
      setAdvisorId('wise');
      setSelectedQuestion(null);
      setAnswerText('');
      return undefined;
    }, [])
  );

  const fade = anim;
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.992, 1],
  });

  const bottomScrollPad = Math.max(0, tabBarH - bottomPad) + (isTinyH ? 12 : 16) + 90;

  const headerTitle = 'Imperial Counsel Hall';

  const saveHistory = async (next: ConsultationRecord[]) => {
    setHistory(next);
    try {
      await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(next));
    } catch {}
  };

  const buildAnswer = useCallback(
    (advisor: Advisor, question: QuestionItem, character: CharacterId) => {
      const toneOpeners: Record<AdvisorId, string[]> = {
        wise: [
          'Begin by noticing what is truly asking for your attention.',
          'Clarity comes when you stop forcing an immediate answer.',
          'The strongest choice is often the one that remains steady over time.',
        ],
        military: [
          'Do not negotiate with delay.',
          'Reduce the problem to a clear objective.',
          'Move first, then refine the plan.',
        ],
        peasants: [
          'Make the next step small and useful.',
          'Start with what is in front of you.',
          'A calmer day is built from simple actions.',
        ],
      };

      const kindBodies: Record<QuestionKind, string[]> = {
        decision: [
          'Write down the two most realistic options and compare their long-term effect.',
          'Pick the path that matches your values, not only your mood.',
          'When everything feels urgent, choose the task that removes the most pressure later.',
        ],
        discipline: [
          'Lower the entry point and begin with ten focused minutes.',
          'Create one rule that is easy to repeat even on low-energy days.',
          'Consistency grows when the first step is obvious and friction is removed.',
        ],
        stress: [
          'Slow your breathing, reduce noise, and handle only one thing at a time.',
          'Do not solve the whole day at once; finish the next visible step.',
          'A short reset can restore more clarity than forcing another hour of tension.',
        ],
        relationships: [
          'Say what you feel clearly and avoid speaking from accusation.',
          'Listen once without interrupting before offering your side.',
          'Protect the relationship first, then solve the disagreement.',
        ],
        purpose: [
          'Notice which actions leave you feeling more grounded after they are done.',
          'Purpose often reveals itself through repeated interest, not sudden certainty.',
          'Follow the work that feels meaningful even when no one is watching.',
        ],
        recovery: [
          'Review what failed without turning it into your identity.',
          'Recover by rebuilding rhythm, not by waiting for perfect energy.',
          'A setback becomes useful when it changes the next plan.',
        ],
        clarity: [
          'Separate facts, fears and assumptions before choosing a direction.',
          'What is true right now matters more than imagined worst-case scenarios.',
          'Clear one mental or physical layer first; clarity often follows action.',
        ],
      };

      const closersByCharacter: Record<CharacterId, string[]> = {
        empress: [
          'Protect your peace while you move forward.',
          'Choose the version of the path that keeps dignity and balance.',
          'Let calm lead, and action follow.',
        ],
        emperor: [
          'Hold your position and act with purpose.',
          'Strength grows when direction is clear.',
          'Lead the next hour well, not just the outcome.',
        ],
      };

      const advisorSignature: Record<AdvisorId, string[]> = {
        wise: [
          'Reflection is not delay when it leads to a truer decision.',
          'The quiet answer is often the durable one.',
        ],
        military: [
          'Execution creates confidence.',
          'Momentum is built by finishing the first move.',
        ],
        peasants: [
          'Useful habits change ordinary days.',
          'Simple steps are often the most reliable ones.',
        ],
      };

      const opener = pickBySeed(
        toneOpeners[advisor.id],
        `${advisor.id}_${question.id}_${character}_opener`
      );
      const body = pickBySeed(
        kindBodies[question.kind],
        `${advisor.id}_${question.id}_${character}_body`
      );
      const closer = pickBySeed(
        closersByCharacter[character],
        `${advisor.id}_${question.id}_${character}_closer`
      );
      const signature = pickBySeed(
        advisorSignature[advisor.id],
        `${advisor.id}_${question.id}_${character}_signature`
      );

      return `${opener} ${body} ${closer} ${signature}`;
    },
    []
  );

  const onSelectAdvisor = (id: AdvisorId) => {
    setAdvisorId(id);
    setSelectedQuestion(null);
    setAnswerText('');
    setStage('questionList');
  };

  const onSelectQuestion = (question: QuestionItem) => {
    if (thinkingTimer.current) {
      clearTimeout(thinkingTimer.current);
    }

    setSelectedQuestion(question);
    setAnswerText('');
    setStage('thinking');

    const finalAnswer = buildAnswer(activeAdvisor, question, selectedCharacter);

    thinkingTimer.current = setTimeout(async () => {
      setAnswerText(finalAnswer);
      setStage('result');

      const entry: ConsultationRecord = {
        id: `${Date.now()}_${question.id}`,
        advisorId: activeAdvisor.id,
        advisorTitle: activeAdvisor.title,
        question: question.label,
        answer: finalAnswer,
        createdAt: Date.now(),
      };

      const nextHistory = [entry, ...history].slice(0, 12);
      await saveHistory(nextHistory);
    }, 900);
  };

  const onBackToAdvisors = () => {
    setStage('advisorList');
    setSelectedQuestion(null);
    setAnswerText('');
  };

  const onTryAnotherQuestion = () => {
    setStage('questionList');
    setSelectedQuestion(null);
    setAnswerText('');
  };

  const onOpenHistoryItem = (item: ConsultationRecord) => {
    const matchAdvisor = advisors.find((a) => a.id === item.advisorId);
    if (!matchAdvisor) return;

    setAdvisorId(matchAdvisor.id);
    setSelectedQuestion({
      id: `history_${item.id}`,
      label: item.question,
      kind: 'clarity',
    });
    setAnswerText(item.answer);
    setStage('result');
  };

  const onShare = async () => {
    try {
      const shareText =
        selectedQuestion && answerText
          ? `${activeAdvisor.title}\n\nQuestion:\n${selectedQuestion.label}\n\nAdvice:\n${answerText}`
          : `${activeAdvisor.title}`;
      await Share.share({ message: shareText });
    } catch {}
  };

  const headerThumbSize = isTinyH ? 50 : isSmallH ? 54 : 60;
  const titleFont = isTinyH ? 15 : 16;
  const dateFont = isTinyH ? 11 : 12;
  const chooseBtnH = isTinyH ? 48 : isSmallH ? 52 : 56;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={{ flex: 1, paddingTop: topPad, paddingBottom: bottomPad }}>
        <View style={[styles.stage, { transform: [{ translateY: contentShiftY + androidDown }] }]}>
          <View style={[styles.headerCard, { width: cardW, height: headerH, marginBottom: gap }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerThumbWrap, { width: headerThumbSize, height: headerThumbSize }]}>
                <Image source={HEADER_IMG} style={styles.headerThumb} resizeMode="cover" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { fontSize: titleFont }]}>{headerTitle}</Text>
                <Text style={[styles.headerDate, { fontSize: dateFont }]}>{dateStr}</Text>
              </View>
            </View>

            <View style={styles.headerDot} />
          </View>

          <Animated.View
            style={{
              width: cardW,
              flex: 1,
              opacity: fade,
              transform: [{ translateY }, { scale }],
            }}
          >
            {stage === 'advisorList' ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: bottomScrollPad }}
              >
                <View style={[styles.focusCard, { marginBottom: gap }]}>
                  <View style={styles.focusTopRow}>
                    <View style={styles.focusAvatarWrap}>
                      <Image source={chosenAvatar} style={styles.focusAvatar} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.focusLabel}>Daily focus</Text>
                      <Text style={styles.focusText}>{dailyFocus}</Text>
                    </View>
                  </View>
                </View>

                {advisors.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectAdvisor(item.id)}
                    style={({ pressed }) => [
                      styles.advisorCard,
                      { marginBottom: gap },
                      pressed && { transform: [{ scale: 0.992 }] },
                    ]}
                  >
                    <View style={styles.advisorImageWrap}>
                      <Image source={item.image} style={styles.advisorImage} resizeMode="cover" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisorTitle}>{item.title}</Text>
                      <Text style={styles.advisorSubtitle}>{item.subtitle}</Text>

                      <View style={styles.tagsRow}>
                        {item.focus.map((tag) => (
                          <View key={tag} style={styles.tagPill}>
                            <Text style={styles.tagPillText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                ))}

                {!!recentHistory.length && (
                  <View style={[styles.historyBlock, { marginTop: 2 }]}>
                    <Text style={styles.sectionTitle}>Recent consultations</Text>

                    {recentHistory.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => onOpenHistoryItem(item)}
                        style={({ pressed }) => [
                          styles.historyItem,
                          pressed && { transform: [{ scale: 0.992 }] },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyAdvisor}>{item.advisorTitle}</Text>
                          <Text style={styles.historyQuestion} numberOfLines={2}>
                            {item.question}
                          </Text>
                          <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: gap }}>
                  <Pressable
                    onPress={onBackToAdvisors}
                    style={({ pressed }) => [
                      styles.backBtn,
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Image source={IC_BACK} style={styles.backIcon} resizeMode="contain" />
                  </Pressable>

                  <View style={styles.selectedAdvisorCard}>
                    <View style={styles.selectedAdvisorImageWrap}>
                      <Image
                        source={activeAdvisor.image}
                        style={styles.selectedAdvisorImage}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedAdvisorTitle} numberOfLines={1}>
                        {activeAdvisor.title}
                      </Text>
                      <Text style={styles.selectedAdvisorSubtitle} numberOfLines={2}>
                        {activeAdvisor.intro}
                      </Text>
                    </View>
                  </View>
                </View>

                {stage === 'questionList' && (
                  <>
                    <View style={[styles.contextCard, { marginBottom: gap }]}>
                      <Text style={styles.contextLabel}>{activeAdvisor.toneLabel}</Text>
                      <Text style={styles.contextBody}>{activeAdvisor.intro}</Text>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: bottomScrollPad }}
                    >
                      {activeAdvisor.questions.map((question) => (
                        <Pressable
                          key={question.id}
                          onPress={() => onSelectQuestion(question)}
                          style={({ pressed }) => [
                            styles.questionCard,
                            pressed && { transform: [{ scale: 0.992 }] },
                          ]}
                        >
                          <View style={styles.questionAvatarWrap}>
                            <Image source={chosenAvatar} style={styles.questionAvatar} resizeMode="contain" />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.questionTitle}>{question.label}</Text>
                            <Text style={styles.questionMeta}>Tap to receive guidance</Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}

                {stage === 'thinking' && (
                  <View style={styles.centerWrap}>
                    <View style={styles.thinkingCard}>
                      <Text style={styles.thinkingTitle}>Preparing your guidance...</Text>
                      <Text style={styles.thinkingSubtitle}>
                        The council is reviewing your question.
                      </Text>
                    </View>
                  </View>
                )}

                {stage === 'result' && (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: bottomScrollPad }}
                  >
                    {!!selectedQuestion && (
                      <View style={[styles.bubbleLeftCard, { marginBottom: gap }]}>
                        <View style={styles.smallAvatarWrap}>
                          <Image source={chosenAvatar} style={styles.smallAvatarImg} resizeMode="contain" />
                        </View>
                        <Text style={styles.bubbleText}>{selectedQuestion.label}</Text>
                      </View>
                    )}

                    <View style={[styles.bubbleRightCard, { marginBottom: gap }]}>
                      <Text style={styles.bubbleText}>{answerText}</Text>
                      <View style={styles.smallAdvisorWrap}>
                        <Image source={activeAdvisor.image} style={styles.smallAdvisorImg} resizeMode="cover" />
                      </View>
                    </View>

                    <View style={[styles.summaryCard, { marginBottom: gap }]}>
                      <Text style={styles.summaryTitle}>Session summary</Text>
                      <Text style={styles.summaryLine}>Advisor: {activeAdvisor.title}</Text>
                      <Text style={styles.summaryLine}>Style: {activeAdvisor.toneLabel}</Text>
                      <Text style={styles.summaryLine}>Date: {dateStr}</Text>
                    </View>

                    <Pressable
                      onPress={onShare}
                      style={({ pressed }) => [
                        styles.goldBtn,
                        { height: chooseBtnH },
                        pressed && { transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <Image source={IC_SHARE} style={styles.goldIcon} resizeMode="contain" />
                      <Text style={styles.goldBtnText}>Share advice</Text>
                    </Pressable>

                    <Pressable
                      onPress={onTryAnotherQuestion}
                      style={({ pressed }) => [
                        styles.outlineBtn,
                        { height: chooseBtnH, marginTop: gap },
                        pressed && { transform: [{ scale: 0.99 }] },
                      ]}
                    >
                      <Text style={styles.outlineBtnText}>Ask another question</Text>
                    </Pressable>
                  </ScrollView>
                )}
              </View>
            )}
          </Animated.View>
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
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerThumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
  },

  headerThumb: {
    width: '100%',
    height: '100%',
  },

  headerTitle: {
    color: '#fff',
    fontWeight: '900',
    lineHeight: 18,
  },

  headerDate: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
  },

  headerDot: {
    position: 'absolute',
    right: 12,
    top: 14,
    width: 10,
    height: 10,
    borderRadius: 99,
    backgroundColor: '#24d35a',
  },

  focusCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    padding: 12,
  },

  focusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  focusAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(120,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    marginRight: 12,
  },

  focusAvatar: {
    width: '100%',
    height: '100%',
  },

  focusLabel: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  focusText: {
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '800',
    fontSize: 14,
    lineHeight: 19,
  },

  advisorCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.32)',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },

  advisorImageWrap: {
    width: 82,
    height: 82,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.32)',
  },

  advisorImage: {
    width: '100%',
    height: '100%',
  },

  advisorTitle: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 4,
  },

  advisorSubtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  tagPillText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '800',
  },

  historyBlock: {
    marginTop: 6,
  },

  sectionTitle: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 10,
  },

  historyItem: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.24)',
    padding: 12,
    marginBottom: 10,
  },

  historyAdvisor: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 13,
    marginBottom: 4,
  },

  historyQuestion: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 18,
  },

  historyDate: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.58)',
    fontWeight: '700',
    fontSize: 11,
  },

  backBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(120,0,0,0.70)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  backIcon: {
    width: 22,
    height: 22,
  },

  selectedAdvisorCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.55)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  selectedAdvisorImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  selectedAdvisorImage: {
    width: '100%',
    height: '100%',
  },

  selectedAdvisorTitle: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 14,
  },

  selectedAdvisorSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 16,
  },

  contextCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.30)',
    padding: 12,
  },

  contextLabel: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  contextBody: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 18,
  },

  questionCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(120,0,0,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.34)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },

  questionAvatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 4,
  },

  questionAvatar: {
    width: '100%',
    height: '100%',
  },

  questionTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },

  questionMeta: {
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '700',
    fontSize: 11,
  },

  centerWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  thinkingCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(120,0,0,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.50)',
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },

  thinkingTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 6,
  },

  thinkingSubtitle: {
    color: 'rgba(255,255,255,0.80)',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  bubbleLeftCard: {
    maxWidth: '92%',
    alignSelf: 'flex-start',
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  bubbleRightCard: {
    maxWidth: '92%',
    alignSelf: 'flex-end',
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  bubbleText: {
    flex: 1,
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 19,
  },

  smallAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    overflow: 'hidden',
  },

  smallAvatarImg: {
    width: '100%',
    height: '100%',
  },

  smallAdvisorWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.35)',
  },

  smallAdvisorImg: {
    width: '100%',
    height: '100%',
  },

  summaryCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(40,0,0,0.56)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.28)',
    padding: 12,
  },

  summaryTitle: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 8,
  },

  summaryLine: {
    color: 'rgba(255,255,255,0.84)',
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 19,
  },

  goldBtn: {
    borderRadius: 999,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  goldIcon: {
    width: 18,
    height: 18,
  },

  goldBtnText: {
    color: '#2b1200',
    fontWeight: '900',
    fontSize: 18,
  },

  outlineBtn: {
    borderRadius: 999,
    backgroundColor: 'rgba(120,0,0,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(245,211,122,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  outlineBtnText: {
    color: GOLD,
    fontWeight: '900',
    fontSize: 17,
  },
});
