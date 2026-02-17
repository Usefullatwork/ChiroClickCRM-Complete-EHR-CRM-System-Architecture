import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n';

const ROUTE_LABELS = {
  patients: 'patients',
  new: 'new',
  encounter: 'encounter',
  'easy-assessment': 'easyAssessment',
  calendar: 'calendar',
  appointments: 'appointments',
  communications: 'communications',
  'follow-ups': 'followUps',
  financial: 'financial',
  kpi: 'kpi',
  templates: 'templates',
  import: 'import',
  training: 'aiTraining',
  'audit-logs': 'auditLogs',
  settings: 'settings',
  crm: 'crm',
  'patient-flow': 'patientFlow',
};

export default function Breadcrumbs({ items }) {
  const location = useLocation();
  const { t } = useTranslation('navigation');

  // Auto-generate from path if no explicit items provided
  const breadcrumbs = items || generateBreadcrumbs(location.pathname, t);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={crumb.href || index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
              {isLast ? (
                <span className="font-medium text-gray-900 dark:text-white" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                >
                  {index === 0 && <Home className="w-4 h-4" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname, t) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: t('dashboard'), href: '/' }];

  let path = '';
  for (const segment of segments) {
    path += `/${segment}`;
    const labelKey = ROUTE_LABELS[segment];
    // Skip UUID-like segments from showing their raw value
    const isId = /^[0-9a-f-]{8,}$/i.test(segment);
    if (isId) {
      crumbs.push({ label: 'Detail', href: path });
    } else if (labelKey) {
      crumbs.push({ label: t(labelKey), href: path });
    } else {
      crumbs.push({ label: segment, href: path });
    }
  }

  return crumbs;
}
