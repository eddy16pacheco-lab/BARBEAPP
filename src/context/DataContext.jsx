import { useSyncExternalStore } from 'react';
import { getDB, subscribe } from '../api/db.js';

/** Snapshot reactivo de la "base de datos": cualquier cambio (o de otra pestaña) vuelve a renderizar. */
export const useDB = () => useSyncExternalStore(subscribe, getDB);
