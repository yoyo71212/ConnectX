"use client"
import { useState } from "react"
import { FaUserCircle, FaRobot } from "react-icons/fa"
import { useRouter } from "next/navigation"
import React from "react"

export default function GameSetup() {
  const router = useRouter()
  const [player1Type, setPlayer1Type] = useState("human")
  const [player2Type, setPlayer2Type] = useState("bot")

  const handleStartGame = () => {
    // Navigate to the game page with player types as query parameters
    router.push(`/game?player1=${player1Type}&player2=${player2Type}`)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-rose-100 px-4 py-8">
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-md rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Connect 4 Game Setup</h1>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Player 1 (Red)</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setPlayer1Type("human")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  player1Type === "human"
                    ? "border-red-500 bg-red-100 text-red-700"
                    : "border-gray-300 hover:border-red-300 text-gray-600"
                }`}
              >
                <FaUserCircle className="text-xl" />
                <span>Human</span>
              </button>
              <button
                onClick={() => setPlayer1Type("bot")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  player1Type === "bot"
                    ? "border-red-500 bg-red-100 text-red-700"
                    : "border-gray-300 hover:border-red-300 text-gray-600"
                }`}
              >
                <FaRobot className="text-xl" />
                <span>RL Agent</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Player 2 (Blue)</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setPlayer2Type("human")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  player2Type === "human"
                    ? "border-blue-500 bg-blue-100 text-blue-700"
                    : "border-gray-300 hover:border-blue-300 text-gray-600"
                }`}
              >
                <FaUserCircle className="text-xl" />
                <span>Human</span>
              </button>
              <button
                onClick={() => setPlayer2Type("bot")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  player2Type === "bot"
                    ? "border-blue-500 bg-blue-100 text-blue-700"
                    : "border-gray-300 hover:border-blue-300 text-gray-600"
                }`}
              >
                <FaRobot className="text-xl" />
                <span>RL Agent</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          className="w-full mt-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg shadow-md hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Start Game
        </button>
      </div>
    </div>
  )
}
