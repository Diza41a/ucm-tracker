import type { HubLinkItem } from '@/src/components/ui/HubLinkCard';

export const LIBRARY_LINKS: HubLinkItem[] = [
  {
    title: 'Card pool',
    subtitle: 'Practice cards',
    description: 'Browse, filter, and manage your typed action cards.',
    icon: 'albums-outline',
    href: '/(tabs)/cards',
  },
  {
    title: 'Stories',
    subtitle: 'Personal stories',
    description: 'Keep story notes and tags ready to link into cards and logs.',
    icon: 'book-outline',
    href: '/(tabs)/stories',
  },
];

export const MORE_LINKS: HubLinkItem[] = [
  {
    title: 'Practice',
    subtitle: 'Social drills',
    description: 'Word association and other conversation warm-ups.',
    icon: 'chatbubbles-outline',
    href: '/(tabs)/practice',
  },
  {
    title: 'Settings',
    subtitle: 'App config',
    description: 'Log templates, user guide, and defaults.',
    icon: 'settings-outline',
    href: '/(tabs)/settings',
  },
];
