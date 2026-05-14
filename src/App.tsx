import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CommandCenter } from '@/views/CommandCenter';
import { TeamProfiles } from '@/views/TeamProfiles';
import { MemberDetail } from '@/views/MemberDetail';
import { GlobalWorkTracker } from '@/views/GlobalWorkTracker';
import { WorkTransfers } from '@/views/WorkTransfers';
import { Clients } from '@/views/Clients';
import { ClientDetail } from '@/views/ClientDetail';
import { ClientMeetings } from '@/views/ClientMeetings';
import { WorkflowView } from '@/views/WorkflowView';
import { Performance } from '@/views/Performance';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CommandCenter />} />
        <Route path="/team" element={<TeamProfiles />} />
        <Route path="/team/:id" element={<MemberDetail />} />
        <Route path="/work" element={<GlobalWorkTracker />} />
        <Route path="/transfers" element={<WorkTransfers />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/meetings" element={<ClientMeetings />} />
        <Route path="/workflow" element={<WorkflowView />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
