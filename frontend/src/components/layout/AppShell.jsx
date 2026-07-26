import TopBar from './TopBar';
import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  return (
    <div>
      <TopBar />
      <Sidebar />
      <main style={{
        marginLeft: '200px',
        marginTop: '56px',
        padding: '32px',
        minHeight: 'calc(100vh - 56px)',
        overflowY: 'auto'
      }}>
        {children}
      </main>
    </div>
  );
}
