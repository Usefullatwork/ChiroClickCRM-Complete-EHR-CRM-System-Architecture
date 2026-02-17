/**
 * usePatientPresence - Track who else is viewing a patient
 *
 * Emits patient:viewing on mount, patient:leaving on unmount.
 * Listens for patient:user-joined and patient:user-left events.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, useSocketEvent } from '../services/socket';

export default function usePatientPresence(patientId, currentUserName) {
  const [viewers, setViewers] = useState([]);
  const patientIdRef = useRef(patientId);
  patientIdRef.current = patientId;

  // On mount: emit viewing and request current viewers
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !patientId) {
      return;
    }

    // Tell server we're viewing this patient
    socket.emit('patient:viewing', { patientId, userName: currentUserName });

    // Request who else is viewing
    socket.emit('patient:who-viewing', { patientId }, (currentViewers) => {
      setViewers(currentViewers || []);
    });

    return () => {
      // Tell server we're leaving
      socket.emit('patient:leaving', { patientId });
      setViewers([]);
    };
  }, [patientId, currentUserName]);

  // Listen for new viewers
  useSocketEvent(
    'patient:user-joined',
    useCallback((data) => {
      if (data.patientId !== patientIdRef.current) {
        return;
      }
      setViewers((prev) => {
        // Avoid duplicates
        if (prev.some((v) => v.userId === data.userId)) {
          return prev;
        }
        return [...prev, { userId: data.userId, name: data.userName }];
      });
    }, [])
  );

  // Listen for viewers leaving
  useSocketEvent(
    'patient:user-left',
    useCallback((data) => {
      if (data.patientId !== patientIdRef.current) {
        return;
      }
      setViewers((prev) => prev.filter((v) => v.userId !== data.userId));
    }, [])
  );

  return viewers;
}
