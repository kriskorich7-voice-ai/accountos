import { Routes, Route, Navigate } from 'react-router-dom';
import { ConversationProvider } from '@elevenlabs/react';
import Sidebar from './components/Sidebar.jsx';
import Portfolio from './pages/Portfolio.jsx';
import AccountOverview from './pages/AccountOverview.jsx';
import Adoption from './pages/Adoption.jsx';
import Intelligence from './pages/Intelligence.jsx';
import Actions from './pages/Actions.jsx';
import Today from './pages/Today.jsx';
import InboxPage from './pages/Inbox.jsx';
import Signals from './pages/Signals.jsx';
import Copilot from './pages/Copilot.jsx';

export default function App() {
  return (
    // ConversationProvider lives at the app root so the ElevenLabs conversation
    // context persists across navigation and isn't torn down when the Copilot
    // page unmounts.
    <ConversationProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 min-h-screen">
          <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/account/acme" element={<AccountOverview />} />
          <Route path="/account/acme/adoption" element={<Adoption />} />
          {/* Only Acme has a dedicated deep-dive in V1; other ids fall back to it. */}
          <Route path="/account/:id" element={<AccountOverview />} />
          <Route path="/adoption" element={<Adoption />} />
          <Route path="/intelligence" element={<Intelligence />} />
          <Route path="/actions" element={<Actions />} />
          <Route path="/today" element={<Today />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/copilot" element={<Copilot />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </ConversationProvider>
  );
}
