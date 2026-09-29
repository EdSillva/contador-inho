// src/lib/reset.ts
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const getCurrentWeek = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + (start.getDay() === 0 ? 6 : start.getDay() - 1) + 1) / 7);
  
  return { year: now.getFullYear(), week: weekNumber };
};

export const checkAndResetWeekly = async (db: Firestore, userIds: string[]) => {
  const metadataRef = doc(db, 'system', 'config');
  const metaSnap = await getDoc(metadataRef);
  const { year, week } = getCurrentWeek();

  if (metaSnap.exists()) {
    const data = metaSnap.data();
    if (year > data.lastResetYear || (year === data.lastResetYear && week > data.lastResetWeek)) {
       await executeBatchReset(db, userIds, year, week, metadataRef);
    }
  } else {
    await executeBatchReset(db, userIds, year, week, metadataRef);
  }
};

const executeBatchReset = async (db: Firestore, userIds: string[], year: number, week: number, metadataRef: any) => {
  const batch = writeBatch(db);
  
  userIds.forEach(id => {
    const counterRef = doc(db, 'counters', id);
    batch.set(counterRef, { count: 0 }, { merge: true });
  });

  batch.set(metadataRef, { lastResetYear: year, lastResetWeek: week });
  await batch.commit();
};