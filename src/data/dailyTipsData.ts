export type TipCategoryId = 'calm' | 'strength' | 'wisdom' | 'determination';

export type TipCategory = {
  id: TipCategoryId;
  title: string;
  glyphImage: any;
  tips: string[];
};

const GLYPH_CALM = require('../assets/glyph_calm.png');
const GLYPH_STRENGTH = require('../assets/glyph_strength.png');
const GLYPH_WISDOM = require('../assets/glyph_wisdom.png');
const GLYPH_DETERMINATION = require('../assets/glyph_determination.png');

export const TIP_CATEGORIES: TipCategory[] = [
  {
    id: 'calm',
    title: 'Calm',
    glyphImage: GLYPH_CALM,
    tips: [
      'A ruler takes his time. He breathes and sees further.',
      'Silence is a power heard only by the wise.',
      'Pause before responding. In pause, power is born.',
      'One deep breath changes the direction of the day.',
      'Not everything requires a reaction.',
      'Calm is effortless control.',
      'Listen more than you speak.',
      'Slow down to increase clarity.',
      'A decision made in anger rarely serves the throne.',
      'Your strength today is in restraint.',
      'Allow events to unfold without panic.',
      'Choose inner silence over external noise.',
      'Focus on one task.',
      'Small steps are the most stable.',
      'Order begins with a clean desk.',
      'Slow means conscious.',
      'Release tension from your shoulders.',
      'A calm mind sees possibilities.',
      'Today is not a day of struggle, but a day of balance.',
      'Your throne stands strong when you are balanced.',
    ],
  },
  {
    id: 'strength',
    title: 'Strength',
    glyphImage: GLYPH_STRENGTH,
    tips: [
      'Strength is born of discipline.',
      'Do the difficult first.',
      'Do not put off what strengthens you.',
      'Endurance is the mark of a ruler.',
      'Small progress is already a victory.',
      'Your body is your fortress. Take care of it.',
      'Take one more step, even if it is difficult.',
      'Your determination is more important than circumstances.',
      'Difficulty is training for the spirit.',
      'Complete the task completely.',
      'Keep your word, even to yourself.',
      'Fatigue is not an order to stop.',
      'Act without excuses.',
      'Strength grows where there is regularity.',
      'Today you do not give up.',
      'Victory is consistency.',
      'Focus on the result.',
      'Discipline is stronger than motivation.',
      'Get up earlier - win the day.',
      'Your will is your weapon.',
    ],
  },
  {
    id: 'wisdom',
    title: 'Wisdom',
    glyphImage: GLYPH_WISDOM,
    tips: [
      'Before you act - ask why.',
      'Every mistake is a lesson.',
      'Analyze, do not rush.',
      'Look for a long-term result.',
      'Write down your thoughts - they become clearer.',
      'Listen to those who think differently.',
      'Doubt is a tool of the wise.',
      'Choose strategy, not emotion.',
      'Break down the complex into parts.',
      'Think one step ahead.',
      'Not all battles are worth starting.',
      'Knowledge without action is dead.',
      'Ask yourself: what will it give in a year?',
      'Learn at least 10 minutes every day.',
      'Real power is in understanding.',
      'Look at the problem from the other side.',
      'The solution should serve the future.',
      'The wise man does not prove - he understands.',
      'Observe more than evaluate.',
      "Today's choice forms the empire of tomorrow.",
    ],
  },
  {
    id: 'determination',
    title: 'Determination',
    glyphImage: GLYPH_DETERMINATION,
    tips: [
      'Make a decision and do not doubt.',
      'Act immediately after choosing.',
      'Do not seek permission - you are the ruler.',
      'Take the first step now.',
      'Risk is part of greatness.',
      'Clarity is born in movement.',
      'If you have chosen - see it through.',
      'Fear is a signal to move forward.',
      'Today you are brave.',
      'Do not retreat because of uncertainty.',
      'Your path is your responsibility.',
      'Even a small decision has power.',
      'Do not hesitate longer than necessary.',
      'Act quickly, but consciously.',
      'Courage changes destiny.',
      'Determination is stronger than doubt.',
      'Take control in your own hands.',
      'Choose a direction and move.',
      'Leadership begins with an inner “yes.”',
      'Today you create your own path.',
    ],
  },
];

export const DAILY_TASKS: string[] = [
  'Tidy up your workspace.',
  'Complete one task you have been putting off for a long time.',
  'Do some physical activity to strengthen your body.',
];