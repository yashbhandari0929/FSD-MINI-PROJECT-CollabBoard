import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket } from '../services/socket.js';
import { throttle } from '../utils/operationUtils.js';

export function useSocket({
  roomId,
  userName,
  onRemoteDraw,
  onSyncElements,
  onUserJoined,
  onUserLeft,
  onBoardSaved
}) {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [collaborators, setCollaborators] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});
  const socketRef = useRef(null);

  // Store callbacks in ref so effect dependencies do not trigger re-subscribing
  const callbacksRef = useRef({
    onRemoteDraw,
    onSyncElements,
    onUserJoined,
    onUserLeft,
    onBoardSaved
  });

  useEffect(() => {
    callbacksRef.current = {
      onRemoteDraw,
      onSyncElements,
      onUserJoined,
      onUserLeft,
      onBoardSaved
    };
  });

  // Throttled cursor broadcast
  const throttledCursorEmit = useRef(
    throttle((pos) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('cursor:move', pos);
      }
    }, 40)
  ).current;

  useEffect(() => {
    if (!roomId) return;

    const socket = connectSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setConnectionStatus('connected');
      socket.emit('room:join', { roomId, userName }, (res) => {
        if (res && res.success && res.user) {
          setCurrentUser(res.user);
        }
      });
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const handleConnectError = (err) => {
      console.warn('[Socket Connect Error]:', err.message);
      setConnectionStatus('error');
    };

    const handleRoomState = (data) => {
      if (data.elements && callbacksRef.current.onSyncElements) {
        callbacksRef.current.onSyncElements(data.elements);
      }
      if (data.users) {
        setCollaborators(data.users);
      }
      if (data.currentUser) {
        setCurrentUser(data.currentUser);
      }
    };

    const handleUserJoined = (data) => {
      if (data.users) {
        setCollaborators(data.users);
      }
      if (callbacksRef.current.onUserJoined && data.user) {
        callbacksRef.current.onUserJoined(data.user);
      }
    };

    const handleUserLeft = (data) => {
      if (data.users) {
        setCollaborators(data.users);
      }
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
      if (callbacksRef.current.onUserLeft && data.userName) {
        callbacksRef.current.onUserLeft(data.userName);
      }
    };

    const handleRemoteOperation = (element) => {
      if (callbacksRef.current.onRemoteDraw) {
        callbacksRef.current.onRemoteDraw(element);
      }
    };

    const handleSyncElements = (data) => {
      if (data.elements && callbacksRef.current.onSyncElements) {
        callbacksRef.current.onSyncElements(data.elements);
      }
    };

    const handleRemoteCursor = (data) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [data.socketId]: {
          userName: data.userName,
          color: data.color,
          position: data.position,
          lastActive: Date.now()
        }
      }));
    };

    const handleBoardSaved = (data) => {
      if (callbacksRef.current.onBoardSaved) {
        callbacksRef.current.onBoardSaved(data);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('room:state', handleRoomState);
    socket.on('room:user-joined', handleUserJoined);
    socket.on('room:user-left', handleUserLeft);
    socket.on('draw:remote-operation', handleRemoteOperation);
    socket.on('draw:sync-elements', handleSyncElements);
    socket.on('cursor:remote-move', handleRemoteCursor);
    socket.on('board:saved', handleBoardSaved);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('room:state', handleRoomState);
      socket.off('room:user-joined', handleUserJoined);
      socket.off('room:user-left', handleUserLeft);
      socket.off('draw:remote-operation', handleRemoteOperation);
      socket.off('draw:sync-elements', handleSyncElements);
      socket.off('cursor:remote-move', handleRemoteCursor);
      socket.off('board:saved', handleBoardSaved);
    };
  }, [roomId, userName]); // ONLY runs when roomId or userName changes!

  // Clean stale cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [key, val] of Object.entries(next)) {
          if (now - val.lastActive > 10000) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const emitDrawOperation = useCallback((element) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw:operation', element);
    }
  }, []);

  const emitCursorMove = useCallback((pos) => {
    throttledCursorEmit(pos);
  }, [throttledCursorEmit]);

  const emitUndo = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw:undo');
    }
  }, []);

  const emitRedo = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw:redo');
    }
  }, []);

  const emitClear = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw:clear');
    }
  }, []);

  const emitSaveBoard = useCallback((callback) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('board:save', {}, callback);
    }
  }, []);

  return {
    connectionStatus,
    collaborators,
    currentUser,
    remoteCursors,
    emitDrawOperation,
    emitCursorMove,
    emitUndo,
    emitRedo,
    emitClear,
    emitSaveBoard
  };
}
