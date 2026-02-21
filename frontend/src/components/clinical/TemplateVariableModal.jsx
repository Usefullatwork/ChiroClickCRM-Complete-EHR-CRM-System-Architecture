import { useState } from 'react';
import { Modal } from '../ui/Modal';

const TemplateVariableModal = ({ isOpen, onClose, variables, content, onConfirm }) => {
  const [values, setValues] = useState(() => Object.fromEntries(variables.map((v) => [v, ''])));

  const handleChange = (variable, value) => {
    setValues((prev) => ({ ...prev, [variable]: value }));
  };

  const handleConfirm = () => {
    let result = content;
    for (const [variable, value] of Object.entries(values)) {
      result = result.replaceAll(`{{${variable}}}`, value || `{{${variable}}}`);
    }
    onConfirm(result);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fyll inn variabler" size="sm">
      <div className="space-y-4">
        {variables.map((variable) => (
          <div key={variable}>
            <label
              htmlFor={`var-${variable}`}
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {variable.replace(/_/g, ' ')}
            </label>
            <input
              id={`var-${variable}`}
              type="text"
              value={values[variable]}
              onChange={(e) => handleChange(variable, e.target.value)}
              placeholder={`Skriv inn ${variable.replace(/_/g, ' ')}...`}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Avbryt
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Sett inn
        </button>
      </div>
    </Modal>
  );
};

export default TemplateVariableModal;
