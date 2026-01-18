'use client';

import { DashboardProvider } from './contexts/DashboardContext';
import { SplitLayout } from './components/SplitLayout';
import { DashboardPanel } from './components/DashboardPanel';
import { ChatPanel } from './components/ChatPanel';

export default function HomePage() {
  return (
    <DashboardProvider>
      <SplitLayout>
        <DashboardPanel />
        <ChatPanel />
      </SplitLayout>
    </DashboardProvider>
  );
}