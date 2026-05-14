import {
  ArrowLeftRight,
  Building2,
  LayoutDashboard,
  ListChecks,
  TrendingUp,
  Users,
  Video,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Command Center',
    icon: LayoutDashboard,
    description: 'Executive overview',
  },
  {
    to: '/team',
    label: 'Team Profiles',
    icon: Users,
    description: 'People & reporting hierarchy',
  },
  {
    to: '/work',
    label: 'Global Work Tracker',
    icon: ListChecks,
    description: 'All dashboards, agents & workflows',
  },
  {
    to: '/transfers',
    label: 'Work Transfers',
    icon: ArrowLeftRight,
    description: 'Ownership audit trail',
  },
  {
    to: '/clients',
    label: 'Clients',
    icon: Building2,
    description: 'Institutional accounts',
  },
  {
    to: '/meetings',
    label: 'Client Meetings',
    icon: Video,
    description: 'YouTube meeting recordings',
  },
  {
    to: '/workflow',
    label: 'Workflow',
    icon: Workflow,
    description: 'Delivery process map',
  },
  {
    to: '/performance',
    label: 'Performance',
    icon: TrendingUp,
    description: 'Team scorecard & leaderboard',
  },
];
