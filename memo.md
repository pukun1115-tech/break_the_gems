### from server
|type|message|
|:---|:---|
|```init```|```{ type: "init", id: string, players: Array.from(Game.players.values()), team_point: { "red": number, "blue": number }, chunks: Record<string, Array<Array<Array<number>>> }```|
|```player_joined```|```{ type: "player_joined", id: string }```|
|```player_left```|```{ type: "player_left", id: string }```|
|```update_map```|```{ type: "update_map", chunk_key: string, pos: { x: number, y: number, z: number }, block: number }```|
|```update_players```|```{ type: "update_players", players: Array.from(Game.players.values()) }```|
### from client
|type|message|
|:---|:---|
|```input```|```{ type: "input", input: { key_inputs: Record<string, boolean>, mouse_inputs: { left_click: boolean, right_click: boolean }}}```|
|```rot```|```{ type: "rot", rot: { x: number, y: number, z: number } }```|