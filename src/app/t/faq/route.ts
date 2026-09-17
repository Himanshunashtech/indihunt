import { apiSuccess } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  const faqs = [
    {
      id: 'faq-1',
      category: 'Launching',
      question: 'How do I launch my product on IndiHunt?',
      answer: "Click the 'Launch Product' button in the navbar, paste your product website URL, add your tagline, logos, and screenshots, and submit. You can choose to launch immediately or schedule for a future date.",
    },
    {
      id: 'faq-2',
      category: 'Upvoting & Ranking',
      question: 'How does the daily ranking algorithm work?',
      answer: 'Products are ranked based on organic community upvotes, maker engagement, discussion velocity, and quality feedback scores over a 24-hour window.',
    },
    {
      id: 'faq-3',
      category: 'Streaks & Rewards',
      question: 'What are Maker Streaks?',
      answer: 'Maker Streaks reward active community members who visit, upvote, or engage daily. Maintaining a streak unlocks special profile badges and leaderboard positioning.',
    },
    {
      id: 'faq-4',
      category: 'Shoutouts & Built With',
      question: 'What are Built With Shoutouts?',
      answer: 'When launching a product, you can shout out developer tools, SaaS platforms, or design assets you used to build your launch, helping fellow makers discover great tech stacks.',
    },
  ];

  return apiSuccess(faqs);
}
