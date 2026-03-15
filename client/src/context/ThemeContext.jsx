import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cyclesync-theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Enforce light mode on these public/auth routes
    const isPublicRoute = ['/', '/login', '/signup', '/register'].includes(window.location.pathname);
    
    if (theme === 'dark' && !isPublicRoute) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Only save to local storage if not on a public route, 
    // or keep saving it but just don't apply it. (Continuing to save user preference)
    if (!isPublicRoute) {
       localStorage.setItem('cyclesync-theme', theme);
    }
  }, [theme]);

  // Hook into path changes in case client-side routing happens without remounting the provider
  useEffect(() => {
    const handlePathChange = () => {
      const root = document.documentElement;
      const isPublicRoute = ['/', '/login', '/signup', '/register'].includes(window.location.pathname);
      if (isPublicRoute) {
        root.classList.remove('dark');
      } else if (theme === 'dark') {
        root.classList.add('dark');
      }
    };
    
    handlePathChange();
    
    // Monkey patch pushState and replaceState to catch client-side routing
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        handlePathChange();
    };
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        handlePathChange();
    };
    window.addEventListener('popstate', handlePathChange);
    
    return () => {
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
        window.removeEventListener('popstate', handlePathChange);
    };
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
