import os
import shutil
import importlib.util
import multiprocessing
import numpy as np

# === Directory Setup ===
UPLOAD_DIR = "uploaded_models"
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
def load_agent(path: str):
    spec = importlib.util.spec_from_file_location("agent_module", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.my_agent


# === Safe Execution ===
def run_agent_sandbox(agent_func, observation, configuration, timeout=2):
    def target(queue):
        try:
            result = agent_func(observation, configuration)
            queue.put(result)
        except Exception as e:
            queue.put(e)

    q = multiprocessing.Queue()
    p = multiprocessing.Process(target=target, args=(q,))
    p.start()
    p.join(timeout)

    if p.is_alive():
        p.terminate()
        raise TimeoutError("Agent timed out.")
    result = q.get()
    if isinstance(result, Exception):
        raise result
    return result


# === Win Detection ===
def check_win(board: list, mark: int, columns: int = 7):
    # Check horizontal, vertical, diagonal
    for row in range(6):
        for col in range(columns):
            if col + 3 < columns:  # Horizontal check
                if all(board[row * columns + col + i] == mark for i in range(4)):
                    return True
            if row + 3 < 6:  # Vertical check
                if all(board[(row + i) * columns + col] == mark for i in range(4)):
                    return True
            if row + 3 < 6 and col + 3 < columns:  # Diagonal check (down-right)
                if all(board[(row + i) * columns + (col + i)] == mark for i in range(4)):
                    return True
            if row + 3 < 6 and col - 3 >= 0:  # Diagonal check (down-left)
                if all(board[(row + i) * columns + (col - i)] == mark for i in range(4)):
                    return True
    return False


# === Game Simulation ===
def simulate_game(columns=7, max_moves=42):
    global game_log, winner
    game_log = []
    winner = None

    agent1 = load_agent(os.path.join(UPLOAD_DIR, "player1.py"))
    agent2 = load_agent(os.path.join(UPLOAD_DIR, "player2.py"))

    board = [0] * (columns * 6)
    mark = 1

    for turn in range(max_moves):
        obs = Observation(board[:], mark)
        config = Configuration(columns)
        agent = agent1 if mark == 1 else agent2

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

        # Check for win
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


# === Main Execution ===
if __name__ == "__main__":
    # Simulate the game with the models uploaded to the server
    try:
        simulate_game()
        result = "draw" if winner == 0 else f"player {winner} wins"
        print(f"Game Over: {result}")
        print("Game Log:")
        for entry in game_log:
            print(f"Turn {entry['turn']} - Player {entry['player']} played column {entry['move']}")
            print(f"Board:")
            board = entry['board']
            for i in range(6):
                print(f"| {' '.join(str(board[i*7 + j]) for j in range(7))} |")
            print("-" * 20)

    except Exception as e:
        print(f"Error: {str(e)}")