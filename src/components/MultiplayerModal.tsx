import React, { useState } from 'react';
import { ArrowLeft, Globe, Plus, Shield, Signal, Users, Wifi } from 'lucide-react';
import { MultiplayerRoom } from '../types/game';

interface MultiplayerModalProps {
  onJoinRoom: (room: MultiplayerRoom) => void;
  onClose: () => void;
}

const DEFAULT_ROOMS: MultiplayerRoom[] = [
  {
    id: 'room_1',
    name: 'NH44 KSRTC & TNSTC Highway Convoy',
    route: 'Bengaluru - Mysuru Expressway',
    playersCount: 6,
    maxPlayers: 8,
    pingMs: 28,
    hostName: 'KSRTC_King_07'
  },
  {
    id: 'room_2',
    name: 'Mumbai - Pune Ghat Drifters',
    route: 'Mumbai - Pune Expressway',
    playersCount: 4,
    maxPlayers: 8,
    pingMs: 35,
    hostName: 'ShivneriRider'
  },
  {
    id: 'room_3',
    name: 'Himalayan Snow King Convoy',
    route: 'Delhi - Manali Himalayan Highway',
    playersCount: 7,
    maxPlayers: 8,
    pingMs: 42,
    hostName: 'HRTC_Pahadi'
  },
  {
    id: 'room_4',
    name: 'Royal Rajputana Sleeper Express',
    route: 'Jaipur to Udaipur Desert Corridor',
    playersCount: 3,
    maxPlayers: 8,
    pingMs: 38,
    hostName: 'DesiRathore'
  }
];

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  onJoinRoom,
  onClose
}) => {
  const [rooms, setRooms] = useState<MultiplayerRoom[]>(DEFAULT_ROOMS);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedRouteName, setSelectedRouteName] = useState('Bengaluru - Mysuru Expressway');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const newRoom: MultiplayerRoom = {
      id: `room_${Date.now()}`,
      name: newRoomName.trim(),
      route: selectedRouteName,
      playersCount: 1,
      maxPlayers: 8,
      pingMs: 24,
      hostName: 'Player (You)'
    };

    setRooms([newRoom, ...rooms]);
    setShowCreate(false);
    onJoinRoom(newRoom);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-xl flex flex-col text-white overflow-y-auto p-4 md:p-8">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-white/10 active:scale-95 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Globe size={22} className="text-cyan-400" />
              ONLINE MULTIPLAYER CONVOY
            </h2>
            <p className="text-xs text-neutral-400">Drive together with other Indian bus drivers on shared highways</p>
          </div>
        </div>

        {/* Server Status Badge */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-400">
          <Wifi size={16} />
          <span>India Server: Connected (32ms)</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center my-4">
        <div className="text-xs font-bold text-neutral-400">
          Active Convoys ({rooms.length} Rooms Online)
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2 rounded-xl text-xs shadow-lg transition-all active:scale-95"
        >
          <Plus size={16} />
          Create Convoy Room
        </button>
      </div>

      {/* Create Room Form Modal Drawer */}
      {showCreate && (
        <form
          onSubmit={handleCreateRoom}
          className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-4 mb-4 shadow-xl"
        >
          <h3 className="text-sm font-black text-amber-400 mb-3">Host New Multiplayer Room</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Room Name</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Bangalore Express Club"
                required
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Convoy Highway Route</label>
              <select
                value={selectedRouteName}
                onChange={(e) => setSelectedRouteName(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Bengaluru - Mysuru Expressway">Bengaluru - Mysuru Expressway</option>
                <option value="Mumbai - Pune Expressway">Mumbai - Pune Expressway</option>
                <option value="Delhi - Manali Himalayan Highway">Delhi - Manali Himalayan Highway</option>
                <option value="Jaipur to Udaipur Desert Corridor">Jaipur to Udaipur Desert Corridor</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-1.5 rounded-xl text-xs bg-neutral-800 text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs bg-amber-500 text-black font-bold"
            >
              Start Room
            </button>
          </div>
        </form>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-neutral-900/70 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-neutral-950 text-cyan-400 border border-white/10 flex items-center gap-1">
                  <Signal size={12} className="text-emerald-400" />
                  {room.pingMs} ms
                </span>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Users size={14} />
                  {room.playersCount} / {room.maxPlayers} Buses
                </span>
              </div>

              <h4 className="text-base font-black text-white">{room.name}</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Route: {room.route}</p>
              <div className="text-[11px] text-neutral-500 mt-2">
                Host: <span className="text-neutral-300 font-semibold">{room.hostName}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => onJoinRoom(room)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Users size={14} />
                JOIN CONVOY
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
