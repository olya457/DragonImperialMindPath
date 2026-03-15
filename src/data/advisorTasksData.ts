
export type AdvisorId = 'wise' | 'military' | 'peasants';

export type AdvisorQA = {
  question: string;
  answers: string[];
};

export type Advisor = {
  id: AdvisorId;
  title: string;
  subtitle: string;
  image: any;
  qa: AdvisorQA[];
};

const IMG_WISE = require('../assets/advisor_wise.png');
const IMG_MILITARY = require('../assets/advisor_military.png');
const IMG_PEASANTS = require('../assets/advisor_peasants.png');

export const ADVISORS: Advisor[] = [
  {
    id: 'wise',
    title: 'Wise Advisors',
    subtitle: 'Calm guidance for complex decisions and deep questions.',
    image: IMG_WISE,
    qa: [
      {
        question: 'How do I make the right decision in a difficult situation?',
        answers: [
          'Stop and separate emotions from facts.',
          'Think about long-term consequences, not immediate benefits.',
          'Listen to your inner voice after silence.',
          'Compare your choice with your own values.',
          'Choose a path that does not contradict honor.',
        ],
      },
      {
        question: 'How to maintain inner peace in times of anxiety?',
        answers: [
          'Breathe slowly and deeply.',
          'Limit the impact of unnecessary information.',
          'Remember that everything passes.',
          'Focus on what you can control.',
          'Seek silence for at least a few minutes every day.',
        ],
      },
      {
        question: 'What is my true strength and calling?',
        answers: [
          'In what comes easily to you.',
          'In the ability to support others.',
          'In resilience after defeats.',
          'In the desire for knowledge.',
          'In loyalty to your own path.',
        ],
      },
      {
        question: 'How to act wisely when emotions interfere with reason?',
        answers: [
          'Take a pause before answering.',
          'Write down your thoughts.',
          'Look at the situation from the outside.',
          'Talk to someone who is not emotionally involved.',
          'Make decisions only when calm.',
        ],
      },
    ],
  },

  {
    id: 'military',
    title: 'Military Advisors',
    subtitle: 'Direct advice for action, discipline, and determination.',
    image: IMG_MILITARY,
    qa: [
      {
        question: 'What strategy to choose in a difficult conflict?',
        answers: [
          'Assess the strengths of both sides.',
          'Look for a weak spot, not a strong one.',
          'Act unexpectedly.',
          'Protect the rear before the attack.',
          'Do not start a battle without a retreat plan.',
        ],
      },
      {
        question: 'How to strengthen your discipline and endurance?',
        answers: [
          'Keep your promises every day.',
          'Start small and make it more difficult.',
          'Follow a regimen.',
          'Control your words and reactions.',
          'Remember the goal.',
        ],
      },
      {
        question: 'How to act properly under pressure?',
        answers: [
          'Focus on one step.',
          'Don’t give in to the panic of others.',
          'Make quick but thoughtful decisions.',
          'Keep your back straight and your voice calm.',
          'Trust your preparation.',
        ],
      },
      {
        question: 'When to attack and when to retreat?',
        answers: [
          'Attack when you have the advantage.',
          'Retreat if resources are exhausted.',
          'Attack when your opponent doubts.',
          'Retreat to regroup.',
          'Choose an action that saves strength for the future.',
        ],
      },
    ],
  },

  {
    id: 'peasants',
    title: 'Advice from ordinary people',
    subtitle: 'Simple and practical advice for everyday life.',
    image: IMG_PEASANTS,
    qa: [
      {
        question: 'How to improve relationships with loved ones?',
        answers: [
          'Listen more than you speak.',
          'Speak directly, without insults.',
          'Show gratitude for the little things.',
          'Resolve conflicts immediately.',
          'Spend time together without gadgets.',
        ],
      },
      {
        question: 'How to deal with everyday difficulties?',
        answers: [
          'Break the problem into parts.',
          'Plan expenses in advance.',
          'Ask for help if necessary.',
          "Don't put off small tasks.",
          'Take it gradually, without rushing.',
        ],
      },
      {
        question: 'How to find a balance between work and rest?',
        answers: [
          'Set a clear end to the working day.',
          'Plan time for yourself.',
          "Don't take on unnecessary obligations.",
          'Rest without guilt.',
          'Alternate mental and physical activity.',
        ],
      },
      {
        question: 'How to live easier and happier every day?',
        answers: [
          'Appreciate what you already have.',
          'Be happy with small achievements.',
          'Simplify plans and goals.',
          'Surround yourself with good people.',
          'Take care of your health every day.',
        ],
      },
    ],
  },
];