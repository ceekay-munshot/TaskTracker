import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  Link2,
  MessageSquare,
  Sparkles,
  Video,
} from 'lucide-react';
import type { ClientMeetingRecording } from '@/types';
import { RECORDING_TYPES } from '@/types';
import { useStore } from '@/store/StoreContext';
import { useUI } from '@/store/UIContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { SectionHeading } from '@/components/ui/Panel';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterBar } from '@/components/ui/FilterBar';
import { toOptions } from '@/components/ui/Field';
import { MeetingRecordingCard } from '@/components/MeetingRecordingCard';
import { formatDate, monthKey, todayISO } from '@/utils/dates';
import { sortByKey, sumBy } from '@/utils/collections';
import { getYouTubeWatchUrl } from '@/utils/youtube';
import type { ExcelSheet, PptSummary } from '@/utils/export';

export function ClientMeetings() {
  const { data, getClient, getMember } = useStore();
  const ui = useUI();
  const [searchParams] = useSearchParams();

  /* Deep-link: ?recording=ID opens the recording drawer on mount. */
  useEffect(() => {
    const id = searchParams.get('recording');
    if (id) ui.openRecording(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [workItemId, setWorkItemId] = useState('');

  const thisMonth = monthKey(todayISO());

  const stats = useMemo(() => {
    const recordings = data.recordings;
    const byType = new Map<string, number>();
    RECORDING_TYPES.forEach((t) => byType.set(t, 0));
    recordings.forEach((r) =>
      byType.set(r.meetingType, (byType.get(r.meetingType) ?? 0) + 1),
    );
    return {
      total: recordings.length,
      byType,
      linkedWorkItems: sumBy(recordings, (r) => r.linkedWorkItemIds.length),
      thisMonth: recordings.filter(
        (r) => monthKey(r.meetingDate) === thisMonth,
      ).length,
    };
  }, [data.recordings, thisMonth]);

  const filteredRecordings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortByKey(
      data.recordings.filter((r) => {
        if (
          q &&
          !r.title.toLowerCase().includes(q) &&
          !r.notes.toLowerCase().includes(q)
        ) {
          return false;
        }
        if (clientId && r.clientId !== clientId) return false;
        if (ownerId && r.ownerId !== ownerId) return false;
        if (meetingType && r.meetingType !== meetingType) return false;
        if (workItemId && !r.linkedWorkItemIds.includes(workItemId)) {
          return false;
        }
        return true;
      }),
      (r) => r.meetingDate,
      'desc',
    );
  }, [data.recordings, search, clientId, ownerId, meetingType, workItemId]);

  const hasActiveFilters = Boolean(
    search || clientId || ownerId || meetingType || workItemId,
  );
  const resetFilters = () => {
    setSearch('');
    setClientId('');
    setOwnerId('');
    setMeetingType('');
    setWorkItemId('');
  };

  const getSheets = (): ExcelSheet<unknown>[] => {
    const sheet: ExcelSheet<ClientMeetingRecording> = {
      name: 'Meeting Recordings',
      rows: filteredRecordings,
      columns: [
        { header: 'Title', value: (r) => r.title },
        {
          header: 'YouTube URL',
          value: (r) => getYouTubeWatchUrl(r.youtubeUrl) ?? r.youtubeUrl,
        },
        {
          header: 'Client',
          value: (r) => getClient(r.clientId)?.name ?? 'Internal',
        },
        {
          header: 'Owner',
          value: (r) => getMember(r.ownerId)?.name ?? '',
        },
        { header: 'Meeting Date', value: (r) => formatDate(r.meetingDate) },
        { header: 'Meeting Type', value: (r) => r.meetingType },
        {
          header: 'Linked Work Items',
          value: (r) => r.linkedWorkItemIds.length,
        },
        { header: 'Notes', value: (r) => r.notes },
      ],
    };
    return [sheet as ExcelSheet<unknown>];
  };

  const getPptSummary = (): PptSummary => ({
    title: 'Client Meeting Recordings',
    subtitle: 'Munshot OS — captured client conversations & reviews',
    kpis: [
      { label: 'Total recordings', value: stats.total },
      { label: 'Linked work items', value: stats.linkedWorkItems },
      { label: 'Recorded this month', value: stats.thisMonth },
      ...RECORDING_TYPES.map((t) => ({
        label: t,
        value: stats.byType.get(t) ?? 0,
      })),
    ],
    tables: [
      {
        title: 'Recording library',
        headers: [
          'Title',
          'Type',
          'Client',
          'Owner',
          'Meeting Date',
          'Linked',
          'YouTube Link',
        ],
        rows: filteredRecordings.map((r) => [
          r.title,
          r.meetingType,
          getClient(r.clientId)?.name ?? 'Internal',
          getMember(r.ownerId)?.name ?? '',
          formatDate(r.meetingDate),
          r.linkedWorkItemIds.length,
          getYouTubeWatchUrl(r.youtubeUrl) ?? r.youtubeUrl,
        ]),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Client Meetings"
        subtitle="Every client call, demo and review — captured on video"
        action={
          <div className="flex items-center gap-2">
            <ExportButtons
              filename="munshot-client-meetings"
              getSheets={getSheets}
              getPptSummary={getPptSummary}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => ui.addRecording()}
            >
              <Video className="h-4 w-4" /> Add Meeting Recording
            </button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard
          label="Total Recordings"
          value={stats.total}
          icon={Video}
          color="fuchsia"
          hint="across the desk"
        />
        <MetricCard
          label="Client Meetings"
          value={stats.byType.get('Client Meeting') ?? 0}
          icon={MessageSquare}
          color="indigo"
          hint="kickoffs & working calls"
        />
        <MetricCard
          label="Demos"
          value={stats.byType.get('Demo') ?? 0}
          icon={Sparkles}
          color="violet"
          hint="product walkthroughs"
        />
        <MetricCard
          label="Feedback Calls"
          value={stats.byType.get('Feedback Call') ?? 0}
          icon={MessageSquare}
          color="orange"
          hint="improvement conversations"
        />
        <MetricCard
          label="Founder Reviews"
          value={stats.byType.get('Founder Review') ?? 0}
          icon={Video}
          color="cyan"
          hint="Chiraag review sessions"
        />
        <MetricCard
          label="Internal Reviews"
          value={stats.byType.get('Internal Review') ?? 0}
          icon={Video}
          color="slate"
          hint="team review sessions"
        />
        <MetricCard
          label="Linked Work Items"
          value={stats.linkedWorkItems}
          icon={Link2}
          color="teal"
          hint="recordings tied to delivery"
        />
        <MetricCard
          label="Recorded This Month"
          value={stats.thisMonth}
          icon={CalendarClock}
          color="emerald"
          hint="fresh client conversations"
        />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Search recordings by title or notes…',
        }}
        selects={[
          {
            key: 'client',
            label: 'Clients',
            value: clientId,
            onChange: setClientId,
            options: sortByKey(data.clients, (c) => c.name).map((c) => ({
              value: c.id,
              label: c.name,
            })),
          },
          {
            key: 'owner',
            label: 'Owners',
            value: ownerId,
            onChange: setOwnerId,
            options: sortByKey(data.teamMembers, (m) => m.name).map((m) => ({
              value: m.id,
              label: m.name,
            })),
          },
          {
            key: 'type',
            label: 'Meeting Types',
            value: meetingType,
            onChange: setMeetingType,
            options: toOptions(RECORDING_TYPES),
          },
          {
            key: 'workItem',
            label: 'Linked Work',
            value: workItemId,
            onChange: setWorkItemId,
            options: sortByKey(data.workItems, (w) => w.title).map((w) => ({
              value: w.id,
              label: w.title,
            })),
          },
        ]}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      {/* Recording grid */}
      {filteredRecordings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No recordings match"
          description={
            hasActiveFilters
              ? 'Adjust the filters to see more of the recording library.'
              : 'Add your first client meeting recording to build the library.'
          }
          action={
            <button
              type="button"
              className="btn-primary"
              onClick={() => ui.addRecording()}
            >
              <Video className="h-4 w-4" /> Add Meeting Recording
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRecordings.map((r) => (
            <MeetingRecordingCard
              key={r.id}
              recording={r}
              onView={() => ui.openRecording(r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
