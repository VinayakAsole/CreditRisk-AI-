/**
 * timelineService.js — Firestore CRUD for borrower contact timelines
 *
 * Data structure in Firestore:
 *   borrowers/{borrowerId}/contactEvents/{eventId}
 *
 * All functions gracefully return early / return [] when Firebase
 * is not configured — so every existing feature keeps working.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../firebase';

// ── Collection reference helper ─────────────────────────────────
const eventsRef = (borrowerId) =>
  collection(db, 'borrowers', borrowerId, 'contactEvents');

// ── INSERT: Save a single contact event to Firestore ───────────
/**
 * @param {string} borrowerId  e.g. 'CR-9921'
 * @param {object} event       { icon, type, note, date, agent, id }
 * @param {string} borrowerName e.g. 'Amit Sharma'
 * @returns {string|null}      Firestore document ID, or null on failure
 */
export async function saveContactEvent(borrowerId, event, borrowerName) {
  if (!isFirebaseEnabled || !db) return null;

  try {
    // ── 1. Create/update parent document with borrower name so it shows up in Firestore ──
    if (borrowerName) {
      const parentRef = doc(db, 'borrowers', borrowerId);
      await setDoc(parentRef, {
        name: borrowerName,
        id: borrowerId,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    // ── 2. Add the contact event ──
    const ref = await addDoc(eventsRef(borrowerId), {
      id:        event.id || null, // client-generated event ID
      icon:      event.icon,
      type:      event.type,
      note:      event.note,
      date:      event.date,
      agent:     event.agent || 'Risk Officer',
      createdAt: serverTimestamp(),   // server-side timestamp for ordering
    });
    console.info(`[Firebase] ✅ Saved event ${ref.id} for borrower ${borrowerId}`);
    return ref.id;
  } catch (err) {
    console.error('[Firebase] ❌ saveContactEvent failed:', err.message);
    return null;
  }
}

// ── RETRIEVE: Load all events for a borrower (one-shot) ────────
/**
 * @param {string} borrowerId
 * @returns {Array} events ordered newest-first, or [] on failure
 */
export async function loadContactEvents(borrowerId) {
  if (!isFirebaseEnabled || !db) return [];

  try {
    const q = query(eventsRef(borrowerId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    const events = snap.docs.map((doc) => ({
      id:    doc.data().id || doc.id,
      icon:  doc.data().icon  || '📞',
      type:  doc.data().type  || 'Contact',
      note:  doc.data().note  || '',
      date:  doc.data().date  || '',
      agent: doc.data().agent || '',
    }));

    console.info(`[Firebase] ✅ Loaded ${events.length} events for borrower ${borrowerId}`);
    return events;
  } catch (err) {
    console.error('[Firebase] ❌ loadContactEvents failed:', err.message);
    return [];
  }
}

// ── REAL-TIME: Subscribe to live updates for a borrower ────────
/**
 * Sets up a real-time listener. Call the returned unsubscribe function
 * when the component unmounts.
 *
 * @param {string}   borrowerId
 * @param {Function} onUpdate   callback(events[]) called on every change
 * @returns {Function}          unsubscribe function
 */
export function subscribeToContactEvents(borrowerId, onUpdate) {
  if (!isFirebaseEnabled || !db) {
    // Return a no-op unsubscribe when Firebase is not configured
    return () => {};
  }

  try {
    const q = query(eventsRef(borrowerId), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const events = snap.docs.map((doc) => ({
          id:    doc.data().id || doc.id,
          icon:  doc.data().icon  || '📞',
          type:  doc.data().type  || 'Contact',
          note:  doc.data().note  || '',
          date:  doc.data().date  || '',
          agent: doc.data().agent || '',
        }));
        onUpdate(events);
      },
      (err) => {
        console.error('[Firebase] ❌ subscribeToContactEvents listener error:', err.message);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('[Firebase] ❌ subscribeToContactEvents setup failed:', err.message);
    return () => {};
  }
}
