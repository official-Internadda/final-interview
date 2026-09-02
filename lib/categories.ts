export const INTERVIEW_CATEGORIES = [
  'Accounting',
  'Administrative',
  'AI & Machine Learning',
  'Business Development',
  'Consulting',
  'Content & Social Media',
  'Customer Service',
  'Data Analytics & Business Intelligence',
  'Digital Marketing & Growth',
  'Finance',
  'HR & Talent Acquisition',
  'Legal',
  'Marketing',
  'Operations',
  'Product',
  'Project Management',
  'Public Relations',
  'Quality Assurance',
  'Research',
  'Sales',
  'Support'
] as const;

export type InterviewCategory = typeof INTERVIEW_CATEGORIES[number];

export const DIFFICULTY_DESCRIPTIONS = {
  easy: {
    label: 'Easy',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    description: 'Generous grading, foundational questions, 50% qualifying bar.'
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    description: 'Tougher follow-ups, strict rubric, heavy deductions for vague answers. 50% bar is genuinely hard to cross.'
  },
  hard: {
    label: 'Hard',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    description: 'Near-expert level questions, minimal partial credit. 50% bar is very difficult to reach.'
  }
};
