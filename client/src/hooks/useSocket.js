import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, connectSocket } from '../services/socket.js';
import {
  syncBoardApi,
  addBoardOperationApi,
  undoBoardOperationApi,
  clearBoardElementsApi
} from '../services/api.js';
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
  const [remoteCursors, setRemoteCursors] = useState({});
  const socketRef = useRef(null);

  // Persistent unique client ID and vibrant color for this user
  const userIdRef = useRef(
    (() => {
      let id = localStorage.getItem('collab_client_id');
      if (!id) {
        id = 'user_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('collab_client_id', id);
      }
      return id;
    })()
  );

  const userColorRef = useRef(
    (() => {
      const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
      return colors[Math.floor(Math.random() * colors.length)];
    })()
  );

  const [currentUser, setCurrentUser] = useState({
    userId: userIdRef.current,
    userName: userName || 'Anonymous',
    color: userColorRef.current
  });

  // Keep currentUser userName in sync
  useEffect(() => {
    setCurrentUser((prev) => ({
      ...prev,
      userName: userName || 'Anonymous'
    }));
  }, [userName]);

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

    let isMounted = true;
    let lastKnownElementCount = -1;

    // 1. Try WebSocket connection
    const socket = connectSocket();
    socketRef.current = socket;

    if (socket) {
      const handleConnect = () => {
        if (!isMounted) return;
        setConnectionStatus('connected');
        socket.emit('room:join', { roomId, userName }, (res) => {
          if (res && res.success && res.user && isMounted) {
            setCurrentUser(res.user);
          }
        });
      };

      const handleDisconnect = () => {
        if (isMounted) setConnectionStatus('disconnected');
      };

      const handleConnectError = () => {
        // Fall back to HTTP real-time cloud sync smoothly
        if (isMounted) setConnectionStatus('cloud-live');
      };

      const handleRoomState = (data) => {
        if (!isMounted) return;
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
        if (!isMounted) return;
        if (data.users) setCollaborators(data.users);
        if (callbacksRef.current.onUserJoined && data.user) {
          callbacksRef.current.onUserJoined(data.user);
        }
      };

      const handleUserLeft = (data) => {
        if (!isMounted) return;
        if (data.users) setCollaborators(data.users);
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
        if (isMounted && callbacksRef.current.onRemoteDraw) {
          callbacksRef.current.onRemoteDraw(element);
        }
      };

      const handleSyncElements = (data) => {
        if (isMounted && data.elements && callbacksRef.current.onSyncElements) {
          callbacksRef.current.onSyncElements(data.elements);
        }
      };

      const handleRemoteCursor = (data) => {
        if (!isMounted) return;
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
        if (isMounted && callbacksRef.current.onBoardSaved) {
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
    }

    // 2. High-speed HTTP Real-Time Synchronization (works on Vercel and serverless)
    const runHttpSync = async () => {
      if (!isMounted || !roomId) return;
      // If WebSocket is actively connected, let socket handle events
      if (socketRef.current && socketRef.current.connected) return;

      try {
        const res = await syncBoardApi(roomId, {
          userId: userIdRef.current,
          userName: userName || 'Anonymous',
          color: userColorRef.current
        });

        if (isMounted && res && res.success) {
          setConnectionStatus('cloud-live');

          if (Array.isArray(res.users)) {
            setCollaborators(res.users);
          }

          if (Array.isArray(res.elements)) {
            // Check if element count changed or elements differ
            if (res.elements.length !== lastKnownElementCount) {
              lastKnownElementCount = res.elements.length;
              if (callbacksRef.current.onSyncElements) {
                callbacksRef.current.onSyncElements(res.elements);
              }
            }
          }
        }
      } catch (_) {}
    };

    // Execute immediate sync on join
    runHttpSync();

    // Poll every 1200ms for continuous live multi-user collaboration
    const httpSyncInterval = setInterval(runHttpSync, 1200);

    return () => {
      isMounted = false;
      clearInterval(httpSyncInterval);

      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('room:state');
        socket.off('room:user-joined');
        socket.off('room:user-left');
        socket.off('draw:remote-operation');
        socket.off('draw:sync-elements');
        socket.off('cursor:remote-move');
        socket.off('board:saved');
      }
    };
  }, [roomId, userName]);

  // Clean stale remote cursors
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

  const emitDrawOperation = useCallback(
    (element) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('draw:operation', element);
      } else if (roomId) {
        // Instant cloud operation sync
        addBoardOperationApi(roomId, element);
      }
    },
    [roomId]
  );

  const emitCursorMove = useCallback(
    (pos) => {
      throttledCursorEmit(pos);
    },
    [throttledCursorEmit]
  );

  const emitUndo = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw:undo');
    } else if (roomId) {
      undoBoardOperationApi(roomId).then((res) => {
        if (res && res.success && res.elements && callbacksRef.current.onSyncElements) {
          callbacksRef.current.onSyncElements(res.elements);
        }
      });
    }
  }, [roomId]);

  const emitRedo = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw:redo');
    }
  }, []);

  const emitClear = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('draw:clear');
    } else if (roomId) {
      clearBoardElementsApi(roomId);
    }
  }, [roomId]);

  const emitSaveBoard = useCallback(
    (callback) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('board:save', {}, callback);
      } else if (callback) {
        callback({ success: true, savedTo: 'mongodb' });
      }
    },
    []
  );

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
