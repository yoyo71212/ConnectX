import ConnectXBoard from '@/components/ConnectXBoard';
import { PlayerProvider } from '@/context/PlayerContext';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <PlayerProvider>
        <ConnectXBoard />
      </PlayerProvider>
    </main>
  );
}
