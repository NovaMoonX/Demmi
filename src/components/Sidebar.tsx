import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '@moondreamsdev/dreamer-ui/components';
import { Toggle } from '@moondreamsdev/dreamer-ui/components';
import { useTheme } from '@moondreamsdev/dreamer-ui/hooks';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { DotsVertical } from '@moondreamsdev/dreamer-ui/symbols';

type Tab = {
  id: string;
  label: string;
  emoji: string;
  path: string;
};

const tabs: Tab[] = [
  { id: 'chat', label: 'Chat', emoji: '💬', path: '/' },
  { id: 'meals', label: 'Meals', emoji: '🍽️', path: '/meals' },
  { id: 'ingredients', label: 'Ingredients', emoji: '🍎', path: '/ingredients' },
  { id: 'calendar', label: 'Calendar', emoji: '📅', path: '/calendar' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTabClick = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleClose = () => {
    setIsMobileOpen(false);
    setIsAnimating(true);
    // Wait for the closing animation (300ms) to complete before showing the button
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const currentPath = location.pathname;

  return (
    <>
      {/* Mobile menu button - only show when menu is closed and not animating */}
      {!isMobileOpen && !isAnimating && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-1.5 rounded-lg bg-card border border-border md:hidden"
          aria-label="Toggle menu"
        >
          <DotsVertical className="size-5 text-foreground" />
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={join(
          'fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40 transition-transform duration-300 flex flex-col',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
      >
        {/* Tabs section */}
        <nav className="flex-1 p-4 space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
            Navigation
          </h2>
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                className={join(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-xl">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom section: Theme toggle and Account */}
        <div className="p-4 border-t border-border space-y-4">
          {/* Theme toggle */}
          <div className="flex items-center justify-between px-3">
            <span className="text-sm text-foreground/80">Dark Mode</span>
            <Toggle
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
          </div>

          {/* Account section */}
          <button
            onClick={() => handleTabClick('/account')}
            className={join(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              currentPath === '/account'
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground'
            )}
          >
            <Avatar
              preset="astronaut"
              size="sm"
              alt="User account"
            />
            <span className="font-medium">Account</span>
          </button>
        </div>
      </aside>
    </>
  );
}
