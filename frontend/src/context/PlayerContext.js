"use client"
// src/context/PlayerContext.js
import { createContext, useState, useContext } from 'react';

// Create a context
const PlayerContext = createContext();

// Define the available players
const PLAYER_INFO = [
  {
    name: 'Player 1',
    color: 'red',
    iconColor: 'text-red-500',
    chipColor: 'bg-red-500',
    border: 'border-red-400',
  },
  {
    name: 'Player 2',
    color: 'blue',
    iconColor: 'text-blue-500',
    chipColor: 'bg-blue-500',
    border: 'border-blue-400',
  },
];

export const PlayerProvider = ({ children }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const switchPlayer = () => {
    setCurrentPlayerIndex((prev) => (prev + 1) % PLAYER_INFO.length);
  };

  return (
    <PlayerContext.Provider value={{ currentPlayerIndex, switchPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};

// Custom hook to use the player context
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
