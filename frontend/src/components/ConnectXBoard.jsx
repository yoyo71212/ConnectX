'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext'; // Import the Player Context

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

const ROWS = 6;
const COLS = 7;

export default function ConnectXBoard() {
  const { currentPlayerIndex, switchPlayer } = usePlayer(); // Use the context to get current player and switch function
  const [grid, setGrid] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [moveMade, setMoveMade] = useState(false); // Track if a move is made
  const [winner, setWinner] = useState(null); // Track the winner

  // Handle when a column is clicked
  const handleColumnClick = useCallback((col) => {
    if (winner) return; // Prevent moves if there's a winner

    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row) => [...row]);
      for (let row = ROWS - 1; row >= 0; row--) {
        if (!newGrid[row][col]) {
          newGrid[row][col] = PLAYER_INFO[currentPlayerIndex].color;
          setMoveMade(true); // Mark that a move has been made
          return newGrid;
        }
      }
      return prevGrid; // No change if column is full
    });
  }, [currentPlayerIndex, winner]);

  // Check for win conditions
  const checkWinner = useCallback(() => {
    // Helper function to check 4 consecutive pieces
    const checkLine = (r, c, dr, dc) => {
      const color = grid[r][c];
      for (let i = 1; i < 4; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || grid[nr][nc] !== color) {
          return false;
        }
      }
      return true;
    };

    // Check for horizontal, vertical, and diagonal wins
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) {
          // Check horizontal, vertical, and diagonal directions
          if (
            checkLine(r, c, 0, 1) ||  // Horizontal
            checkLine(r, c, 1, 0) ||  // Vertical
            checkLine(r, c, 1, 1) ||  // Diagonal (bottom-left to top-right)
            checkLine(r, c, 1, -1)    // Diagonal (top-left to bottom-right)
          ) {
            setWinner(currentPlayerIndex); // Set winner
            return;
          }
        }
      }
    }
  }, [grid, currentPlayerIndex]);

  // Effect hook to switch players only when a move is made
  useEffect(() => {
    if (moveMade) {
      checkWinner(); // Check for a winner after every move
      if (!winner) {
        switchPlayer(); // Switch player after the move if no winner
      }
      setMoveMade(false); // Reset the move flag
    }
  }, [moveMade, winner, switchPlayer, checkWinner]);

  // Render winner message
  const renderWinnerMessage = () => {
    const winnerPlayer = PLAYER_INFO[winner];
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-opacity-50 bg-gray-800 text-white text-3xl font-bold">
        <div className="p-4 rounded-lg bg-blue-500/70 shadow-lg">
          <h1>{winnerPlayer.name} wins!</h1>
          <button
            onClick={handleReplay}
            className="mt-4 py-2 px-6 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  };

  // Reset game to initial state
  const handleReplay = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setWinner(null);
    switchPlayer(); // Reset to starting player
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-white to-rose-100 px-4 py-8 relative">
      
      {/* Player Cards */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 mb-10">
        {PLAYER_INFO.map((player, index) => {
          const isActive = index === currentPlayerIndex;
          return (
            <div
              key={index}
              className={`relative flex items-center justify-between rounded-2xl shadow-md px-6 py-4 w-72 backdrop-blur-md bg-white/40 border-2 transition-all duration-200
                ${isActive ? `${player.border} ring-2 ring-offset-2 ring-white scale-[1.03]` : 'border-white/50'}
              `}
            >
              <div className="flex items-center space-x-3">
                <FaUserCircle className={`w-10 h-10 ${player.iconColor}`} />
                <span className="text-lg font-medium text-gray-700">{player.name}</span>
              </div>
              <div
                className={`w-8 h-8 rounded-full shadow-md border-2 border-white ${player.chipColor}`}
                title={player.color}
              />
            </div>
          );
        })}
      </div>

      {/* Game Board */}
      <div className="flex gap-2 p-4 rounded-3xl shadow-xl border-2 border-blue-300 bg-blue-200/60 backdrop-blur-sm">
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <div
            key={colIndex}
            onClick={() => handleColumnClick(colIndex)}
            className="flex flex-col gap-2 cursor-pointer"
          >
            {Array.from({ length: ROWS }).map((_, rowIndex) => {
              const cell = grid[rowIndex][colIndex];
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border transition-all duration-100 shadow-inner 
                    ${cell === 'red' ? 'bg-red-500' : cell === 'blue' ? 'bg-blue-500' : 'bg-white hover:bg-gray-100'}
                  `}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Display Winner Message */}
      {winner !== null && renderWinnerMessage()}
    </div>
  );
}
