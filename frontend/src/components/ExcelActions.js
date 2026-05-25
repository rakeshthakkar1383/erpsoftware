import { useRef, useState } from 'react';
import axios from 'axios';

function ExcelActions({ entity, onImport }) {
  const fileRef = useRef();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const downloadTemplate = async () => {
    try {
      const res = await axios.get(`/api/excel/template/${entity}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download template. Make sure the backend server is running.');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`/api/excel/import/${entity}`, fd);
      setResult(res.data);
      if (onImport) onImport();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Import failed' });
    }
    setImporting(false);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        onClick={downloadTemplate}
      >
        Template
      </button>
      <label className="cursor-pointer rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
        {importing ? 'Importing...' : 'Upload Excel'}
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
      </label>
      {result && (
        <span className={`text-xs ${result.errors ? 'text-orange-500' : result.success ? 'text-green-600' : 'text-red-600'}`}>
          {result.message}
        </span>
      )}
    </div>
  );
}

export default ExcelActions;
