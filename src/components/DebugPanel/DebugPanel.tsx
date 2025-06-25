import React from 'react';
import { useGame } from '../../context/GameContext';

const DebugPanel: React.FC = () => {
  const { state } = useGame();
  
  const debugInfo = {
    mapId: state.currentMap?.id || 'NO MAP',
    mapName: state.currentMap?.name || 'NO MAP NAME',
    playerPos: `(${state.player?.position?.x ?? 'null'}, ${state.player?.position?.y ?? 'null'})`,
    playerPosValid: !isNaN(state.player?.position?.x) && !isNaN(state.player?.position?.y),
    playerHP: `${state.player?.stats?.hp ?? '?'}/${state.player?.stats?.maxHp ?? '?'}`,
    enemies: state.enemies?.length ?? 0,
    npcs: state.npcs?.length ?? 0,
    items: state.items?.length ?? 0,
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'lime',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      border: '1px solid lime',
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: 'lime' }}>DEBUG PANEL</h3>
      <div>Map: {debugInfo.mapName} ({debugInfo.mapId})</div>
      <div>Player Pos: {debugInfo.playerPos}</div>
      <div>Pos Valid: {debugInfo.playerPosValid ? 'YES' : 'NO'}</div>
      <div>Player HP: {debugInfo.playerHP}</div>
      <div>Entities: {debugInfo.enemies} enemies, {debugInfo.npcs} NPCs, {debugInfo.items} items</div>
    </div>
  );
};

export default DebugPanel;