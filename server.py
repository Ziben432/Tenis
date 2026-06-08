import asyncio
import websockets
import json

connected_clients = []
ready_clients = set()

async def handler(websocket):
    global connected_clients, ready_clients
    
    if len(connected_clients) >= 2:
        await websocket.send(json.dumps({'type': 'error', 'msg': 'Server full. Max 2 players.'}))
        await websocket.close()
        return

    # Assign role
    role = 'P1' if len(connected_clients) == 0 else 'P2'
    connected_clients.append(websocket)
    print(f"[{role}] connected. Total: {len(connected_clients)}")
    
    await websocket.send(json.dumps({'type': 'role', 'role': role}))
    
    if len(connected_clients) == 2:
        print("Both players connected. Starting game!")
        for client in connected_clients:
            await client.send(json.dumps({'type': 'gameStart'}))
            
    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get('type')
            
            if msg_type == 'readyForCombat':
                ready_clients.add(websocket)
                print(f"[{role}] ready for combat.")
                if len(ready_clients) == 2:
                    print("Both players ready! Initiating combat.")
                    for client in connected_clients:
                        await client.send(json.dumps({'type': 'startCombat'}))
                    ready_clients.clear()
            else:
                # Forward other events to the opponent
                for client in connected_clients:
                    if client != websocket:
                        await client.send(message)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        if websocket in ready_clients:
            ready_clients.remove(websocket)
        print(f"[{role}] disconnected. Total: {len(connected_clients)}")
        # Notify remaining player
        for client in connected_clients:
            try:
                await client.send(json.dumps({'type': 'opponentDisconnected'}))
            except:
                pass

async def main():
    print("Starting WebSockets server on ws://0.0.0.0:8765")
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
