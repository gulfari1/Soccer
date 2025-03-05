import requests
from bs4 import BeautifulSoup
import json
import re

def fetch_all_players(season='2024', league='EPL'):
    """
    Fetches all Premier League players' data from Understat.com
    
    Parameters:
    - season (str): The season year, e.g., '2023'
    - league (str): League identifier (EPL, La_liga, Bundesliga, etc.)
    
    Returns:
    - List of dictionaries containing complete player data
    """
    url = f'https://understat.com/league/{league}/{season}'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        scripts = soup.find_all('script')

        # Extract playersData JSON
        players_data = None
        for script in scripts:
            if 'playersData' in script.text:
                match = re.search(r"playersData\s*=\s*JSON\.parse\('(.*?)'\)", script.text)
                if match:
                    json_str = match.group(1).encode().decode('unicode_escape')
                    players_data = json.loads(json_str)
                    break

        if not players_data:
            print("No player data found in the page")
            return []

        # Extract and format relevant fields for all players
        keys_to_keep = [
            'id', 'player_name', 'games', 'time', 'goals', 'xG', 'assists', 'xA',
            'shots', 'key_passes', 'team_title', 'position', 'yellow_cards',
            'red_cards', 'npg', 'npxG', 'xGChain', 'xGBuildup'
        ]

        return [{
            key: player.get(key, 'N/A') 
            for key in keys_to_keep
        } for player in players_data]

    except requests.exceptions.RequestException as e:
        print(f'Request failed: {e}')
        return []
    except json.JSONDecodeError:
        print('Failed to parse player data')
        return []

def save_players_to_json(players, filename='../data/players.json'):
    """
    Saves player data to a JSON file.
    
    Parameters:
    - players (list): List of player dictionaries
    - filename (str): Name of the output JSON file
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(players, f, ensure_ascii=False, indent=4)
        print(f"Player data successfully saved to {filename}")
    except Exception as e:
        print(f"Error saving player data to JSON: {e}")

if __name__ == '__main__':
    # Fetch all players for the 2024 Premier League season
    all_players = fetch_all_players(season='2024', league='EPL')
    
    if all_players:
        # Print first 10 players for verification
        print(f"Total players fetched: {len(all_players)}")
        for idx, player in enumerate(all_players[:10], 1):
            print(f"\nPlayer #{idx}")
            for key, value in player.items():
                print(f"{key.replace('_', ' ').title()}: {value}")
        
        # Save all player data to players.json
        save_players_to_json(all_players)
    else:
        print("No player data fetched.")
