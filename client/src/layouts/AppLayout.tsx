import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Music2,
  Home,
  Compass,
  Users,
  Heart,
  ListMusic,
  LogOut,
} from 'lucide-react';
import { ThemeSelector } from '../components/theme/ThemeSelector';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { PlayerBar } from '../components/player/PlayerBar';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../constants/routes';
import { cn } from '../utils/cn';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { seekTo } = useAudioEngine();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const navItems = [
    { label: 'Home', icon: <Home className="w-5 h-5" />, to: ROUTES.HOME },
    { label: 'Discover & Solo', icon: <Compass className="w-5 h-5" />, to: ROUTES.SOLO },
    { label: 'Friends', icon: <Users className="w-5 h-5" />, to: ROUTES.FRIENDS },
    { label: 'Playlists', icon: <ListMusic className="w-5 h-5" />, to: ROUTES.PLAYLISTS },
    { label: 'Favorites', icon: <Heart className="w-5 h-5" />, to: ROUTES.FAVORITES },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 shrink-0 bg-[var(--background)] border-r border-[var(--border)] hidden md:flex flex-col justify-between p-5 z-20">
          <div className="flex flex-col gap-6">
            {/* Logo */}
            <NavLink to={ROUTES.HOME} className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] shadow-lg glow-primary-sm">
                <Music2 className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-black tracking-tight text-[var(--foreground)]">
                Rhythm
              </span>
            </NavLink>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === ROUTES.HOME}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none cursor-pointer',
                      isActive
                        ? 'bg-[var(--surface-hover)] text-[var(--primary)] shadow-sm'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User profile & logout */}
          <div className="p-3 rounded-2xl glass-panel border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar src={user?.avatarUrl} name={user?.username || 'Guest'} size="sm" />
              <div className="truncate">
                <p className="text-xs font-bold text-[var(--foreground)] truncate">
                  {user?.username || 'Guest'}
                </p>
                <p className="text-[10px] text-[var(--foreground-dim)] truncate">
                  {user?.email || 'Logged in'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-[var(--foreground-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 w-full glass-panel border-b border-[var(--border)] px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 md:hidden">
              <NavLink to={ROUTES.HOME} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)]">
                  <Music2 className="w-4 h-4 fill-current" />
                </div>
                <span className="text-base font-black">Rhythm</span>
              </NavLink>
            </div>

            <div className="hidden md:block">
              <span className="text-xs font-semibold text-[var(--foreground-dim)] uppercase tracking-wider">
                Real-Time Synchronized Audio
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeSelector />

              {/* Mobile Logout */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="md:hidden text-[var(--foreground-dim)] hover:text-red-400"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-36 md:pb-28">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Persistent Audio Player Bar */}
      <PlayerBar onSeek={seekTo} />



      {/* Bottom Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-[var(--border)] px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === ROUTES.HOME}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-medium transition-colors select-none',
                isActive
                  ? 'text-[var(--primary)] font-bold'
                  : 'text-[var(--foreground-muted)]'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
