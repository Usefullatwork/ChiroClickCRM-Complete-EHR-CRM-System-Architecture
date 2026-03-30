import { exerciseLibrary } from './exerciseLibrary.js';
import { exercisePrograms } from './exercisePrograms.js';
import { exercisePrescriptions } from './exercisePrescriptions.js';

export const exercises = {
  en: {
    ...exerciseLibrary.en,
    ...exercisePrograms.en,
    ...exercisePrescriptions.en,
  },
  no: {
    ...exerciseLibrary.no,
    ...exercisePrograms.no,
    ...exercisePrescriptions.no,
  },
};
