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
  const [theme, setTheme] = useState('light');
  
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
    
    // Apply light theme only
    root.setAttribute('data-theme', 'light');
    
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
    localStorage.setItem('theme', 'light');
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('dyslexiaFont', dyslexiaFont);
    localStorage.setItem('highContrast', highContrast);
  }, [theme, fontSize, dyslexiaFont, highContrast]);

  const toggleTheme = undefined;

  const updatePreferences = (preferences) => {
    // Ignore darkMode preference
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