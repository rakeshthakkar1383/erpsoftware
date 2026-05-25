import { useEffect, useState } from 'react';
import axios from 'axios';

const classes = Array.from({ length: 12 }, (_, i) => String(i + 1));

function Dashboard({ user, teacherClass, schoolName }) {
  const [students, setStudents] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [fees, setFees] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDiv, setSelectedDiv] = useState(null);
  const [selectedFeeClass, setSelectedFeeClass] = useState(null);

  useEffect(() => {
    axios.get('/api/students/all').then(r => setStudents(r.data || [])).catch(() => {});
    axios.get('/api/divisions').then(r => setDivisions(r.data || [])).catch(() => {});
    axios.get('/api/fees/all').then(r => setFees(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (teacherClass) {
      setSelectedClass(teacherClass);
      setSelectedFeeClass(teacherClass);
    }
  }, [teacherClass]);

  const paidStudentIds = new Set(
    fees.filter(f => f.status?.toLowerCase() === 'paid').map(f => f.student_id)
  );

  const getStudentsByClass = (cls) => students.filter(s => s.class_name === cls);
  const getStudentsByDiv = (cls, div) => students.filter(s => s.class_name === cls && s.division === div);

  const getDivisionsForClass = (cls) => divisions.filter(d => d.class_name === cls);

  const renderStudentList = (list) => {
    if (list.length === 0) return <p className="text-sm text-slate-500">No students</p>;
    const paid = list.filter(s => paidStudentIds.has(s.id));
    const unpaid = list.filter(s => !paidStudentIds.has(s.id));
    return (
      <div className="space-y-1">
        {paid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700">Paid ({paid.length})</p>
            <div className="flex flex-wrap gap-1">
              {paid.map(s => (
                <span key={s.id} className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">{s.full_name}</span>
              ))}
            </div>
          </div>
        )}
        {unpaid.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-700">Unpaid ({unpaid.length})</p>
            <div className="flex flex-wrap gap-1">
              {unpaid.map(s => (
                <span key={s.id} className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">{s.full_name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Dashboard</h2>

      {/* School-wise summary */}
      {schoolName && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-blue-600">School</div>
              <div className="text-xl font-bold text-blue-800">{schoolName}</div>
            </div>
            <div className="text-right text-3xl font-bold text-blue-600">{students.length}</div>
          </div>
          <div className="mt-2 text-sm text-blue-600">Total Students</div>
        </div>
      )}

      {/* Class-wise summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {classes.map(cls => {
          const list = getStudentsByClass(cls);
          const count = list.length;
          const isTeacherClass = teacherClass && cls === teacherClass;
          const showCard = !teacherClass || isTeacherClass;
          if (!showCard) return null;
          return (
            <button
              key={cls}
              className={`rounded-lg border p-4 text-center shadow-sm transition hover:shadow-md ${
                selectedClass === cls ? 'ring-2 ring-blue-500' : 'bg-white'
              } ${teacherClass ? '' : 'hover:shadow-md'}`}
              onClick={() => !teacherClass && setSelectedClass(selectedClass === cls ? null : cls)}
            >
              <div className="text-3xl font-bold text-blue-600">{count}</div>
              <div className="mt-1 text-sm text-slate-600">Class {cls}</div>
            </button>
          );
        })}
      </div>

      {/* Division-wise table with class teacher */}
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold text-slate-700">Division-wise Details</h3>
        <div className="space-y-4">
          {classes.map(cls => {
            const divs = getDivisionsForClass(cls);
            if (divs.length === 0) return null;
            return (
              <div key={cls} className="rounded-lg border bg-white shadow-sm">
                <div className="border-b bg-slate-50 px-4 py-2 font-semibold text-slate-700">Class {cls}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Division</th>
                        <th className="px-4 py-2">Class Teacher</th>
                        <th className="px-4 py-2">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {divs.map(d => {
                        const list = getStudentsByDiv(d.class_name, d.division_name);
                        const divKey = `${d.class_name}-${d.division_name}`;
                        const isOpen = selectedDiv === divKey;
                        return (
                          <tr key={d.id}>
                            <td className="px-4 py-2 font-medium">{d.division_name}</td>
                            <td className="px-4 py-2">{d.teachers?.full_name || '-'}</td>
                            <td className="px-4 py-2">
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() => setSelectedDiv(selectedDiv === divKey ? null : divKey)}
                              >
                                {list.length} students {isOpen ? '▲' : '▼'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {selectedDiv && divs.some(d => `${d.class_name}-${d.division_name}` === selectedDiv) && (
                  <div className="border-t px-4 py-3">
                    {divs.map(d => {
                      const dk = `${d.class_name}-${d.division_name}`;
                      if (selectedDiv !== dk) return null;
                      return (
                        <div key={d.id}>
                          <h4 className="mb-2 text-sm font-semibold text-slate-600">
                            Class {d.class_name} - {d.division_name}
                          </h4>
                          {renderStudentList(getStudentsByDiv(d.class_name, d.division_name))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Class-wise fee status */}
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold text-slate-700">Class-wise Fee Status</h3>
        <div className="space-y-3">
          {classes.map(cls => {
            const list = getStudentsByClass(cls);
            if (list.length === 0) return null;
            const paid = list.filter(s => paidStudentIds.has(s.id));
            const unpaid = list.filter(s => !paidStudentIds.has(s.id));
            return (
              <div key={cls} className="rounded-lg border bg-white shadow-sm">
                <button
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
                  onClick={() => setSelectedFeeClass(selectedFeeClass === cls ? null : cls)}
                >
                  <span className="font-semibold text-slate-700">Class {cls}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">{list.length} students</span>
                    <span className="text-green-600">{paid.length} Paid</span>
                    <span className="text-red-600">{unpaid.length} Unpaid</span>
                    <span className="text-slate-400">{selectedFeeClass === cls ? '▲' : '▼'}</span>
                  </div>
                </button>
                {selectedFeeClass === cls && (
                  <div className="border-t px-4 py-3">
                    {renderStudentList(list)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
