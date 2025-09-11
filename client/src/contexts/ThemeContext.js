import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });
  
  const [dyslexiaFont, setDyslexiaFont] = useState(() => {
    return localStorage.getItem('dyslexiaFont') === 'true';
  });
  
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    root.setAttribute('data-theme', highContrast ? 'high-contrast' : theme);
    
    // Apply font size
    root.className = root.className.replace(/font-(small|medium|large)/, '');
    root.classList.add(`font-${fontSize}`);
    
    // Apply dyslexia font
    if (dyslexiaFont) {
      root.classList.add('dyslexia-font');
    } else {
      root.classList.remove('dyslexia-font');
    }
    
    // Store preferences
    localStorage.setItem('theme', theme);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('dyslexiaFont', dyslexiaFont);
    localStorage.setItem('highContrast', highContrast);
  }, [theme, fontSize, dyslexiaFont, highContrast]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const updatePreferences = (preferences) => {
    if (preferences.darkMode !== undefined) {
      setTheme(preferences.darkMode ? 'dark' : 'light');
    }
    if (preferences.fontSize) {
      setFontSize(preferences.fontSize);
    }
    if (preferences.dyslexiaFont !== undefined) {
      setDyslexiaFont(preferences.dyslexiaFont);
    }
    if (preferences.highContrast !== undefined) {
      setHighContrast(preferences.highContrast);
    }
  };

  const value = {
    theme,
    fontSize,
    dyslexiaFont,
    highContrast,
    toggleTheme,
    setFontSize,
    setDyslexiaFont,
    setHighContrast,
    updatePreferences
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};