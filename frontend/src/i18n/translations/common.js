import { commonGeneral } from './commonGeneral.js';
import { commonForms } from './commonForms.js';
import { commonNavigation } from './commonNavigation.js';
import { commonErrors } from './commonErrors.js';

export const common = {
  en: {
    ...commonGeneral.en,
    ...commonForms.en,
    ...commonNavigation.en,
    ...commonErrors.en,
  },
  no: {
    ...commonGeneral.no,
    ...commonForms.no,
    ...commonNavigation.no,
    ...commonErrors.no,
  },
};
