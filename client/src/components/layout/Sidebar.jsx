import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, FileText, User, Stethoscope, Sun, Moon, Users, Bell, Zap, LogOut, Settings, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';

const navItems = [
  { name: 'Dashboard', icon: Home, path: '/dashboard' },
  { name: 'Upload', icon: Upload, path: '/upload' },
  { name: 'Results & History', icon: FileText, path: '/history' },
  { name: 'Consult', icon: Stethoscope, path: '/consult' },
  { name: 'Community', icon: Users, path: '/community' },
  { name: 'Profile', icon: User, path: '/profile' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Fetch user name
    fetch(`http://localhost:3001/api/profile/${user.id}`)
      .then(r => r.json())
      .then(d => setUserName(d?.full_name?.split(' ')[0] || ''))
      .catch(() => {});
    // Fetch unread notifications count
    fetch(`http://localhost:3001/api/notifications/${user.id}`)
      .then(r => r.json())
      .then(n => setUnreadCount(Array.isArray(n) ? n.filter(x => !x.is_read).length : 0))
      .catch(() => {});
  }, [user]);

  const initials = userName ? userName[0].toUpperCase() : '?';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r glass-sidebar md:flex">
        {/* User Avatar Section */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{userName || 'Welcome'}</p>
              <p className="text-[10px] text-muted-foreground">CycleSync Member</p>
            </div>
          </div>
        </div>

        {/* Quick Upload Button */}
        <div className="px-4 pt-4">
          <Button
            asChild
            size="sm"
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md"
          >
            <Link to="/upload">
              <Zap className="mr-2 h-4 w-4" /> Quick Upload
            </Link>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Button
                key={item.name}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start transition-all duration-200',
                  isActive && 'bg-secondary text-primary font-semibold shadow-sm'
                )}
                asChild
              >
                <Link to={item.path}>
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* Bottom Section — Dark Mode Toggle */}
        <div className="p-4 border-t border-border/50 space-y-1">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 z-50 w-full border-t bg-background/80 backdrop-blur-xl md:hidden">
        <ul className="flex justify-around p-2 pb-safe">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center p-1.5 text-[10px] transition-colors',
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="mb-0.5 h-5 w-5" />
                  <span>{item.name.split(' ')[0]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
