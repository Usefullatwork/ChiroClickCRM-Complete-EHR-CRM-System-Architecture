/**
 * MappingRules - Validation status and template management
 * Sub-component of CSVColumnMapper
 */

import { Save, FolderOpen, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card, CardHeader, CardBody } from '../../ui/Card';
import { Alert } from '../../ui/Alert';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';

export function ValidationStatus({
  missingRequiredFields,
  mappings,
  unmappedColumns,
  getFieldLabel,
  t,
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-slate-900">{t('validationTitle', 'Validering')}</h3>
      </CardHeader>
      <CardBody>
        {missingRequiredFields.length > 0 ? (
          <Alert
            variant="warning"
            title={t('missingRequired', 'Folgende pakrevde felt er ikke koblet:')}
          >
            <ul className="list-disc list-inside">
              {missingRequiredFields.map((field) => (
                <li key={field}>{getFieldLabel(field)}</li>
              ))}
            </ul>
          </Alert>
        ) : (
          <Alert variant="success">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t('allRequiredMapped', 'Alle pakrevde felt er koblet')}
            </div>
          </Alert>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg">
            <p className="text-2xl font-bold text-teal-600">{Object.keys(mappings).length}</p>
            <p className="text-sm text-teal-700">{t('mappedFields', 'Koblede Felt')}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">
              {unmappedColumns.length}
            </p>
            <p className="text-sm text-slate-700">{t('unmappedColumns', 'Ukoblede Kolonner')}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function TemplateModal({
  isOpen,
  onClose,
  mappings,
  templateName,
  setTemplateName,
  savedTemplates,
  onSave,
  onLoad,
  onDelete,
  t,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('savedTemplates', 'Lagrede Maler')} size="md">
      <div className="space-y-4">
        {Object.keys(mappings).length > 0 && (
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">{t('saveTemplate', 'Lagre Mal')}</h4>
            <div className="flex gap-2">
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder={t('templateName', 'Malnavn')}
                className="flex-1"
              />
              <Button
                variant="primary"
                icon={Save}
                onClick={onSave}
                disabled={!templateName.trim()}
              >
                {t('save', 'Lagre')}
              </Button>
            </div>
          </div>
        )}

        {savedTemplates.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t('noTemplates', 'Ingen lagrede maler')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{template.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {Object.keys(template.mappings).length} mappings |{' '}
                    {new Date(template.createdAt).toLocaleDateString('nb-NO')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onLoad(template)}>
                    {t('load', 'Last')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => onDelete(template.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
