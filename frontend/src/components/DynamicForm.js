import { useState } from 'react';

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
];

let nextId = 1;

function DynamicForm() {
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    placeholder: '',
    required: false,
    options: '',
  });

  const addField = () => {
    if (!newField.name || !newField.label) return;
    setFields([
      ...fields,
      {
        id: nextId++,
        name: newField.name.trim(),
        label: newField.label.trim(),
        type: newField.type,
        placeholder: newField.placeholder,
        required: newField.required,
        options: newField.type === 'select' ? newField.options.split(',').map(s => s.trim()).filter(Boolean) : [],
      },
    ]);
    setNewField({ name: '', label: '', type: 'text', placeholder: '', required: false, options: '' });
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const arr = [...fields];
    [arr[index], arr[target]] = [arr[target], arr[index]];
    setFields(arr);
  };

  const setValue = (name) => (e) => setFormData({ ...formData, [name]: e.target.value.toUpperCase() });

  const handleSubmit = () => {
    setSubmitted({ ...formData });
  };

  const renderFieldInput = (field) => {
    const val = formData[field.name] || '';
    const cls = "w-full rounded border p-3 text-sm";

    if (field.type === 'textarea') {
      return (
        <textarea
          className={cls}
          placeholder={field.placeholder}
          value={val}
          onChange={setValue(field.name)}
          rows={3}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <select className={cls} value={val} onChange={setValue(field.name)}>
          <option value="">{field.placeholder || `Select ${field.label}`}</option>
          {field.options.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        className={cls}
        type={field.type}
        placeholder={field.placeholder}
        value={val}
        onChange={setValue(field.name)}
      />
    );
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Dynamic Form Builder</h2>

      {/* Add Field Section */}
      <div className="mb-6 rounded border bg-slate-50 p-4">
        <h3 className="mb-3 text-lg font-medium">Add New Field</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="w-full rounded border p-3 text-sm"
            placeholder="Field Name (e.g. email)"
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value.toUpperCase() })}
          />
          <input
            className="w-full rounded border p-3 text-sm"
            placeholder="Label (e.g. Email Address)"
            value={newField.label}
            onChange={(e) => setNewField({ ...newField, label: e.target.value.toUpperCase() })}
          />
          <select
            className="w-full rounded border p-3 text-sm"
            value={newField.type}
            onChange={(e) => setNewField({ ...newField, type: e.target.value })}
          >
            {fieldTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            className="w-full rounded border p-3 text-sm"
            placeholder="Placeholder"
            value={newField.placeholder}
            onChange={(e) => setNewField({ ...newField, placeholder: e.target.value.toUpperCase() })}
          />
        </div>
        {newField.type === 'select' && (
          <input
            className="mt-3 w-full rounded border p-3 text-sm"
            placeholder="Options (comma separated, e.g. Male,Female,Other)"
            value={newField.options}
            onChange={(e) => setNewField({ ...newField, options: e.target.value.toUpperCase() })}
          />
        )}
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
            />
            Required
          </label>
          <button
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={addField}
          >
            Add Field
          </button>
        </div>
      </div>

      {/* Field List (Reorder) */}
      {fields.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium">Field Order</h3>
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-3 rounded border bg-white px-4 py-3">
                <span className="w-6 text-center text-sm text-slate-400">{i + 1}</span>
                <button
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => moveField(i, -1)}
                  title="Move up"
                >
                  &#9650;
                </button>
                <button
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  disabled={i === fields.length - 1}
                  onClick={() => moveField(i, 1)}
                  title="Move down"
                >
                  &#9660;
                </button>
                <span className="flex-1 text-sm font-medium">{field.label}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{field.type}</span>
                {field.required && <span className="text-xs text-red-500">required</span>}
                <button
                  className="rounded p-1 text-red-500 hover:bg-red-50"
                  onClick={() => removeField(field.id)}
                  title="Remove"
                >
                  &#10005;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rendered Dynamic Form */}
      {fields.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-lg font-medium">Form Preview</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
          <button
            className="mt-4 w-full rounded bg-green-600 px-5 py-3 text-white hover:bg-green-700"
            onClick={handleSubmit}
          >
            Submit Form
          </button>
        </div>
      )}

      {/* Submitted Data */}
      {submitted && (
        <div className="rounded border border-green-200 bg-green-50 p-4">
          <h3 className="mb-2 font-medium text-green-800">Submitted Data</h3>
          <pre className="text-sm text-green-700">{JSON.stringify(submitted, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default DynamicForm;
