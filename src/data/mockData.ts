/**
 * Seed data for Munshot OS.
 * Everything is cross-referenced and internally consistent: transfers match
 * work-item ownership history, recordings match linked work items, timeline
 * events and demo-readiness checklists are generated from each work item.
 *
 * `createSeedData()` returns a fresh deep copy every call so "Reset Mock Data"
 * always starts clean.
 */
import {
  WORKFLOW_STAGES,
  type AppData,
  type ApprovalStatus,
  type Client,
  type ClientFeedbackStatus,
  type ClientMeetingRecording,
  type DemoReadinessItem,
  type Feedback,
  type Meeting,
  type ReviewStatus,
  type StepStatus,
  type Task,
  type TaskStatus,
  type TeamMember,
  type TimelineEvent,
  type TimelineEventType,
  type WorkItem,
  type WorkItemStatus,
  type WorkflowStage,
  type WorkflowStageConfig,
  type WorkTransfer,
} from '@/types';
import { addDays, daysBetween, todayISO } from '@/utils/dates';

let counter = 0;
const seq = (prefix: string): string => `${prefix}-${(++counter).toString(36)}`;

const avatar = (name: string): string =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

const stageIndexOf = (stage: WorkflowStage): number =>
  WORKFLOW_STAGES.indexOf(stage);

/* ------------------------------------------------------------------ */
/* Workflow stage configuration                                       */
/* ------------------------------------------------------------------ */

const STAGE_META: Record<WorkflowStage, { short: string; description: string }> =
  {
    'Client Meeting': {
      short: 'Meeting',
      description: 'Initial client meeting held; raw requirements captured.',
    },
    'Recording Reviewed': {
      short: 'Recording',
      description: 'Meeting recording reviewed by the assigned owner.',
    },
    'Requirement Understood': {
      short: 'Requirement',
      description: 'Requirements distilled into a clear, scoped build brief.',
    },
    'ChatGPT Master Prompt Created': {
      short: 'Master Prompt',
      description: 'Master prompt engineered and validated for the build.',
    },
    'Claude Build Started': {
      short: 'Build Started',
      description: 'Claude Code build kicked off from the master prompt.',
    },
    'Dashboard/Agent Built': {
      short: 'Built',
      description: 'Working dashboard or agent built and self-tested.',
    },
    'Agent Integration Optional': {
      short: 'Agent Integration',
      description: 'Optional Munshot agent integration scoped or wired in.',
    },
    'Team Review': {
      short: 'Team Review',
      description: 'Peer review by the equity research team.',
    },
    'Vipul Approval': {
      short: 'Vipul Approval',
      description: 'Team Lead (Vipul) sign-off before go-live.',
    },
    'Live on Munshot': {
      short: 'Live',
      description: 'Deployed live on the Munshot platform.',
    },
    'Chiraag Review': {
      short: 'Chiraag Review',
      description: 'Founder (Chiraag) review of the live deliverable.',
    },
    'Client Demo': {
      short: 'Demo',
      description: 'Deliverable demoed to the client.',
    },
    'Client Feedback': {
      short: 'Feedback',
      description: 'Client feedback collected and logged.',
    },
    'Improvement Backlog': {
      short: 'Improvements',
      description: 'Feedback converted into a prioritised improvement backlog.',
    },
    'Final Completion': {
      short: 'Completed',
      description: 'All iterations done; deliverable formally completed.',
    },
  };

function buildStages(): WorkflowStageConfig[] {
  return WORKFLOW_STAGES.map((stage, i) => ({
    id: `stage-${i + 1}`,
    stage,
    order: i + 1,
    shortLabel: STAGE_META[stage].short,
    description: STAGE_META[stage].description,
  }));
}

/* ------------------------------------------------------------------ */
/* Team                                                               */
/* ------------------------------------------------------------------ */

const TEAM: TeamMember[] = [
  {
    id: 'tm-chiraag',
    name: 'Chiraag Bhatt',
    role: 'Founder',
    city: 'Mumbai',
    qualification: 'MBA Finance (ISB), CFA Charterholder',
    expertise: ['Equity Strategy', 'Client Relations', 'Research Leadership'],
    photoUrl: avatar('Chiraag Bhatt'),
    joinDate: '2023-01-10',
    reportsToId: null,
    status: 'Active',
    email: 'chiraag@munshot.com',
    phone: '+91 98200 11001',
    bio: 'Founder of Munshot Technologies. Sets research direction, owns key client relationships and runs final founder review on every deliverable.',
  },
  {
    id: 'tm-vipul',
    name: 'Vipul Ranka',
    role: 'Team Lead - Intern',
    city: 'Pune',
    qualification: 'B.Com, CFA Level II Candidate',
    expertise: [
      'Earnings Modelling',
      'Team Review',
      'Agent Integration',
      'Banking & NBFC',
    ],
    photoUrl: avatar('Vipul Ranka'),
    joinDate: '2024-03-04',
    reportsToId: 'tm-chiraag',
    status: 'Active',
    email: 'vipul@munshot.com',
    phone: '+91 98200 11002',
    bio: 'Team Lead for the equity research interns. Runs team review, approves work before it goes live and balances workload across the desk.',
  },
  {
    id: 'tm-aarav',
    name: 'Aarav Mehta',
    role: 'Equity Research Intern',
    city: 'Mumbai',
    qualification: 'BBA Finance, NMIMS',
    expertise: ['Auto & Mobility', 'Python Dashboards', 'Valuation'],
    photoUrl: avatar('Aarav Mehta'),
    joinDate: '2024-07-15',
    reportsToId: 'tm-vipul',
    status: 'Active',
    email: 'aarav@munshot.com',
    phone: '+91 98200 11003',
    bio: 'Covers autos and mobility. Strong on Python-built dashboards and relative valuation work.',
  },
  {
    id: 'tm-diya',
    name: 'Diya Sharma',
    role: 'Equity Research Intern',
    city: 'Bengaluru',
    qualification: 'B.Com, CFA Level I Candidate',
    expertise: ['Mutual Fund Flows', 'Ownership Data', 'Dashboards'],
    photoUrl: avatar('Diya Sharma'),
    joinDate: '2024-09-02',
    reportsToId: 'tm-vipul',
    status: 'Active',
    email: 'diya@munshot.com',
    phone: '+91 98200 11004',
    bio: 'Fund flows and ownership-data specialist. Has shipped the most live dashboards on the desk.',
  },
  {
    id: 'tm-kabir',
    name: 'Kabir Nair',
    role: 'Equity Research Intern',
    city: 'New Delhi',
    qualification: 'Economics (Hons), Delhi University',
    expertise: ['Defense & Aerospace', 'Metals & Mining', 'Thematic Research'],
    photoUrl: avatar('Kabir Nair'),
    joinDate: '2024-11-11',
    reportsToId: 'tm-vipul',
    status: 'Active',
    email: 'kabir@munshot.com',
    phone: '+91 98200 11005',
    bio: 'Thematic research across defense and metals. Builds top-down theme trackers.',
  },
  {
    id: 'tm-ananya',
    name: 'Ananya Iyer',
    role: 'Equity Research Intern',
    city: 'Chennai',
    qualification: 'CA Inter, B.Com',
    expertise: ['Earnings Analysis', 'Banking & NBFC', 'Agent Integration'],
    photoUrl: avatar('Ananya Iyer'),
    joinDate: '2025-01-20',
    reportsToId: 'tm-vipul',
    status: 'Active',
    email: 'ananya@munshot.com',
    phone: '+91 98200 11006',
    bio: 'Banking and NBFC earnings analyst. Works closely with Vipul on agent integration.',
  },
  {
    id: 'tm-rohan',
    name: 'Rohan Desai',
    role: 'Equity Research Intern',
    city: 'Ahmedabad',
    qualification: 'BBA, Nirma University',
    expertise: ['Commodities', 'Sector Rotation', 'Data Visualisation'],
    photoUrl: avatar('Rohan Desai'),
    joinDate: '2025-02-17',
    reportsToId: 'tm-vipul',
    status: 'Active',
    email: 'rohan@munshot.com',
    phone: '+91 98200 11007',
    bio: 'Commodities and sector-rotation focus. Strong data-visualisation instincts.',
  },
  {
    id: 'tm-ishaan',
    name: 'Ishaan Reddy',
    role: 'Equity Research Intern',
    city: 'Hyderabad',
    qualification: 'B.Tech (CSE) + Finance Minor',
    expertise: [
      'Agent Engineering',
      'NLP / Earnings Calls',
      'Workflow Automation',
    ],
    photoUrl: avatar('Ishaan Reddy'),
    joinDate: '2025-04-07',
    reportsToId: 'tm-vipul',
    status: 'Active',
    email: 'ishaan@munshot.com',
    phone: '+91 98200 11008',
    bio: 'Newest joiner. Engineers Munshot agents and NLP pipelines for earnings calls.',
  },
];

/* ------------------------------------------------------------------ */
/* Clients                                                            */
/* ------------------------------------------------------------------ */

const CLIENTS: Client[] = [
  {
    id: 'cl-meridian',
    name: 'Meridian Capital Partners',
    address: 'Marina Bay Financial Centre, Tower 2, Level 39',
    city: 'Singapore',
    pointOfContact: 'Daniel Koh',
    pocEmail: 'd.koh@meridiancap.com',
    pocPhone: '+65 6011 2200',
    logoUrl: avatar('Meridian Capital'),
    status: 'Active',
    notes: 'Long/short equity hedge fund. Fast-moving desk, expects rapid iteration.',
    importanceScore: 9,
  },
  {
    id: 'cl-aravali',
    name: 'Aravali Asset Management',
    address: '14th Floor, Nariman Point',
    city: 'Mumbai',
    pointOfContact: 'Sneha Kulkarni',
    pocEmail: 'sneha.k@aravaliamc.in',
    pocPhone: '+91 22 6655 4400',
    logoUrl: avatar('Aravali AMC'),
    status: 'Active',
    notes: 'Domestic mutual fund house. Flagship account — strong dashboard pipeline.',
    importanceScore: 8,
  },
  {
    id: 'cl-blackwood',
    name: 'Blackwood Private Equity',
    address: 'One BKC, Bandra Kurla Complex',
    city: 'Mumbai',
    pointOfContact: 'Rishi Malhotra',
    pocEmail: 'rishi@blackwoodpe.com',
    pocPhone: '+91 22 4488 1100',
    logoUrl: avatar('Blackwood PE'),
    status: 'Active',
    notes: 'Private equity firm. Heavy on thematic and supply-chain research.',
    importanceScore: 7,
  },
  {
    id: 'cl-sundaram',
    name: 'Sundaram Pension & Retirement Fund',
    address: 'Anna Salai, Mount Road',
    city: 'Chennai',
    pointOfContact: 'Lakshmi Narayanan',
    pocEmail: 'lakshmi.n@sundarampension.in',
    pocPhone: '+91 44 2233 6677',
    logoUrl: avatar('Sundaram Pension'),
    status: 'Active',
    notes: 'Retirement fund. Cares about flows, asset quality and risk monitoring.',
    importanceScore: 6,
  },
  {
    id: 'cl-nordic',
    name: 'Nordic Sovereign Advisors',
    address: 'Aker Brygge, Tjuvholmen',
    city: 'Oslo',
    pointOfContact: 'Erik Lundgren',
    pocEmail: 'erik.lundgren@nordicsov.no',
    pocPhone: '+47 21 00 44 80',
    logoUrl: avatar('Nordic Sovereign'),
    status: 'Active',
    notes: 'Sovereign wealth advisory. High-importance, rigorous review standards.',
    importanceScore: 9,
  },
  {
    id: 'cl-greenoak',
    name: 'Greenoak Family Office',
    address: 'Lavelle Road',
    city: 'Bengaluru',
    pointOfContact: 'Meera Pai',
    pocEmail: 'meera@greenoakfo.com',
    pocPhone: '+91 80 4567 8900',
    logoUrl: avatar('Greenoak FO'),
    status: 'Prospect',
    notes: 'Family office in onboarding. Early-stage scoping of first deliverables.',
    importanceScore: 5,
  },
];

/* ------------------------------------------------------------------ */
/* Work items (compact specs → full entities)                          */
/* ------------------------------------------------------------------ */

interface WiSpec {
  id: string;
  title: string;
  type: WorkItem['type'];
  clientId: string;
  ownerId: string;
  originalOwnerId: string;
  stage: WorkflowStage;
  status: WorkItemStatus;
  priority: WorkItem['priority'];
  progress: number;
  startDate: string;
  dueDate: string;
  completionDate: string | null;
  agentIntegrationRequired: boolean;
  description: string;
  updatedAt: string;
  previousOwnerIds?: string[];
  transferHistoryIds?: string[];
  hasPendingTransfer?: boolean;
  vipulApprovalStatus?: ApprovalStatus;
  chiraagReviewStatus?: ReviewStatus;
  clientFeedbackStatus?: ClientFeedbackStatus;
  links?: WorkItem['links'];
}

const WI_SPECS: WiSpec[] = [
  {
    id: 'wi-amc',
    title: 'AMC Dashboard',
    type: 'Dashboard',
    clientId: 'cl-aravali',
    ownerId: 'tm-diya',
    originalOwnerId: 'tm-diya',
    stage: 'Final Completion',
    status: 'Completed',
    priority: 'High',
    progress: 100,
    startDate: '2025-11-05',
    dueDate: '2026-01-15',
    completionDate: '2026-01-12',
    agentIntegrationRequired: false,
    description:
      "Live AUM, scheme flows and expense-ratio dashboard for Aravali's mutual fund desk.",
    updatedAt: '2026-01-12T11:00:00.000Z',
    links: [{ label: 'Live on Munshot', url: 'https://app.munshot.com/amc' }],
  },
  {
    id: 'wi-pv',
    title: 'PV Dashboard',
    type: 'Dashboard',
    clientId: 'cl-meridian',
    ownerId: 'tm-diya',
    originalOwnerId: 'tm-aarav',
    stage: 'Client Demo',
    status: 'Live',
    priority: 'High',
    progress: 88,
    startDate: '2025-12-01',
    dueDate: '2026-05-25',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      "Passenger-vehicle volumes, channel inventory and demand tracker for Meridian's auto coverage.",
    updatedAt: '2026-05-09T09:30:00.000Z',
    previousOwnerIds: ['tm-aarav'],
    transferHistoryIds: ['wt-1'],
    clientFeedbackStatus: 'Received',
  },
  {
    id: 'wi-ownership',
    title: 'Ownership Signal Dashboard',
    type: 'Dashboard',
    clientId: 'cl-nordic',
    ownerId: 'tm-diya',
    originalOwnerId: 'tm-diya',
    stage: 'Improvement Backlog',
    status: 'Live',
    priority: 'Critical',
    progress: 92,
    startDate: '2025-11-20',
    dueDate: '2026-05-30',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'FII / DII / promoter ownership-shift signal dashboard flagging accumulation and distribution.',
    updatedAt: '2026-05-11T14:10:00.000Z',
  },
  {
    id: 'wi-dhamma',
    title: 'Dhamma Earnings Dashboard',
    type: 'Dashboard',
    clientId: 'cl-aravali',
    ownerId: 'tm-ananya',
    originalOwnerId: 'tm-ananya',
    stage: 'Chiraag Review',
    status: 'In Review',
    priority: 'High',
    progress: 90,
    startDate: '2025-12-10',
    dueDate: '2026-05-12',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Quarterly earnings beat/miss dashboard with consensus deltas for the Dhamma portfolio.',
    updatedAt: '2026-05-10T16:45:00.000Z',
    chiraagReviewStatus: 'Pending',
  },
  {
    id: 'wi-airdefense',
    title: 'Air Defense Theme Tracker',
    type: 'Dashboard',
    clientId: 'cl-blackwood',
    ownerId: 'tm-ishaan',
    originalOwnerId: 'tm-kabir',
    stage: 'Live on Munshot',
    status: 'Live',
    priority: 'Medium',
    progress: 85,
    startDate: '2025-12-15',
    dueDate: '2026-06-05',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Thematic tracker for the air defense and aerospace order pipeline.',
    updatedAt: '2026-05-06T10:20:00.000Z',
    previousOwnerIds: ['tm-kabir'],
    transferHistoryIds: ['wt-7'],
  },
  {
    id: 'wi-aluminum',
    title: 'Aluminum Scarcity Monitor',
    type: 'Dashboard',
    clientId: 'cl-blackwood',
    ownerId: 'tm-rohan',
    originalOwnerId: 'tm-kabir',
    stage: 'Team Review',
    status: 'In Review',
    priority: 'Medium',
    progress: 78,
    startDate: '2026-01-08',
    dueDate: '2026-04-10',
    completionDate: null,
    agentIntegrationRequired: false,
    description: 'Supply-deficit and cost-curve monitor for the aluminium complex.',
    updatedAt: '2026-05-08T12:00:00.000Z',
    previousOwnerIds: ['tm-kabir'],
    transferHistoryIds: ['wt-2'],
  },
  {
    id: 'wi-sip',
    title: 'SIP Flow Dashboard',
    type: 'Dashboard',
    clientId: 'cl-sundaram',
    ownerId: 'tm-ananya',
    originalOwnerId: 'tm-ananya',
    stage: 'Claude Build Started',
    status: 'In Progress',
    priority: 'High',
    progress: 45,
    startDate: '2026-02-01',
    dueDate: '2026-05-25',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      "Monthly SIP inflow and folio-growth dashboard for Sundaram's retirement desk.",
    updatedAt: '2026-05-12T08:15:00.000Z',
    transferHistoryIds: ['wt-3'],
    hasPendingTransfer: true,
  },
  {
    id: 'wi-portfoliorisk',
    title: 'Client Portfolio Risk Agent',
    type: 'Agent',
    clientId: 'cl-meridian',
    ownerId: 'tm-ishaan',
    originalOwnerId: 'tm-ishaan',
    stage: 'Agent Integration Optional',
    status: 'In Progress',
    priority: 'Critical',
    progress: 62,
    startDate: '2026-01-20',
    dueDate: '2026-05-16',
    completionDate: null,
    agentIntegrationRequired: true,
    description:
      'Agent that scores portfolio concentration, drawdown and factor risk on demand.',
    updatedAt: '2026-05-13T07:40:00.000Z',
  },
  {
    id: 'wi-fundops',
    title: 'Fund Ops Transmission Map',
    type: 'Workflow',
    clientId: 'cl-nordic',
    ownerId: 'tm-ishaan',
    originalOwnerId: 'tm-ananya',
    stage: 'Vipul Approval',
    status: 'In Review',
    priority: 'High',
    progress: 80,
    startDate: '2025-12-22',
    dueDate: '2026-04-28',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Workflow mapping fund-operations cash and instruction transmission across custodians.',
    updatedAt: '2026-05-07T13:25:00.000Z',
    previousOwnerIds: ['tm-ananya'],
    transferHistoryIds: ['wt-6'],
    vipulApprovalStatus: 'Pending',
  },
  {
    id: 'wi-shareholding',
    title: 'Shareholding Pattern Dashboard',
    type: 'Dashboard',
    clientId: 'cl-aravali',
    ownerId: 'tm-aarav',
    originalOwnerId: 'tm-rohan',
    stage: 'Dashboard/Agent Built',
    status: 'In Progress',
    priority: 'Medium',
    progress: 70,
    startDate: '2026-01-15',
    dueDate: '2026-05-29',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Quarter-on-quarter shareholding-pattern dashboard with category drill-downs.',
    updatedAt: '2026-05-12T15:50:00.000Z',
    previousOwnerIds: ['tm-rohan', 'tm-diya'],
    transferHistoryIds: ['wt-5a', 'wt-5b'],
  },
  {
    id: 'wi-earningscall',
    title: 'Earnings Call Analyzer Agent',
    type: 'Agent',
    clientId: 'cl-meridian',
    ownerId: 'tm-ishaan',
    originalOwnerId: 'tm-ishaan',
    stage: 'ChatGPT Master Prompt Created',
    status: 'In Progress',
    priority: 'High',
    progress: 35,
    startDate: '2026-02-20',
    dueDate: '2026-05-10',
    completionDate: null,
    agentIntegrationRequired: true,
    description:
      'NLP agent that summarises earnings calls and extracts guidance changes.',
    updatedAt: '2026-05-11T09:05:00.000Z',
    transferHistoryIds: ['wt-4'],
  },
  {
    id: 'wi-sectorrotation',
    title: 'Sector Rotation Monitor',
    type: 'Dashboard',
    clientId: 'cl-greenoak',
    ownerId: 'tm-rohan',
    originalOwnerId: 'tm-rohan',
    stage: 'Requirement Understood',
    status: 'In Progress',
    priority: 'Low',
    progress: 22,
    startDate: '2026-03-10',
    dueDate: '2026-06-15',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Relative-strength sector-rotation monitor with momentum scoring.',
    updatedAt: '2026-05-04T11:30:00.000Z',
  },
  {
    id: 'wi-fiidii',
    title: 'FII/DII Flow Tracker',
    type: 'Dashboard',
    clientId: 'cl-sundaram',
    ownerId: 'tm-diya',
    originalOwnerId: 'tm-diya',
    stage: 'Client Feedback',
    status: 'Live',
    priority: 'Medium',
    progress: 95,
    startDate: '2025-11-28',
    dueDate: '2026-05-18',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Daily FII / DII cash and F&O flow tracker with trend overlays.',
    updatedAt: '2026-05-13T10:00:00.000Z',
    clientFeedbackStatus: 'Received',
  },
  {
    id: 'wi-pledge',
    title: 'Promoter Pledge Monitor',
    type: 'Dashboard',
    clientId: 'cl-blackwood',
    ownerId: 'tm-kabir',
    originalOwnerId: 'tm-kabir',
    stage: 'Claude Build Started',
    status: 'Blocked',
    priority: 'High',
    progress: 50,
    startDate: '2026-01-25',
    dueDate: '2026-05-08',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Promoter share-pledge monitor with alert thresholds — blocked on data-feed access.',
    updatedAt: '2026-05-09T17:20:00.000Z',
  },
  {
    id: 'wi-quarterly',
    title: 'Quarterly Results Workflow',
    type: 'Workflow',
    clientId: 'cl-aravali',
    ownerId: 'tm-vipul',
    originalOwnerId: 'tm-vipul',
    stage: 'Team Review',
    status: 'In Review',
    priority: 'Medium',
    progress: 75,
    startDate: '2026-01-30',
    dueDate: '2026-05-22',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Standardised quarterly-results coverage workflow across the research desk.',
    updatedAt: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'wi-blockdeal',
    title: 'Block Deal Scanner Agent',
    type: 'Agent',
    clientId: 'cl-meridian',
    ownerId: 'tm-kabir',
    originalOwnerId: 'tm-diya',
    stage: 'Claude Build Started',
    status: 'In Progress',
    priority: 'Medium',
    progress: 48,
    startDate: '2026-02-12',
    dueDate: '2026-05-02',
    completionDate: null,
    agentIntegrationRequired: true,
    description:
      'Agent scanning exchange block and bulk-deal feeds for actionable signals.',
    updatedAt: '2026-05-08T14:35:00.000Z',
    previousOwnerIds: ['tm-diya'],
    transferHistoryIds: ['wt-9'],
  },
  {
    id: 'wi-insider',
    title: 'Insider Trading Signal Agent',
    type: 'Agent',
    clientId: 'cl-nordic',
    ownerId: 'tm-ananya',
    originalOwnerId: 'tm-ananya',
    stage: 'Recording Reviewed',
    status: 'Not Started',
    priority: 'High',
    progress: 8,
    startDate: '2026-04-20',
    dueDate: '2026-07-01',
    completionDate: null,
    agentIntegrationRequired: true,
    description:
      'Agent flagging insider / SAST disclosures with materiality scoring.',
    updatedAt: '2026-05-02T10:10:00.000Z',
  },
  {
    id: 'wi-bankasset',
    title: 'Bank Asset Quality Dashboard',
    type: 'Dashboard',
    clientId: 'cl-sundaram',
    ownerId: 'tm-aarav',
    originalOwnerId: 'tm-aarav',
    stage: 'Agent Integration Optional',
    status: 'In Progress',
    priority: 'High',
    progress: 58,
    startDate: '2026-02-05',
    dueDate: '2026-05-20',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Asset-quality, slippage and provisioning dashboard for the banking universe.',
    updatedAt: '2026-05-12T16:00:00.000Z',
    transferHistoryIds: ['wt-8'],
    hasPendingTransfer: true,
  },
  {
    id: 'wi-commodity',
    title: 'Commodity Cost Curve Dashboard',
    type: 'Dashboard',
    clientId: 'cl-blackwood',
    ownerId: 'tm-ananya',
    originalOwnerId: 'tm-rohan',
    stage: 'Vipul Approval',
    status: 'In Review',
    priority: 'Medium',
    progress: 82,
    startDate: '2026-01-12',
    dueDate: '2026-04-08',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Cross-commodity cost-curve dashboard for the metals and mining desk.',
    updatedAt: '2026-05-05T11:15:00.000Z',
    previousOwnerIds: ['tm-rohan'],
    transferHistoryIds: ['wt-10'],
    vipulApprovalStatus: 'Pending',
  },
  {
    id: 'wi-valuation',
    title: 'Valuation Comps Builder',
    type: 'Dashboard',
    clientId: 'cl-greenoak',
    ownerId: 'tm-aarav',
    originalOwnerId: 'tm-aarav',
    stage: 'Client Meeting',
    status: 'Not Started',
    priority: 'Low',
    progress: 0,
    startDate: '2026-05-01',
    dueDate: '2026-07-20',
    completionDate: null,
    agentIntegrationRequired: false,
    description:
      'Reusable valuation-comps builder with sector multiple benchmarking.',
    updatedAt: '2026-05-01T09:00:00.000Z',
  },
  {
    id: 'wi-mgmtcommentary',
    title: 'Management Commentary Tracker Agent',
    type: 'Agent',
    clientId: 'cl-meridian',
    ownerId: 'tm-ishaan',
    originalOwnerId: 'tm-ishaan',
    stage: 'Final Completion',
    status: 'Completed',
    priority: 'Medium',
    progress: 100,
    startDate: '2025-10-15',
    dueDate: '2025-12-20',
    completionDate: '2025-12-26',
    agentIntegrationRequired: true,
    description:
      'Agent tracking management-commentary tone and guidance across quarters.',
    updatedAt: '2025-12-26T10:00:00.000Z',
  },
  {
    id: 'wi-esg',
    title: 'ESG Scoring Dashboard',
    type: 'Dashboard',
    clientId: 'cl-sundaram',
    ownerId: 'tm-rohan',
    originalOwnerId: 'tm-rohan',
    stage: 'Final Completion',
    status: 'Completed',
    priority: 'Medium',
    progress: 100,
    startDate: '2025-10-20',
    dueDate: '2025-12-15',
    completionDate: '2025-12-14',
    agentIntegrationRequired: false,
    description:
      'ESG scoring dashboard blending disclosure, controversy and trend signals.',
    updatedAt: '2025-12-14T12:00:00.000Z',
  },
  {
    id: 'wi-ipo',
    title: 'IPO Pipeline Tracker',
    type: 'Dashboard',
    clientId: 'cl-greenoak',
    ownerId: 'tm-kabir',
    originalOwnerId: 'tm-kabir',
    stage: 'Final Completion',
    status: 'Completed',
    priority: 'Low',
    progress: 100,
    startDate: '2025-11-10',
    dueDate: '2026-01-05',
    completionDate: '2026-01-10',
    agentIntegrationRequired: false,
    description:
      'IPO and pre-IPO pipeline tracker with anchor and subscription data.',
    updatedAt: '2026-01-10T15:00:00.000Z',
  },
  {
    id: 'wi-currency',
    title: 'Currency Exposure Monitor',
    type: 'Dashboard',
    clientId: 'cl-nordic',
    ownerId: 'tm-aarav',
    originalOwnerId: 'tm-aarav',
    stage: 'Final Completion',
    status: 'Completed',
    priority: 'Medium',
    progress: 100,
    startDate: '2025-12-01',
    dueDate: '2026-02-01',
    completionDate: '2026-01-28',
    agentIntegrationRequired: false,
    description:
      'Currency exposure and hedging monitor for cross-border portfolios.',
    updatedAt: '2026-01-28T11:30:00.000Z',
  },
];

function deriveStepStatus(reached: boolean, current: boolean): StepStatus {
  if (reached) return 'Done';
  if (current) return 'In Progress';
  return 'Not Started';
}

function buildWorkItem(spec: WiSpec): WorkItem {
  const idx = stageIndexOf(spec.stage);
  const promptIdx = stageIndexOf('ChatGPT Master Prompt Created');
  const buildIdx = stageIndexOf('Claude Build Started');
  const builtIdx = stageIndexOf('Dashboard/Agent Built');
  const integrationIdx = stageIndexOf('Agent Integration Optional');
  const vipulIdx = stageIndexOf('Vipul Approval');
  const chiraagIdx = stageIndexOf('Chiraag Review');
  const feedbackIdx = stageIndexOf('Client Feedback');

  const agentIntegrationStatus: StepStatus = !spec.agentIntegrationRequired
    ? 'Not Required'
    : deriveStepStatus(idx > integrationIdx, idx === integrationIdx);

  const vipulApprovalStatus: ApprovalStatus =
    spec.vipulApprovalStatus ?? (idx > vipulIdx ? 'Approved' : 'Pending');
  const chiraagReviewStatus: ReviewStatus =
    spec.chiraagReviewStatus ?? (idx > chiraagIdx ? 'Reviewed' : 'Pending');
  const clientFeedbackStatus: ClientFeedbackStatus =
    spec.clientFeedbackStatus ??
    (idx > feedbackIdx
      ? 'Addressed'
      : idx === feedbackIdx
        ? 'Received'
        : idx >= stageIndexOf('Client Demo')
          ? 'Pending'
          : 'No Feedback Yet');

  return {
    id: spec.id,
    title: spec.title,
    type: spec.type,
    clientId: spec.clientId,
    ownerId: spec.ownerId,
    originalOwnerId: spec.originalOwnerId,
    previousOwnerIds: spec.previousOwnerIds ?? [],
    transferHistoryIds: spec.transferHistoryIds ?? [],
    linkedMeetingRecordingIds: [],
    hasPendingTransfer: spec.hasPendingTransfer ?? false,
    priority: spec.priority,
    currentStage: spec.stage,
    status: spec.status,
    startDate: spec.startDate,
    dueDate: spec.dueDate,
    completionDate: spec.completionDate,
    progress: spec.progress,
    description: spec.description,
    chatgptPromptStatus: deriveStepStatus(idx > promptIdx, idx === promptIdx),
    claudeBuildStatus: deriveStepStatus(
      idx > buildIdx,
      idx === buildIdx || idx === builtIdx,
    ),
    agentIntegrationRequired: spec.agentIntegrationRequired,
    agentIntegrationStatus,
    vipulApprovalStatus,
    chiraagReviewStatus,
    clientFeedbackStatus,
    improvementCount: 0,
    links: spec.links ?? [],
    createdAt: `${spec.startDate}T09:00:00.000Z`,
    updatedAt: spec.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* Work transfers                                                     */
/* ------------------------------------------------------------------ */

const TRANSFERS: WorkTransfer[] = [
  {
    id: 'wt-1',
    workItemId: 'wi-pv',
    fromOwnerId: 'tm-aarav',
    toOwnerId: 'tm-diya',
    requestedById: 'tm-vipul',
    approvedById: 'tm-vipul',
    transferDate: '2026-01-10',
    reason: 'Workload Balancing',
    notes: 'Aarav was carrying three auto dashboards; moved PV to Diya to balance the desk.',
    status: 'Completed',
    createdAt: '2026-01-08T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'wt-2',
    workItemId: 'wi-aluminum',
    fromOwnerId: 'tm-kabir',
    toOwnerId: 'tm-rohan',
    requestedById: 'tm-kabir',
    approvedById: 'tm-vipul',
    transferDate: '2026-02-15',
    reason: 'Expertise Fit',
    notes: 'Rohan owns the commodities cost-curve work — better fit for the aluminium monitor.',
    status: 'Completed',
    createdAt: '2026-02-12T09:30:00.000Z',
    updatedAt: '2026-02-15T09:30:00.000Z',
  },
  {
    id: 'wt-3',
    workItemId: 'wi-sip',
    fromOwnerId: 'tm-ananya',
    toOwnerId: 'tm-diya',
    requestedById: 'tm-vipul',
    approvedById: null,
    transferDate: '2026-05-12',
    reason: 'Deadline Pressure',
    notes: 'SIP dashboard is behind; proposing a move to Diya who has fund-flow context. Awaiting approval.',
    status: 'Pending',
    createdAt: '2026-05-12T08:00:00.000Z',
    updatedAt: '2026-05-12T08:00:00.000Z',
  },
  {
    id: 'wt-4',
    workItemId: 'wi-earningscall',
    fromOwnerId: 'tm-ishaan',
    toOwnerId: 'tm-kabir',
    requestedById: 'tm-ishaan',
    approvedById: null,
    transferDate: '2026-04-18',
    reason: 'Workload Balancing',
    notes: 'Rejected — Ishaan is the agent specialist and Kabir is already loaded on thematic work.',
    status: 'Rejected',
    createdAt: '2026-04-16T11:00:00.000Z',
    updatedAt: '2026-04-18T11:00:00.000Z',
  },
  {
    id: 'wt-5a',
    workItemId: 'wi-shareholding',
    fromOwnerId: 'tm-rohan',
    toOwnerId: 'tm-diya',
    requestedById: 'tm-vipul',
    approvedById: 'tm-vipul',
    transferDate: '2026-02-20',
    reason: 'Expertise Fit',
    notes: 'Moved to Diya for ownership-data expertise during the build phase.',
    status: 'Completed',
    createdAt: '2026-02-18T10:00:00.000Z',
    updatedAt: '2026-02-20T10:00:00.000Z',
  },
  {
    id: 'wt-5b',
    workItemId: 'wi-shareholding',
    fromOwnerId: 'tm-diya',
    toOwnerId: 'tm-aarav',
    requestedById: 'tm-vipul',
    approvedById: 'tm-vipul',
    transferDate: '2026-04-05',
    reason: 'Workload Balancing',
    notes: 'Diya picked up two live dashboards; shareholding dashboard moved to Aarav to finish.',
    status: 'Completed',
    createdAt: '2026-04-03T09:00:00.000Z',
    updatedAt: '2026-04-05T09:00:00.000Z',
  },
  {
    id: 'wt-6',
    workItemId: 'wi-fundops',
    fromOwnerId: 'tm-ananya',
    toOwnerId: 'tm-ishaan',
    requestedById: 'tm-vipul',
    approvedById: 'tm-vipul',
    transferDate: '2026-04-22',
    reason: 'Expertise Fit',
    notes: 'Workflow automation is Ishaan’s strength — approved, ownership moved for the review push.',
    status: 'Approved',
    createdAt: '2026-04-20T10:30:00.000Z',
    updatedAt: '2026-04-22T10:30:00.000Z',
  },
  {
    id: 'wt-7',
    workItemId: 'wi-airdefense',
    fromOwnerId: 'tm-kabir',
    toOwnerId: 'tm-ishaan',
    requestedById: 'tm-vipul',
    approvedById: 'tm-vipul',
    transferDate: '2026-03-15',
    reason: 'Client-Specific Knowledge',
    notes: 'Ishaan joined Blackwood’s defense calls — moved for client-specific context.',
    status: 'Completed',
    createdAt: '2026-03-13T09:00:00.000Z',
    updatedAt: '2026-03-15T09:00:00.000Z',
  },
  {
    id: 'wt-8',
    workItemId: 'wi-bankasset',
    fromOwnerId: 'tm-aarav',
    toOwnerId: 'tm-diya',
    requestedById: 'tm-aarav',
    approvedById: null,
    transferDate: '2026-05-13',
    reason: 'Member Unavailable',
    notes: 'Aarav is on leave next week; proposing temporary handover to Diya. Pending approval.',
    status: 'Pending',
    createdAt: '2026-05-13T12:00:00.000Z',
    updatedAt: '2026-05-13T12:00:00.000Z',
  },
  {
    id: 'wt-9',
    workItemId: 'wi-blockdeal',
    fromOwnerId: 'tm-diya',
    toOwnerId: 'tm-kabir',
    requestedById: 'tm-vipul',
    approvedById: 'tm-vipul',
    transferDate: '2026-03-28',
    reason: 'Skill Development',
    notes: 'Good agent-build exposure for Kabir — moved with Ishaan supporting.',
    status: 'Completed',
    createdAt: '2026-03-26T10:00:00.000Z',
    updatedAt: '2026-03-28T10:00:00.000Z',
  },
  {
    id: 'wt-10',
    workItemId: 'wi-commodity',
    fromOwnerId: 'tm-rohan',
    toOwnerId: 'tm-ananya',
    requestedById: 'tm-vipul',
    approvedById: 'tm-vipul',
    transferDate: '2026-03-30',
    reason: 'Workload Balancing',
    notes: 'Rohan took on the sector-rotation build; commodity dashboard moved to Ananya for the approval push.',
    status: 'Completed',
    createdAt: '2026-03-28T09:00:00.000Z',
    updatedAt: '2026-03-30T09:00:00.000Z',
  },
];

/* ------------------------------------------------------------------ */
/* Client meeting recordings (YouTube)                                 */
/* ------------------------------------------------------------------ */

const RECORDINGS: ClientMeetingRecording[] = [
  {
    id: 'rec-1',
    title: 'Meridian — PV Dashboard Requirement Call',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    clientId: 'cl-meridian',
    ownerId: 'tm-aarav',
    meetingDate: '2025-12-02',
    meetingType: 'Client Meeting',
    notes: 'Daniel walked through the channel-inventory and demand-tracking asks for the PV dashboard.',
    linkedWorkItemIds: ['wi-pv'],
    createdAt: '2025-12-02T15:00:00.000Z',
    updatedAt: '2025-12-02T15:00:00.000Z',
  },
  {
    id: 'rec-2',
    title: 'Aravali — AMC Dashboard Demo',
    youtubeUrl: 'https://youtu.be/9bZkp7q19f0',
    clientId: 'cl-aravali',
    ownerId: 'tm-diya',
    meetingDate: '2026-01-09',
    meetingType: 'Demo',
    notes: 'Demoed the live AMC dashboard to Sneha and the fund desk — well received.',
    linkedWorkItemIds: ['wi-amc'],
    createdAt: '2026-01-09T11:00:00.000Z',
    updatedAt: '2026-01-09T11:00:00.000Z',
  },
  {
    id: 'rec-3',
    title: 'Nordic — Ownership Signal Feedback Call',
    youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    clientId: 'cl-nordic',
    ownerId: 'tm-diya',
    meetingDate: '2026-04-28',
    meetingType: 'Feedback Call',
    notes: 'Erik asked for promoter-pledge overlay and a weekly digest export.',
    linkedWorkItemIds: ['wi-ownership'],
    createdAt: '2026-04-28T14:30:00.000Z',
    updatedAt: '2026-04-28T14:30:00.000Z',
  },
  {
    id: 'rec-4',
    title: 'Blackwood — Air Defense Theme Kickoff',
    youtubeUrl: 'https://youtu.be/JGwWNGJdvx8',
    clientId: 'cl-blackwood',
    ownerId: 'tm-kabir',
    meetingDate: '2025-12-16',
    meetingType: 'Client Meeting',
    notes: 'Rishi outlined the air-defense order-pipeline tracker and the aluminium scarcity monitor.',
    linkedWorkItemIds: ['wi-airdefense', 'wi-aluminum'],
    createdAt: '2025-12-16T10:00:00.000Z',
    updatedAt: '2025-12-16T10:00:00.000Z',
  },
  {
    id: 'rec-5',
    title: 'Founder Review — Q1 Deliverables',
    youtubeUrl: 'https://www.youtube.com/watch?v=OPf0YbXqDm0',
    clientId: null,
    ownerId: 'tm-chiraag',
    meetingDate: '2026-04-30',
    meetingType: 'Founder Review',
    notes: 'Chiraag reviewed the Dhamma earnings dashboard and the fund-ops transmission map.',
    linkedWorkItemIds: ['wi-dhamma', 'wi-fundops'],
    createdAt: '2026-04-30T16:00:00.000Z',
    updatedAt: '2026-04-30T16:00:00.000Z',
  },
  {
    id: 'rec-6',
    title: 'Meridian — Portfolio Risk Agent Integration Discussion',
    youtubeUrl: 'https://youtu.be/fJ9rUzIMcZQ',
    clientId: 'cl-meridian',
    ownerId: 'tm-ishaan',
    meetingDate: '2026-04-12',
    meetingType: 'Client Meeting',
    notes: 'Agreed scope for the Munshot agent integration powering the portfolio risk agent.',
    linkedWorkItemIds: ['wi-portfoliorisk', 'wi-earningscall'],
    createdAt: '2026-04-12T13:00:00.000Z',
    updatedAt: '2026-04-12T13:00:00.000Z',
  },
  {
    id: 'rec-7',
    title: 'Sundaram — SIP Flow Dashboard Requirements',
    youtubeUrl: 'https://www.youtube.com/watch?v=CevxZvSJLk8',
    clientId: 'cl-sundaram',
    ownerId: 'tm-ananya',
    meetingDate: '2026-02-03',
    meetingType: 'Client Meeting',
    notes: 'Lakshmi detailed the SIP inflow and folio-growth views needed for the retirement desk.',
    linkedWorkItemIds: ['wi-sip', 'wi-bankasset'],
    createdAt: '2026-02-03T10:30:00.000Z',
    updatedAt: '2026-02-03T10:30:00.000Z',
  },
  {
    id: 'rec-8',
    title: 'Internal Review — Transfers & Workload',
    youtubeUrl: 'https://youtu.be/hT_nvWreIhg',
    clientId: null,
    ownerId: 'tm-vipul',
    meetingDate: '2026-05-05',
    meetingType: 'Internal Review',
    notes: 'Vipul reviewed pending transfers and rebalanced workload across the desk.',
    linkedWorkItemIds: ['wi-sip', 'wi-bankasset', 'wi-fundops'],
    createdAt: '2026-05-05T09:30:00.000Z',
    updatedAt: '2026-05-05T09:30:00.000Z',
  },
  {
    id: 'rec-9',
    title: 'Nordic — Fund Ops Transmission Map Walkthrough',
    youtubeUrl: 'https://www.youtube.com/watch?v=60ItHLz5WEA',
    clientId: 'cl-nordic',
    ownerId: 'tm-ishaan',
    meetingDate: '2026-04-25',
    meetingType: 'Demo',
    notes: 'Walked Erik through the custodian transmission workflow ahead of Vipul approval.',
    linkedWorkItemIds: ['wi-fundops'],
    createdAt: '2026-04-25T15:30:00.000Z',
    updatedAt: '2026-04-25T15:30:00.000Z',
  },
  {
    id: 'rec-10',
    title: 'Aravali — Dhamma Earnings Feedback Call',
    youtubeUrl: 'https://youtu.be/09R8_2nJtjg',
    clientId: 'cl-aravali',
    ownerId: 'tm-ananya',
    meetingDate: '2026-05-08',
    meetingType: 'Feedback Call',
    notes: 'Sneha asked for a consensus-revision timeline and sector roll-up on the Dhamma dashboard.',
    linkedWorkItemIds: ['wi-dhamma'],
    createdAt: '2026-05-08T11:00:00.000Z',
    updatedAt: '2026-05-08T11:00:00.000Z',
  },
  {
    id: 'rec-11',
    title: 'Greenoak — Onboarding & Scoping Call',
    youtubeUrl: 'https://www.youtube.com/watch?v=RgKAFK5djSk',
    clientId: 'cl-greenoak',
    ownerId: 'tm-aarav',
    meetingDate: '2026-05-02',
    meetingType: 'Client Meeting',
    notes: 'Meera scoped the valuation-comps builder and sector-rotation monitor for onboarding.',
    linkedWorkItemIds: ['wi-valuation', 'wi-sectorrotation'],
    createdAt: '2026-05-02T10:00:00.000Z',
    updatedAt: '2026-05-02T10:00:00.000Z',
  },
];

/* ------------------------------------------------------------------ */
/* Feedback                                                           */
/* ------------------------------------------------------------------ */

const FEEDBACK: Feedback[] = [
  {
    id: 'fb-1',
    workItemId: 'wi-amc',
    clientId: 'cl-aravali',
    source: 'Original Client',
    feedbackText: 'Add a scheme-level expense-ratio trend chart over the last 8 quarters.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'High',
    frequencyCount: 3,
    status: 'Resolved',
    createdAt: '2026-01-14T10:00:00.000Z',
  },
  {
    id: 'fb-2',
    workItemId: 'wi-amc',
    clientId: 'cl-aravali',
    source: 'Chiraag',
    feedbackText: 'Colour-code net flows green/red and surface the top-3 movers as cards.',
    priority: 'Medium',
    effort: 'Low',
    businessImpact: 'Medium',
    frequencyCount: 1,
    status: 'Resolved',
    createdAt: '2026-01-08T09:00:00.000Z',
  },
  {
    id: 'fb-3',
    workItemId: 'wi-pv',
    clientId: 'cl-meridian',
    source: 'Original Client',
    feedbackText: 'Channel inventory should split by OEM and show days-of-inventory, not just units.',
    priority: 'High',
    effort: 'High',
    businessImpact: 'High',
    frequencyCount: 4,
    status: 'In Progress',
    createdAt: '2026-05-09T11:00:00.000Z',
  },
  {
    id: 'fb-4',
    workItemId: 'wi-pv',
    clientId: 'cl-meridian',
    source: 'Other Client',
    feedbackText: 'Aravali asked for the same demand-tracker view — consider making it a reusable module.',
    priority: 'Medium',
    effort: 'Medium',
    businessImpact: 'High',
    frequencyCount: 2,
    status: 'Planned',
    createdAt: '2026-05-10T14:00:00.000Z',
  },
  {
    id: 'fb-5',
    workItemId: 'wi-ownership',
    clientId: 'cl-nordic',
    source: 'Original Client',
    feedbackText: 'Overlay promoter-pledge data on the ownership-shift signal.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'High',
    frequencyCount: 2,
    status: 'In Progress',
    createdAt: '2026-04-28T15:00:00.000Z',
  },
  {
    id: 'fb-6',
    workItemId: 'wi-ownership',
    clientId: 'cl-nordic',
    source: 'Original Client',
    feedbackText: 'Add a weekly digest export (PPT) of the biggest accumulation/distribution signals.',
    priority: 'Medium',
    effort: 'Low',
    businessImpact: 'Medium',
    frequencyCount: 1,
    status: 'Open',
    createdAt: '2026-04-29T09:30:00.000Z',
  },
  {
    id: 'fb-7',
    workItemId: 'wi-ownership',
    clientId: 'cl-nordic',
    source: 'Internal Team',
    feedbackText: 'Signal thresholds feel noisy — tune the sensitivity and add a confidence band.',
    priority: 'Medium',
    effort: 'High',
    businessImpact: 'Medium',
    frequencyCount: 2,
    status: 'Open',
    createdAt: '2026-05-03T10:00:00.000Z',
  },
  {
    id: 'fb-8',
    workItemId: 'wi-dhamma',
    clientId: 'cl-aravali',
    source: 'Chiraag',
    feedbackText: 'Add a consensus-revision timeline showing how estimates moved into the print.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'High',
    frequencyCount: 2,
    status: 'Planned',
    createdAt: '2026-04-30T16:30:00.000Z',
  },
  {
    id: 'fb-9',
    workItemId: 'wi-dhamma',
    clientId: 'cl-aravali',
    source: 'Original Client',
    feedbackText: 'Roll the beat/miss view up to sector level with a drill-down.',
    priority: 'Medium',
    effort: 'Medium',
    businessImpact: 'Medium',
    frequencyCount: 3,
    status: 'Open',
    createdAt: '2026-05-08T11:30:00.000Z',
  },
  {
    id: 'fb-10',
    workItemId: 'wi-airdefense',
    clientId: 'cl-blackwood',
    source: 'Original Client',
    feedbackText: 'Track order-book conversion timelines, not just announced orders.',
    priority: 'High',
    effort: 'High',
    businessImpact: 'High',
    frequencyCount: 2,
    status: 'Planned',
    createdAt: '2026-05-04T10:00:00.000Z',
  },
  {
    id: 'fb-11',
    workItemId: 'wi-airdefense',
    clientId: 'cl-blackwood',
    source: 'Vipul',
    feedbackText: 'Tidy up the theme taxonomy before this goes to Chiraag review.',
    priority: 'Medium',
    effort: 'Low',
    businessImpact: 'Low',
    frequencyCount: 1,
    status: 'Resolved',
    createdAt: '2026-04-20T09:00:00.000Z',
  },
  {
    id: 'fb-12',
    workItemId: 'wi-fiidii',
    clientId: 'cl-sundaram',
    source: 'Original Client',
    feedbackText: 'Add a 5-day and 20-day rolling net-flow overlay.',
    priority: 'Medium',
    effort: 'Low',
    businessImpact: 'Medium',
    frequencyCount: 2,
    status: 'In Progress',
    createdAt: '2026-05-12T10:00:00.000Z',
  },
  {
    id: 'fb-13',
    workItemId: 'wi-fiidii',
    clientId: 'cl-sundaram',
    source: 'Other Client',
    feedbackText: 'Meridian wants F&O participant-wise breakdown on the same tracker.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'High',
    frequencyCount: 3,
    status: 'Open',
    createdAt: '2026-05-13T11:00:00.000Z',
  },
  {
    id: 'fb-14',
    workItemId: 'wi-fundops',
    clientId: 'cl-nordic',
    source: 'Original Client',
    feedbackText: 'Show settlement-cycle lag per custodian as a heat strip.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'High',
    frequencyCount: 2,
    status: 'Planned',
    createdAt: '2026-04-25T16:00:00.000Z',
  },
  {
    id: 'fb-15',
    workItemId: 'wi-fundops',
    clientId: 'cl-nordic',
    source: 'Vipul',
    feedbackText: 'Add exception flags for failed instructions before approval.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'Medium',
    frequencyCount: 1,
    status: 'Open',
    createdAt: '2026-05-07T13:00:00.000Z',
  },
  {
    id: 'fb-16',
    workItemId: 'wi-aluminum',
    clientId: 'cl-blackwood',
    source: 'Internal Team',
    feedbackText: 'Cost-curve breakpoints need a clearer legend and a smelter-level tooltip.',
    priority: 'Medium',
    effort: 'Low',
    businessImpact: 'Medium',
    frequencyCount: 1,
    status: 'Open',
    createdAt: '2026-05-08T12:30:00.000Z',
  },
  {
    id: 'fb-17',
    workItemId: 'wi-commodity',
    clientId: 'cl-blackwood',
    source: 'Vipul',
    feedbackText: 'Normalise units across commodities before this goes for approval.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'Medium',
    frequencyCount: 2,
    status: 'In Progress',
    createdAt: '2026-05-05T11:30:00.000Z',
  },
  {
    id: 'fb-18',
    workItemId: 'wi-commodity',
    clientId: 'cl-blackwood',
    source: 'Original Client',
    feedbackText: 'Add a scenario toggle for energy-cost shocks.',
    priority: 'Medium',
    effort: 'High',
    businessImpact: 'High',
    frequencyCount: 2,
    status: 'Open',
    createdAt: '2026-05-06T10:00:00.000Z',
  },
  {
    id: 'fb-19',
    workItemId: 'wi-portfoliorisk',
    clientId: 'cl-meridian',
    source: 'Original Client',
    feedbackText: 'Risk agent should accept a portfolio upload and return factor exposures inline.',
    priority: 'Critical',
    effort: 'High',
    businessImpact: 'High',
    frequencyCount: 3,
    status: 'In Progress',
    createdAt: '2026-04-12T14:00:00.000Z',
  },
  {
    id: 'fb-20',
    workItemId: 'wi-portfoliorisk',
    clientId: 'cl-meridian',
    source: 'Internal Team',
    feedbackText: 'Add guardrails so the agent flags low-confidence outputs explicitly.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'Medium',
    frequencyCount: 2,
    status: 'Open',
    createdAt: '2026-05-01T09:00:00.000Z',
  },
  {
    id: 'fb-21',
    workItemId: 'wi-mgmtcommentary',
    clientId: 'cl-meridian',
    source: 'Original Client',
    feedbackText: 'Tone scoring is great — add a quarter-on-quarter delta view.',
    priority: 'Medium',
    effort: 'Medium',
    businessImpact: 'Medium',
    frequencyCount: 2,
    status: 'Resolved',
    createdAt: '2025-12-20T10:00:00.000Z',
  },
  {
    id: 'fb-22',
    workItemId: 'wi-esg',
    clientId: 'cl-sundaram',
    source: 'Original Client',
    feedbackText: 'Controversy feed needs a recency weighting.',
    priority: 'Medium',
    effort: 'Medium',
    businessImpact: 'Medium',
    frequencyCount: 1,
    status: 'Resolved',
    createdAt: '2025-12-12T11:00:00.000Z',
  },
  {
    id: 'fb-23',
    workItemId: 'wi-bankasset',
    clientId: 'cl-sundaram',
    source: 'Original Client',
    feedbackText: 'Add SMA-1/2 buckets alongside GNPA and slippage.',
    priority: 'High',
    effort: 'Medium',
    businessImpact: 'High',
    frequencyCount: 2,
    status: 'Open',
    createdAt: '2026-05-10T10:30:00.000Z',
  },
  {
    id: 'fb-24',
    workItemId: 'wi-shareholding',
    clientId: 'cl-aravali',
    source: 'Internal Team',
    feedbackText: 'Category drill-down should remember the selected quarter across tabs.',
    priority: 'Low',
    effort: 'Low',
    businessImpact: 'Low',
    frequencyCount: 1,
    status: 'Open',
    createdAt: '2026-05-11T09:00:00.000Z',
  },
  {
    id: 'fb-25',
    workItemId: 'wi-earningscall',
    clientId: 'cl-meridian',
    source: 'Original Client',
    feedbackText: 'Guidance extraction should separate management guidance from analyst questions.',
    priority: 'High',
    effort: 'High',
    businessImpact: 'High',
    frequencyCount: 3,
    status: 'Open',
    createdAt: '2026-05-02T13:00:00.000Z',
  },
  {
    id: 'fb-26',
    workItemId: 'wi-sip',
    clientId: 'cl-sundaram',
    source: 'Vipul',
    feedbackText: 'Lock the data schema before the build goes further to avoid rework.',
    priority: 'High',
    effort: 'Low',
    businessImpact: 'Medium',
    frequencyCount: 1,
    status: 'Planned',
    createdAt: '2026-05-12T08:30:00.000Z',
  },
];

/* ------------------------------------------------------------------ */
/* Meetings                                                           */
/* ------------------------------------------------------------------ */

const MEETINGS: Meeting[] = [
  {
    id: 'mt-1',
    title: 'Meridian — Weekly Coverage Sync',
    clientId: 'cl-meridian',
    ownerId: 'tm-ishaan',
    date: '2026-05-16',
    time: '14:00',
    duration: 45,
    frequency: 'Weekly',
    notes: 'Standing weekly sync on the portfolio risk agent and PV dashboard.',
    meetingType: 'Client Call',
    status: 'Scheduled',
  },
  {
    id: 'mt-2',
    title: 'Nordic — Ownership Signal Feedback Review',
    clientId: 'cl-nordic',
    ownerId: 'tm-diya',
    date: '2026-05-15',
    time: '16:30',
    duration: 30,
    frequency: 'One-time',
    notes: 'Review the promoter-pledge overlay and weekly digest request.',
    meetingType: 'Feedback Call',
    status: 'Scheduled',
  },
  {
    id: 'mt-3',
    title: 'Internal — Sprint Planning',
    clientId: null,
    ownerId: 'tm-vipul',
    date: '2026-05-18',
    time: '10:00',
    duration: 60,
    frequency: 'Weekly',
    notes: 'Plan the week, confirm transfers, rebalance workload.',
    meetingType: 'Internal Sync',
    status: 'Scheduled',
  },
  {
    id: 'mt-4',
    title: 'Aravali — AMC & Dhamma Review',
    clientId: 'cl-aravali',
    ownerId: 'tm-ananya',
    date: '2026-05-19',
    time: '11:30',
    duration: 45,
    frequency: 'Bi-weekly',
    notes: 'Walk Sneha through Dhamma earnings dashboard changes.',
    meetingType: 'Client Call',
    status: 'Scheduled',
  },
  {
    id: 'mt-5',
    title: 'Sundaram — SIP Flow Dashboard Kickoff Refresh',
    clientId: 'cl-sundaram',
    ownerId: 'tm-ananya',
    date: '2026-05-20',
    time: '15:00',
    duration: 40,
    frequency: 'One-time',
    notes: 'Re-confirm scope after the proposed transfer to Diya.',
    meetingType: 'Kickoff',
    status: 'Scheduled',
  },
  {
    id: 'mt-6',
    title: 'Blackwood — Air Defense Demo',
    clientId: 'cl-blackwood',
    ownerId: 'tm-ishaan',
    date: '2026-05-21',
    time: '13:00',
    duration: 45,
    frequency: 'One-time',
    notes: 'Demo the live air-defense theme tracker to Rishi.',
    meetingType: 'Demo',
    status: 'Scheduled',
  },
  {
    id: 'mt-7',
    title: 'Founder Review — Live Deliverables',
    clientId: null,
    ownerId: 'tm-chiraag',
    date: '2026-05-22',
    time: '17:00',
    duration: 60,
    frequency: 'Weekly',
    notes: 'Chiraag reviews everything that went live this week.',
    meetingType: 'Founder Review',
    status: 'Scheduled',
  },
  {
    id: 'mt-8',
    title: 'Greenoak — Onboarding Follow-up',
    clientId: 'cl-greenoak',
    ownerId: 'tm-aarav',
    date: '2026-05-26',
    time: '12:00',
    duration: 30,
    frequency: 'One-time',
    notes: 'Follow-up on the valuation-comps builder scoping.',
    meetingType: 'Client Call',
    status: 'Scheduled',
  },
  {
    id: 'mt-9',
    title: 'Meridian — PV Dashboard Requirement Call',
    clientId: 'cl-meridian',
    ownerId: 'tm-aarav',
    date: '2025-12-02',
    time: '14:00',
    duration: 45,
    frequency: 'One-time',
    notes: 'Captured PV dashboard requirements with Daniel.',
    meetingType: 'Client Call',
    status: 'Completed',
  },
  {
    id: 'mt-10',
    title: 'Aravali — AMC Dashboard Demo',
    clientId: 'cl-aravali',
    ownerId: 'tm-diya',
    date: '2026-01-09',
    time: '11:00',
    duration: 40,
    frequency: 'One-time',
    notes: 'Demoed the AMC dashboard — signed off for go-live.',
    meetingType: 'Demo',
    status: 'Completed',
  },
  {
    id: 'mt-11',
    title: 'Nordic — Fund Ops Walkthrough',
    clientId: 'cl-nordic',
    ownerId: 'tm-ishaan',
    date: '2026-04-25',
    time: '15:30',
    duration: 50,
    frequency: 'One-time',
    notes: 'Walked Erik through the custodian transmission workflow.',
    meetingType: 'Demo',
    status: 'Completed',
  },
  {
    id: 'mt-12',
    title: 'Internal — Transfers & Workload Review',
    clientId: null,
    ownerId: 'tm-vipul',
    date: '2026-05-05',
    time: '09:30',
    duration: 45,
    frequency: 'Weekly',
    notes: 'Reviewed pending transfers and rebalanced the desk.',
    meetingType: 'Internal Sync',
    status: 'Completed',
  },
  {
    id: 'mt-13',
    title: 'Blackwood — Air Defense Theme Kickoff',
    clientId: 'cl-blackwood',
    ownerId: 'tm-kabir',
    date: '2025-12-16',
    time: '10:00',
    duration: 60,
    frequency: 'One-time',
    notes: 'Kicked off air-defense and aluminium monitors with Rishi.',
    meetingType: 'Kickoff',
    status: 'Completed',
  },
  {
    id: 'mt-14',
    title: 'Sundaram — SIP Flow Requirements',
    clientId: 'cl-sundaram',
    ownerId: 'tm-ananya',
    date: '2026-02-03',
    time: '10:30',
    duration: 45,
    frequency: 'One-time',
    notes: 'Detailed the SIP inflow and folio-growth requirements.',
    meetingType: 'Client Call',
    status: 'Completed',
  },
  {
    id: 'mt-15',
    title: 'Aravali — Dhamma Earnings Feedback',
    clientId: 'cl-aravali',
    ownerId: 'tm-ananya',
    date: '2026-05-08',
    time: '11:00',
    duration: 30,
    frequency: 'One-time',
    notes: 'Collected consensus-revision and sector roll-up feedback.',
    meetingType: 'Feedback Call',
    status: 'Completed',
  },
  {
    id: 'mt-16',
    title: 'Meridian — Portfolio Risk Agent Integration',
    clientId: 'cl-meridian',
    ownerId: 'tm-ishaan',
    date: '2026-04-12',
    time: '13:00',
    duration: 50,
    frequency: 'One-time',
    notes: 'Agreed Munshot agent integration scope.',
    meetingType: 'Client Call',
    status: 'Completed',
  },
  {
    id: 'mt-17',
    title: 'Internal — Daily Standup',
    clientId: null,
    ownerId: 'tm-vipul',
    date: '2026-05-14',
    time: '09:15',
    duration: 15,
    frequency: 'Daily',
    notes: 'Quick desk standup — blockers and priorities for the day.',
    meetingType: 'Internal Sync',
    status: 'Scheduled',
  },
];

/* ------------------------------------------------------------------ */
/* Tasks                                                              */
/* ------------------------------------------------------------------ */

const TASK_TEMPLATES: Record<WorkItem['type'], string[]> = {
  Dashboard: [
    'Wire up the data layer & mock schema',
    'Build the KPI metric cards',
    'Add the filter bar & cross-filtering',
    'Implement Excel + PPT export',
    'Polish chart interactions & tooltips',
    'Responsive layout QA pass',
  ],
  Agent: [
    'Draft the master system prompt',
    'Define the tool / function schema',
    'Wire the Munshot agent integration',
    'Add evaluation test cases',
    'Handle error & low-confidence states',
  ],
  Workflow: [
    'Map the process stages end-to-end',
    'Define handoff & ownership rules',
    'Build status automation',
    'Document the SOP for the desk',
  ],
};

function buildTasks(items: WorkItem[]): Task[] {
  const tasks: Task[] = [];
  items.forEach((wi, wiIndex) => {
    const templates = TASK_TEMPLATES[wi.type];
    const count = wi.status === 'Not Started' ? 2 : 3;
    for (let i = 0; i < count; i++) {
      const template = templates[(wiIndex + i) % templates.length];
      const ratio = (i + 1) / (count + 1);
      let status: TaskStatus;
      if (wi.status === 'Completed') status = 'Done';
      else if (wi.status === 'Blocked' && i === 0) status = 'Blocked';
      else if (wi.progress / 100 > ratio) status = 'Done';
      else if (wi.progress / 100 > ratio - 0.25) status = 'In Progress';
      else status = 'To Do';

      const dueOffset = [-6, 4, 12][i] ?? 8;
      tasks.push({
        id: seq('task'),
        workItemId: wi.id,
        ownerId: wi.ownerId,
        clientId: wi.clientId,
        title: template,
        description: `${template} for ${wi.title}.`,
        status,
        priority:
          wi.priority === 'Critical' && i === 0
            ? 'Critical'
            : i === 0
              ? 'High'
              : i === 1
                ? 'Medium'
                : 'Low',
        dueDate: addDays(wi.dueDate, dueOffset),
        createdAt: `${wi.startDate}T10:00:00.000Z`,
      });
    }
  });
  return tasks;
}

/* ------------------------------------------------------------------ */
/* Demo readiness checklists                                          */
/* ------------------------------------------------------------------ */

const READINESS_LABELS = [
  'UI complete',
  'Data connected / mock marked',
  'Exports working',
  'Agent integration done / not required',
  'Bugs fixed',
  'Vipul approved',
  'Chiraag reviewed',
  'Client feedback handled',
  'PPT / Excel tested',
] as const;

function buildReadiness(items: WorkItem[]): DemoReadinessItem[] {
  const out: DemoReadinessItem[] = [];
  items.forEach((wi) => {
    const idx = stageIndexOf(wi.currentStage);
    READINESS_LABELS.forEach((label) => {
      let status: DemoReadinessItem['status'] = 'Pending';
      switch (label) {
        case 'UI complete':
          status = idx >= stageIndexOf('Dashboard/Agent Built') ? 'Done' : 'Pending';
          break;
        case 'Data connected / mock marked':
          status = idx >= stageIndexOf('Dashboard/Agent Built') ? 'Done' : 'Pending';
          break;
        case 'Exports working':
          status = idx >= stageIndexOf('Team Review') ? 'Done' : 'Pending';
          break;
        case 'Agent integration done / not required':
          status = !wi.agentIntegrationRequired
            ? 'Not Required'
            : wi.agentIntegrationStatus === 'Done'
              ? 'Done'
              : 'Pending';
          break;
        case 'Bugs fixed':
          status = idx >= stageIndexOf('Team Review') ? 'Done' : 'Pending';
          break;
        case 'Vipul approved':
          status = wi.vipulApprovalStatus === 'Approved' ? 'Done' : 'Pending';
          break;
        case 'Chiraag reviewed':
          status = wi.chiraagReviewStatus === 'Reviewed' ? 'Done' : 'Pending';
          break;
        case 'Client feedback handled':
          status =
            wi.clientFeedbackStatus === 'Addressed'
              ? 'Done'
              : wi.clientFeedbackStatus === 'No Feedback Yet'
                ? 'Not Required'
                : 'Pending';
          break;
        case 'PPT / Excel tested':
          status = idx >= stageIndexOf('Vipul Approval') ? 'Done' : 'Pending';
          break;
      }
      out.push({
        id: seq('dr'),
        workItemId: wi.id,
        label,
        status,
        ownerId: wi.ownerId,
        notes: '',
      });
    });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Timeline events                                                    */
/* ------------------------------------------------------------------ */

function stageEventType(stage: WorkflowStage): TimelineEventType {
  if (stage === 'Live on Munshot') return 'went_live';
  if (stage === 'Vipul Approval') return 'approval';
  if (stage === 'Chiraag Review') return 'review';
  if (stage === 'Final Completion') return 'completed';
  return 'stage_change';
}

function buildTimeline(
  items: WorkItem[],
  transfers: WorkTransfer[],
  recordings: ClientMeetingRecording[],
  feedback: Feedback[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  items.forEach((wi) => {
    const idx = stageIndexOf(wi.currentStage);
    const end = wi.completionDate ?? todayISO();
    const span = Math.max(1, daysBetween(wi.startDate, end));
    const dateAt = (fraction: number): string =>
      addDays(wi.startDate, Math.round(span * Math.min(1, Math.max(0, fraction))));

    events.push({
      id: seq('tl'),
      workItemId: wi.id,
      eventType: 'created',
      title: 'Work item created',
      description: `${wi.title} (${wi.type}) added to the tracker.`,
      actorId: wi.originalOwnerId,
      date: `${wi.startDate}T09:00:00.000Z`,
    });

    for (let i = 1; i <= idx; i++) {
      const stage = WORKFLOW_STAGES[i];
      events.push({
        id: seq('tl'),
        workItemId: wi.id,
        eventType: stageEventType(stage),
        title: `Stage reached: ${stage}`,
        description: STAGE_META[stage].description,
        actorId: wi.ownerId,
        date: dateAt(i / (idx + 1)),
        metadata: { stage },
      });
    }

    recordings
      .filter((r) => r.linkedWorkItemIds.includes(wi.id))
      .forEach((r) => {
        events.push({
          id: seq('tl'),
          workItemId: wi.id,
          eventType: 'recording_linked',
          title: `Client meeting recording added: ${r.title}`,
          description: r.notes,
          actorId: r.ownerId,
          date: r.createdAt,
          metadata: { recordingId: r.id },
        });
      });

    transfers
      .filter((t) => t.workItemId === wi.id)
      .forEach((t) => {
        events.push({
          id: seq('tl'),
          workItemId: wi.id,
          eventType: 'transfer_requested',
          title: 'Work transfer requested',
          description: `${t.reason}: proposed move to a new owner. ${t.notes}`,
          actorId: t.requestedById,
          date: t.createdAt,
          metadata: { transferId: t.id, status: t.status },
        });
        if (t.status === 'Completed' || t.status === 'Approved') {
          events.push({
            id: seq('tl'),
            workItemId: wi.id,
            eventType:
              t.status === 'Completed'
                ? 'transfer_completed'
                : 'transfer_approved',
            title: `Work transfer ${t.status.toLowerCase()}`,
            description: `Ownership moved as part of: ${t.reason}.`,
            actorId: t.approvedById,
            date: t.transferDate,
            metadata: { transferId: t.id },
          });
        }
        if (t.status === 'Rejected') {
          events.push({
            id: seq('tl'),
            workItemId: wi.id,
            eventType: 'transfer_rejected',
            title: 'Work transfer rejected',
            description: t.notes,
            actorId: t.requestedById,
            date: t.transferDate,
            metadata: { transferId: t.id },
          });
        }
      });

    feedback
      .filter((f) => f.workItemId === wi.id)
      .forEach((f) => {
        events.push({
          id: seq('tl'),
          workItemId: wi.id,
          eventType: 'feedback_added',
          title: `Feedback logged (${f.source})`,
          description: f.feedbackText,
          actorId: null,
          date: f.createdAt,
          metadata: { feedbackId: f.id, priority: f.priority },
        });
      });
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/* ------------------------------------------------------------------ */
/* Assemble                                                           */
/* ------------------------------------------------------------------ */

export function createSeedData(): AppData {
  counter = 0;

  const workItems = WI_SPECS.map(buildWorkItem);
  const byId = new Map(workItems.map((w) => [w.id, w]));

  // link recordings → work items (bidirectional)
  RECORDINGS.forEach((rec) => {
    rec.linkedWorkItemIds.forEach((wiId) => {
      const wi = byId.get(wiId);
      if (wi && !wi.linkedMeetingRecordingIds.includes(rec.id)) {
        wi.linkedMeetingRecordingIds.push(rec.id);
      }
    });
  });

  // improvement count = feedback linked to the work item
  workItems.forEach((wi) => {
    wi.improvementCount = FEEDBACK.filter((f) => f.workItemId === wi.id).length;
  });

  const tasks = buildTasks(workItems);
  const demoReadinessItems = buildReadiness(workItems);
  const timelineEvents = buildTimeline(
    workItems,
    TRANSFERS,
    RECORDINGS,
    FEEDBACK,
  );

  return {
    teamMembers: TEAM,
    clients: CLIENTS,
    workItems,
    tasks,
    meetings: MEETINGS,
    recordings: RECORDINGS,
    feedback: FEEDBACK,
    transfers: TRANSFERS,
    timelineEvents,
    demoReadinessItems,
    workflowStages: buildStages(),
  };
}

/** Deep clone so callers can mutate freely without touching the template. */
export function cloneSeedData(): AppData {
  return JSON.parse(JSON.stringify(createSeedData())) as AppData;
}
