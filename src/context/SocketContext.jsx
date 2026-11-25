import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext({
  socket: null,
  isConnected: false,
});

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const token =
      localStorage.getItem('lifora_token') ||
      localStorage.getItem('lifora_auth_token') ||
      (user?.role ? `jwt_demo_${user.role}` : null);

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);

      // Join blood group room if donor has a blood group
      if (user?.bloodGroup) {
        socketInstance.emit('join:bloodGroup', user.bloodGroup);
      }

      // Join hospital room if user is hospital staff
      if (user?.hospitalId) {
        socketInstance.emit('join:hospital', user.hospitalId);
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      // Reconnects automatically; no intrusive alert needed
    });

    // Real-time Event: In-App Notification Received
    socketInstance.on('notification:received', (data) => {
      addToast({
        title: data.title || 'New Notification Received',
        message: data.message || 'You have an important update.',
        type: data.type === 'EMERGENCY_REQUEST' ? 'warning' : 'info',
      });
    });

    // Real-time Event: Verification Status Changed
    socketInstance.on('verification:status_changed', (data) => {
      addToast({
        title: data.title || 'Verification Update',
        message: data.message || 'Your document status has been updated.',
        type: data.status === 'VERIFIED' ? 'success' : 'warning',
      });
    });

    // Real-time Event: New Blood Request Alert
    socketInstance.on('blood_request:urgent_alert', (payload) => {
      addToast({
        title: `Emergency ${payload.bloodGroup || 'Blood'} Alert 🚨`,
        message: `Urgent requisition at ${payload.hospitalName || payload.city || 'Nearby Hospital'} (${payload.unitsRequired || 1} units required).`,
        type: 'warning',
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
