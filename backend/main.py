import os
import importlib.util
import threading
import json
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# === Directory Setup ===
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# === Game Logic ===
game_log = []
winner = None

class Observation:
    def __init__(self, board, mark):
        self.board = board
        self.mark = mark

class Configuration:
    def __init__(self, columns):
        self.columns = columns

# === Agent Loading ===
def load_agent(path: str, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.my_agent

# === Safe Execution with Timeout ===
class AgentThread(threading.Thread):
    def __init__(self, target_func, observation, configuration):
        super().__init__()
        self.target_func = target_func
        self.observation = observation
        self.configuration = configuration
        self.result = None
        self.exception = None

    def run(self):
        try:
            self.result = self.target_func(self.observation, self.configuration)
        except Exception as e:
            self.exception = e

def run_agent_sandbox(agent_func, observation, configuration, timeout=2):
    agent_thread = AgentThread(agent_func, observation, configuration)
    agent_thread.start()
    agent_thread.join(timeout)
    
    if agent_thread.is_alive():
        agent_thread.join()
        raise TimeoutError("Agent timed out.")
    
    if agent_thread.exception:
        raise agent_thread.exception
    
    return agent_thread.result

# === Win Detection ===
def check_win(board: list, mark: int, columns: int = 7):
    for row in range(6):
        for col in range(columns):
            if col + 3 < columns:  # Horizontal
                if all(board[row * columns + col + i] == mark for i in range(4)):
                    return True
            if row + 3 < 6:  # Vertical
                if all(board[(row + i) * columns + col] == mark for i in range(4)):
                    return True
            if row + 3 < 6 and col + 3 < columns:  # Diagonal right
                if all(board[(row + i) * columns + (col + i)] == mark for i in range(4)):
                    return True
            if row + 3 < 6 and col - 3 >= 0:  # Diagonal left
                if all(board[(row + i) * columns + (col - i)] == mark for i in range(4)):
                    return True
    return False

# === Game Simulation ===
def simulate_game(agent1_func, agent2_func, columns=7, max_moves=42):
    global game_log, winner
    game_log = []
    winner = None

    board = [0] * (columns * 6)
    mark = 1

    for turn in range(max_moves):
        obs = Observation(board[:], mark)
        config = Configuration(columns)
        agent = agent1_func if mark == 1 else agent2_func

        try:
            move = run_agent_sandbox(agent, obs, config)
        except Exception as e:
            winner = 3 - mark
            game_log.append({
                "turn": turn + 1,
                "player": mark,
                "move": "ERROR",
                "reason": str(e),
                "board": board[:]
            })
            return

        if not (0 <= move < columns):
            winner = 3 - mark
            game_log.append({
                "turn": turn + 1,
                "player": mark,
                "move": move,
                "reason": "Invalid column",
                "board": board[:]
            })
            return

        placed = False
        for row in range(5, -1, -1):
            idx = row * columns + move
            if board[idx] == 0:
                board[idx] = mark
                placed = True
                break
        if not placed:
            winner = 3 - mark
            game_log.append({
                "turn": turn + 1,
                "player": mark,
                "move": move,
                "reason": "Column full",
                "board": board[:]
            })
            return

        if check_win(board, mark, columns):
            winner = mark
            game_log.append({
                "turn": turn + 1,
                "player": mark,
                "move": move,
                "board": board[:],
                "result": "win"
            })
            return

        game_log.append({
            "turn": turn + 1,
            "player": mark,
            "move": move,
            "board": board[:]
        })

        mark = 3 - mark

    winner = 0  # draw

# === API Endpoints ===
@app.route('/simulate_game', methods=['GET'])
def api_simulate_game():
    try:
        # Load agents from uploaded files
        agent1 = load_agent(os.path.join(UPLOAD_DIR, "player1.py"), "agent1_module")
        agent2 = load_agent(os.path.join(UPLOAD_DIR, "player2.py"), "agent2_module")
        
        # Simulate the game
        simulate_game(agent1, agent2)

        result_str = "draw" if winner == 0 else f"player {winner} wins"
        output = {
            "result": result_str,
            "winner": winner,
            "log": game_log
        }

        # Extract player and move only
        player_moves = [{"player": entry["player"], "move": entry["move"]} for entry in output["log"]]

        # Return the result as JSON
        return jsonify(player_moves)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/get_move', methods=['GET'])
def get_move():
    try:
        player = int(request.args.get('player', 1))
        board_json = request.args.get('board', '[]')
        board = json.loads(board_json)
        
        if not board or len(board) != 42:  # 6x7 board
            return jsonify({"error": "Invalid board state"}), 400
            
        # Load the appropriate agent
        agent_path = os.path.join(UPLOAD_DIR, f"player{player}.py")
        agent = load_agent(agent_path, f"agent{player}_module")
        
        # Create observation and configuration
        obs = Observation(board, player)
        config = Configuration(7)  # 7 columns
        
        # Get the move from the agent
        move = run_agent_sandbox(agent, obs, config)
        
        return jsonify({"move": move})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# === Main Execution ===
if __name__ == "__main__":
    app.run(debug=True)
