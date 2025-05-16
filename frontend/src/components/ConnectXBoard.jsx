"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { FaUserCircle, FaRobot } from "react-icons/fa";
import { usePlayer } from "../context/PlayerContext";
import { useSearchParams } from "next/navigation";

const PLAYER_INFO = [
  {
    name: "Player 1",
    color: "red",
    iconColor: "text-red-500",
    chipColor: "bg-red-500",
    border: "border-red-400",
  },
  {
    name: "Player 2",
    color: "blue",
    iconColor: "text-blue-500",
    chipColor: "bg-blue-500",
    border: "border-blue-400",
  },
];

const ROWS = 6;
const COLS = 7;

export default function ConnectXBoard() {
  const searchParams = useSearchParams();
  const {
    currentPlayerIndex,
    switchPlayer,
    playerTypes,
    updatePlayerTypes,
    isGameActive,
    setIsGameActive,
  } = usePlayer();

  const [grid, setGrid] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [moveMade, setMoveMade] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameLog, setGameLog] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [arePlayerTypesLoaded, setArePlayerTypesLoaded] = useState(false);
  const botMoveTimeoutRef = useRef(null);
  const simulationIntervalRef = useRef(null);

  // Initialize player types from URL parameters
  useEffect(() => {
    const player1Type = searchParams.get("player1") || "human";
    const player2Type = searchParams.get("player2") || "human";
    updatePlayerTypes(player1Type, player2Type);
  }, [searchParams, updatePlayerTypes]);

  const fetchBotVsBotGame = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/simulate_game");
      setGameLog(response.data);
      setIsGameActive(false);
      setCurrentMoveIndex(0);
      setWinner(null);
      setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    } catch (error) {
      console.error("Error fetching game result:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    setIsLoading,
    setGameLog,
    setIsGameActive,
    setCurrentMoveIndex,
    setWinner,
    setGrid,
  ]);

  useEffect(() => {
    if (
      playerTypes &&
      playerTypes.length === 2 &&
      playerTypes[0] !== null &&
      playerTypes[1] !== null
    ) {
      setArePlayerTypesLoaded(true);
      if (playerTypes[0] === "bot" && playerTypes[1] === "bot") {
        fetchBotVsBotGame();
      }
    } else {
      setArePlayerTypesLoaded(false);
    }
  }, [playerTypes, fetchBotVsBotGame]);

  const flattenGrid = useCallback(() => {
    const flattened = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === "red") flattened.push(1);
        else if (grid[r][c] === "blue") flattened.push(2);
        else flattened.push(0);
      }
    }
    return flattened;
  }, [grid]);

  const fetchBotMove = useCallback(
    async (playerIndex) => {
      try {
        const boardState = flattenGrid();
        const endpoint = `http://localhost:5000/get_move?player=${
          playerIndex + 1
        }&board=${encodeURIComponent(JSON.stringify(boardState))}`;
        const response = await axios.get(endpoint);
        return response.data.move;
      } catch (error) {
        console.error(
          `Error fetching move for player ${playerIndex + 1}:`,
          error
        );
        return null;
      }
    },
    [flattenGrid]
  );

  const handleColumnClick = useCallback(
    (col) => {
      if (
        winner ||
        !isGameActive ||
        playerTypes[currentPlayerIndex] === "bot" ||
        gameLog
      )
        return;

      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => [...row]);
        for (let row = ROWS - 1; row >= 0; row--) {
          if (!newGrid[row][col]) {
            newGrid[row][col] = PLAYER_INFO[currentPlayerIndex].color;
            setMoveMade(true);
            return newGrid;
          }
        }
        return prevGrid;
      });
    },
    [
      currentPlayerIndex,
      winner,
      playerTypes,
      isGameActive,
      gameLog,
      setGrid,
      setMoveMade,
    ]
  );

  const checkWinner = useCallback(() => {
    const checkLine = (r, c, dr, dc) => {
      const color = grid[r][c];
      if (!color) return false;
      for (let i = 1; i < 4; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (
          nr < 0 ||
          nr >= ROWS ||
          nc < 0 ||
          nc >= COLS ||
          grid[nr][nc] !== color
        )
          return false;
      }
      return true;
    };

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const colorOnGrid = grid[r][c];
        if (colorOnGrid) {
          if (
            checkLine(r, c, 0, 1) ||
            checkLine(r, c, 1, 0) ||
            checkLine(r, c, 1, 1) ||
            checkLine(r, c, 1, -1)
          ) {
            const winningPlayerIndex = PLAYER_INFO.findIndex(
              (p) => p.color === colorOnGrid
            );
            if (winningPlayerIndex !== -1) {
              setWinner(winningPlayerIndex);
              setIsGameActive(false);
              return true;
            }
          }
        }
      }
    }
    return false;
  }, [grid, setWinner, setIsGameActive]);

  const checkDraw = useCallback(() => {
    if (winner) return false;
    return grid.every((row) => row.every((cell) => cell !== null));
  }, [grid, winner]);

  useEffect(() => {
    if (moveMade) {
      const hasWinner = checkWinner();
      const isDraw = !hasWinner && checkDraw();

      if (isDraw) {
        setIsGameActive(false);
      }

      if (!hasWinner && !isDraw) {
        switchPlayer();
      }
      setMoveMade(false);
    }
  }, [
    moveMade,
    checkWinner,
    checkDraw,
    switchPlayer,
    setIsGameActive,
    setMoveMade,
  ]);

  useEffect(() => {
    if (
      arePlayerTypesLoaded &&
      isGameActive &&
      !winner &&
      playerTypes[currentPlayerIndex] === "bot" &&
      !gameLog
    ) {
      if (botMoveTimeoutRef.current) {
        clearTimeout(botMoveTimeoutRef.current);
      }
      botMoveTimeoutRef.current = setTimeout(async () => {
        const botMoveCol = await fetchBotMove(currentPlayerIndex);
        if (botMoveCol !== null) {
          setGrid((prevGrid) => {
            const newGrid = prevGrid.map((row) => [...row]);
            for (let row = ROWS - 1; row >= 0; row--) {
              if (!newGrid[row][botMoveCol]) {
                newGrid[row][botMoveCol] =
                  PLAYER_INFO[currentPlayerIndex].color;
                break;
              }
            }
            return newGrid;
          });
          setMoveMade(true);
        }
      }, 1000);
    }
    return () => {
      if (botMoveTimeoutRef.current) {
        clearTimeout(botMoveTimeoutRef.current);
      }
    };
  }, [
    arePlayerTypesLoaded,
    currentPlayerIndex,
    playerTypes,
    isGameActive,
    winner,
    fetchBotMove,
    gameLog,
    setGrid,
    setMoveMade,
  ]);

  useEffect(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    if (gameLog && currentMoveIndex < gameLog.length && !winner) {
      simulationIntervalRef.current = setInterval(() => {
        if (!gameLog || currentMoveIndex >= gameLog.length || winner) {
          if (simulationIntervalRef.current)
            clearInterval(simulationIntervalRef.current);
          return;
        }

        const moveData = gameLog[currentMoveIndex];
        setGrid((prevGrid) => {
          const newGrid = prevGrid.map((row) => [...row]);
          if (moveData && typeof moveData.move === "number") {
            for (let row = ROWS - 1; row >= 0; row--) {
              if (!newGrid[row][moveData.move]) {
                newGrid[row][moveData.move] =
                  PLAYER_INFO[moveData.player - 1].color;
                break;
              }
            }
          }
          return newGrid;
        });

        setCurrentMoveIndex((prevIndex) => prevIndex + 1);
        const gameHasEnded = checkWinner();
        if (gameHasEnded) {
          if (simulationIntervalRef.current)
            clearInterval(simulationIntervalRef.current);
        }
      }, 1000);
    } else if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [
    gameLog,
    currentMoveIndex,
    winner,
    checkWinner,
    setGrid,
    setCurrentMoveIndex,
  ]);

  useEffect(() => {
    return () => {
      if (botMoveTimeoutRef.current) {
        clearTimeout(botMoveTimeoutRef.current);
      }
    };
  }, []);

  const renderWinnerMessage = () => {
    if (winner === null) return null;
    const winnerPlayer = PLAYER_INFO[winner];
    if (!winnerPlayer) return null;

    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <div className="p-6 rounded-lg bg-gray-800/90 shadow-lg text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            {winnerPlayer.name} wins!
          </h1>
          <button
            onClick={handleReplay}
            className="mt-4 py-2 px-6 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  };

  const renderDrawMessage = () => {
    if (winner !== null) return null;
    return (
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <div className="p-6 rounded-lg bg-gray-800/90 shadow-lg text-center">
          <h1 className="text-3xl font-bold text-white mb-4">It's a draw!</h1>
          <button
            onClick={handleReplay}
            className="mt-4 py-2 px-6 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  };

  const handleReplay = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setWinner(null);
    setCurrentMoveIndex(0);
    setGameLog(null);
    setIsGameActive(true);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    if (playerTypes[0] === "bot" && playerTypes[1] === "bot") {
      setGameLog(null);
      fetchBotVsBotGame();
    } else {
      setGameLog(null);
    }
  };

  if (!arePlayerTypesLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-rose-100">
        <div className="text-2xl font-semibold text-gray-700">
          Loading game settings...
        </div>
      </div>
    );
  }

  if (
    isLoading &&
    !gameLog &&
    !(
      playerTypes[0] === "bot" &&
      playerTypes[1] === "bot" &&
      !arePlayerTypesLoaded
    )
  ) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-rose-100">
        <div className="text-2xl font-semibold text-gray-700">
          Loading game...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-rose-100 px-4 py-8 relative">
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-12 mb-10">
        {PLAYER_INFO.map((player, index) => {
          let displayPlayerForActiveIndicator = currentPlayerIndex;
          if (
            gameLog &&
            gameLog.length > 0 &&
            playerTypes[0] === "bot" &&
            playerTypes[1] === "bot"
          ) {
            const lastMoveProcessedIndex = Math.max(0, currentMoveIndex - 1);
            if (gameLog[lastMoveProcessedIndex]) {
              displayPlayerForActiveIndicator =
                gameLog[lastMoveProcessedIndex].player - 1;
            } else if (gameLog[0]) {
              displayPlayerForActiveIndicator = gameLog[0].player - 1;
            }
          }
          const isActive = index === displayPlayerForActiveIndicator;
          const isBot = playerTypes[index] === "bot";

          return (
            <div
              key={index}
              className={`relative flex items-center justify-between rounded-2xl shadow-lg px-6 py-4 w-72 bg-white border-2 transition-all duration-200
                ${
                  isActive
                    ? `${player.border} ring-2 ring-offset-2 ring-white scale-[1.03]`
                    : "border-white/50"
                }`}
            >
              <div className="flex items-center space-x-3">
                {isBot ? (
                  <FaRobot className={`w-10 h-10 ${player.iconColor}`} />
                ) : (
                  <FaUserCircle className={`w-10 h-10 ${player.iconColor}`} />
                )}
                <span className="text-lg font-medium text-gray-700">
                  {player.name}
                </span>
              </div>
              <div
                className={`w-8 h-8 rounded-full shadow-md border-2 border-white ${player.chipColor}`}
                title={player.color}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 p-4 rounded-3xl shadow-xl border-2 border-blue-300 bg-blue-200 backdrop-blur-sm">
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <div
            key={colIndex}
            onClick={() => handleColumnClick(colIndex)}
            className={`flex flex-col gap-2 ${
              isGameActive && playerTypes[currentPlayerIndex] === "human"
                ? "cursor-pointer"
                : "cursor-default"
            }`}
          >
            {Array.from({ length: ROWS }).map((_, rowIndex) => {
              const cell = grid[rowIndex][colIndex];
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border transition-all duration-100 shadow-inner 
                    ${
                      cell === "red"
                        ? "bg-red-500"
                        : cell === "blue"
                        ? "bg-blue-500"
                        : "bg-white hover:bg-gray-100"
                    }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {winner !== null && renderWinnerMessage()}

      {!winner && checkDraw() && renderDrawMessage()}
    </div>
  );
}
