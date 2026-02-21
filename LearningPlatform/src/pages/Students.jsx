// import { useEffect, useState } from 'react';
// import DataTable from '../components/DataTable';
// import Modal from '../components/Modal';
// import { getAllStudents, updateStudent, deleteStudent, getAuditLog } from '../services/api';

// const Students = () => {
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedStudent, setSelectedStudent] = useState(null);
//   const [modalType, setModalType] = useState(null); // 'update', 'preview', 'audit'
//   const [auditData, setAuditData] = useState([]);
//   const [formData, setFormData] = useState({});

//   useEffect(() => {
//     loadStudents();
//   }, []);

//   const loadStudents = async () => {
//     try {
//       setLoading(true);
//       const data = await getAllStudents();
//       setStudents(data);
//     } catch (error) {
//       console.error('Error loading students:', error);
//       alert('Failed to load students. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdate = (student) => {
//     setSelectedStudent(student);
//     setFormData({
//       full_name: student.profile?.full_name || '',
//       email: student.profile?.email || '',
//       grade_level: student.grade_level || '',
//       subjects_interested: student.subjects_interested || '',
//       bio: student.bio || '',
//     });
//     setModalType('update');
//   };

//   const handlePreview = (student) => {
//     setSelectedStudent(student);
//     setModalType('preview');
//   };

//   const handleAudit = async (student) => {
//     try {
//       setSelectedStudent(student);
//       setModalType('audit');
//       const auditLog = await getAuditLog(student.id, 'student');
//       setAuditData(auditLog);
//     } catch (error) {
//       console.error('Error loading audit log:', error);
//       alert('Failed to load audit log.');
//     }
//   };

//   const handleDelete = async (student) => {
//     if (!window.confirm(`Are you sure you want to delete ${student.profile?.full_name || 'this student'}?`)) {
//       return;
//     }

//     try {
//       await deleteStudent(student.id);
//       alert('Student deleted successfully!');
//       loadStudents();
//     } catch (error) {
//       console.error('Error deleting student:', error);
//       alert('Failed to delete student. Please try again.');
//     }
//   };

//   const handleSaveUpdate = async () => {
//     try {
//       await updateStudent(selectedStudent.id, {
//         profile: {
//           full_name: formData.full_name,
//         },
//         studentProfile: {
//           grade_level: formData.grade_level,
//           subjects_interested: formData.subjects_interested,
//           // bio: formData.bio,
//         },
//       });
//       alert('Student updated successfully!');
//       setModalType(null);
//       loadStudents();
//     } catch (error) {
//       console.error('Error updating student:', error);
//       alert('Failed to update student. Please try again.');
//     }
//   };

//   const columns = [
//     {
//       header: 'Name',
//       accessor: (row) => row.profile?.full_name || 'N/A',
//     },
//     {
//       header: 'Email',
//       accessor: (row) => row.profile?.email || 'N/A',
//     },
//     {
//       header: 'Grade Level',
//       accessor: (row) => row.grade_level || 'N/A',
//     },
//     {
//       header: 'Subjects Interested',
//       accessor: (row) => row.subjects_interested || 'N/A',
//     },
//     {
//       header: 'Status',
//       accessor: (row) => (
//         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//           row.profile?.email_verified
//             ? 'bg-[#34D399]/20 text-[#34D399]'
//             : 'bg-amber-500/20 text-amber-400'
//         }`}>
//           {row.profile?.email_verified ? 'Verified' : 'Pending'}
//         </span>
//       ),
//     },
//     {
//       header: 'Joined',
//       accessor: (row) => row.profile?.created_at 
//         ? new Date(row.profile.created_at).toLocaleDateString()
//         : 'N/A',
//     },
//   ];

//   return (
//     <div className="min-vh-100 bg-dark text-white py-4">
//       <div className="container">
//         <div className="d-flex justify-content-between mb-2">
//           <h1 className="text-responsive-title font-bold text-white">Students</h1>
//           <button
//             type="button"
//             onClick={loadStudents}
//             className="btn btn-outline-light"
//           >
//             Refresh
//           </button>
//         </div>
         
//         <DataTable
//           data={students}
//           columns={columns}
//           loading={loading}
//           onUpdate={handleUpdate}
//           onDelete={handleDelete}
//           onAudit={handleAudit}
//           onPreview={handlePreview}
//         />

//         {/* Update Modal */}
//         <Modal
//           isOpen={modalType === 'update'}
//           onClose={() => setModalType(null)}
//           title="Update Student"
//           size="md"
//         >
//           {selectedStudent && (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Full Name</label>
//                 <input
//                   type="text"
//                   value={formData.full_name}
//                   onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
//                   className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Grade Level</label>
//                 <input
//                   type="text"
//                   value={formData.grade_level}
//                   onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
//                   className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Subjects Interested</label>
//                 <input
//                   type="text"
//                   value={formData.subjects_interested}
//                   onChange={(e) => setFormData({ ...formData, subjects_interested: e.target.value })}
//                   className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Bio</label>
//                 <textarea
//                   value={formData.bio || ''}
//                   onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
//                   rows={4}
//                   className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
//                 />
//               </div>
//               <div className="flex flex-wrap justify-end gap-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => setModalType(null)}
//                   className="px-4 py-2 border border-[#2D3748] rounded-lg text-[#9CA3AF] hover:bg-[#2D3748] transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleSaveUpdate}
//                   className="px-4 py-2 bg-[#5568FE] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
//                 >
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           )}
//         </Modal>

//         {/* Preview Modal */}
//         <Modal
//           isOpen={modalType === 'preview'}
//           onClose={() => setModalType(null)}
//           title="Student Preview"
//           size="md"
//         >
//           {selectedStudent && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm font-medium text-[#9CA3AF]">Name</p>
//                   <p className="text-base text-white">{selectedStudent.profile?.full_name || 'N/A'}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-[#9CA3AF]">Email</p>
//                   <p className="text-base text-white break-all">{selectedStudent.profile?.email || 'N/A'}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-[#9CA3AF]">Grade Level</p>
//                   <p className="text-base text-white">{selectedStudent.grade_level || 'N/A'}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-[#9CA3AF]">Subjects Interested</p>
//                   <p className="text-base text-white">{selectedStudent.subjects_interested || 'N/A'}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-[#9CA3AF]">Status</p>
//                   <p className="text-base text-white">
//                     {selectedStudent.profile?.email_verified ? 'Verified' : 'Pending'}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-[#9CA3AF]">Joined</p>
//                   <p className="text-base text-white">
//                     {selectedStudent.profile?.created_at
//                       ? new Date(selectedStudent.profile.created_at).toLocaleDateString()
//                       : 'N/A'}
//                   </p>
//                 </div>
//               </div>
//               {selectedStudent.bio && (
//                 <div>
//                   <p className="text-sm font-medium text-[#9CA3AF]">Bio</p>
//                   <p className="text-base text-white">{selectedStudent.bio}</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </Modal>

//         {/* Audit Modal */}
//         <Modal
//           isOpen={modalType === 'audit'}
//           onClose={() => setModalType(null)}
//           title={`Audit Log - ${selectedStudent?.profile?.full_name || 'Student'}`}
//           size="lg"
//         >
//           <div className="max-h-96 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
//             {auditData.length === 0 ? (
//               <p className="text-center text-[#9CA3AF] py-8">No audit data available</p>
//             ) : (
//               <table className="min-w-full divide-y divide-[#2D3748]">
//                 <thead className="bg-[#0B0D2A] sticky top-0">
//                   <tr>
//                     <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-[#9CA3AF] uppercase">Date</th>
//                     <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-[#9CA3AF] uppercase">Subject</th>
//                     <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-[#9CA3AF] uppercase">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-[#2D3748]">
//                   {auditData.map((item, idx) => (
//                     <tr key={idx}>
//                       <td className="px-3 py-3 sm:px-4 text-sm text-white whitespace-nowrap">
//                         {new Date(item.created_at).toLocaleString()}
//                       </td>
//                       <td className="px-3 py-3 sm:px-4 text-sm text-white">{item.subject || 'N/A'}</td>
//                       <td className="px-3 py-3 sm:px-4 text-sm">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           item.status === 'completed' ? 'bg-[#34D399]/20 text-[#34D399]' :
//                           item.status === 'confirmed' ? 'bg-[#5568FE]/20 text-[#5568FE]' :
//                           item.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
//                           'bg-[#F87171]/20 text-[#F87171]'
//                         }`}>
//                           {item.status || 'N/A'}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </Modal>
//       </div>
//     </div>
//   );
// };

// export default Students;

import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { getAllStudents, updateStudent, deleteStudent, getAuditLog } from '../services/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllStudents();
      setStudents(data || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (student) => {
    setSelectedStudent(student);
    setFormData({
      full_name: student.profile?.full_name || '',
      grade_level: student.grade_level || '',
      subjects_interested: student.subjects_interested || '',
      bio: student.bio || '',
    });
    setModalType('update');
  };

  const handlePreview = (student) => {
    setSelectedStudent(student);
    setModalType('preview');
  };

  const handleAudit = async (student) => {
    try {
      setSelectedStudent(student);
      setModalType('audit');
      const auditLog = await getAuditLog(student.id, 'student');
      setAuditData(auditLog || []);
    } catch (error) {
      console.error(error);
      alert('Failed to load audit log');
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.profile?.full_name}?`)) return;
    try {
      await deleteStudent(student.id);
      alert('Deleted');
      loadStudents();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleSaveUpdate = async () => {
    try {
      await updateStudent(selectedStudent.id, {
        profile: { full_name: formData.full_name },
        studentProfile: {
          grade_level: formData.grade_level,
          subjects_interested: formData.subjects_interested,
          // bio: formData.bio,
        },
      });
      alert('Updated');
      setModalType(null);
      loadStudents();
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  const columns = [
    { header: 'Name', accessor: (row) => row.profile?.full_name || 'N/A' },
    { header: 'Email', accessor: (row) => row.profile?.email || 'N/A' },
    { header: 'Grade', accessor: (row) => row.grade_level || 'N/A' },
    { header: 'Subjects', accessor: (row) => row.subjects_interested || 'N/A' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`badge ${row.profile?.email_verified ? 'bg-success' : 'bg-warning'}`}>
          {row.profile?.email_verified ? 'Verified' : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Joined',
      accessor: (row) =>
        row.profile?.created_at
          ? new Date(row.profile.created_at).toLocaleDateString()
          : 'N/A',
    },
  ];

  return (
    <div className="min-vh-100 bg-dark text-white py-4">
      <div className="container">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>Students</h2>
          <button className="btn btn-outline-light" onClick={loadStudents}>
            Refresh
          </button>
        </div>

        {/* TABLE */}
        <DataTable
          data={students}
          columns={columns}
          loading={loading}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAudit={handleAudit}
          onPreview={handlePreview}
        />

        {/* UPDATE MODAL */}
        <Modal isOpen={modalType === 'update'} onClose={() => setModalType(null)} title="Update Student">
          {selectedStudent && (
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Full Name</label>
                <input
                  className="form-control"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Grade Level</label>
                <input
                  className="form-control"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Subjects</label>
                <input
                  className="form-control"
                  value={formData.subjects_interested}
                  onChange={(e) =>
                    setFormData({ ...formData, subjects_interested: e.target.value })
                  }
                />
              </div>

              <div className="col-12">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="col-12 text-end">
                <button className="btn btn-secondary me-2" onClick={() => setModalType(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveUpdate}>
                  Save
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* PREVIEW MODAL */}
        <Modal isOpen={modalType === 'preview'} onClose={() => setModalType(null)} title="Student Preview">
          {selectedStudent && (
            <div className="row g-3">
              <div className="col-md-8"><b>Name:</b> {selectedStudent.profile?.full_name}</div>
              <div className="col-md-8"><b>Email:</b> {selectedStudent.profile?.email}</div>
              <div className="col-md-8"><b>Grade:</b> {selectedStudent.grade_level}</div>
              <div className="col-md-8"><b>Subjects:</b> {selectedStudent.subjects_interested}</div>
              <div className="col-md-8"><b>Status:</b> {selectedStudent.profile?.email_verified ? 'Verified' : 'Pending'}</div>
              <div className="col-md-8"><b>Joined:</b> {selectedStudent.profile?.created_at}</div>
              {selectedStudent.bio && <div className="col-12"><b>Bio:</b> {selectedStudent.bio}</div>}
            </div>
          )}
        </Modal>

        {/* AUDIT MODAL */}
        <Modal isOpen={modalType === 'audit'} onClose={() => setModalType(null)} title="Audit Log">
          <table className="table table-dark table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditData.map((item, i) => (
                <tr key={i}>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>{item.subject}</td>
                  <td>
                    <span className="badge bg-info">{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>

      </div>
    </div>
  );
};

export default Students;

