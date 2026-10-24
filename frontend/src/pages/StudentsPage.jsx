import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import exportToCSV from '../utils/csvExport';
import {
  Plus,
  Download,
  Edit2,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  GraduationCap,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'MALE',
  departmentId: '',
  enrollmentYear: new Date().getFullYear(),
  semester: 1,
  address: '',
};

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('studentId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirm Dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch students & departments
  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, deptsRes] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/departments'),
      ]);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : []);
    } catch (error) {
      console.error('Error fetching students data:', error);
      toast.error('Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      ...initialFormState,
      departmentId: departments[0]?.departmentId || departments[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    const deptId =
      student.departmentId ||
      student.department?.departmentId ||
      student.department?.id ||
      '';

    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student.gender || 'MALE',
      departmentId: deptId,
      enrollmentYear: student.enrollmentYear || new Date().getFullYear(),
      semester: student.semester || 1,
      address: student.address || '',
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    const payload = {
      ...formData,
      departmentId: formData.departmentId ? Number(formData.departmentId) : null,
      enrollmentYear: Number(formData.enrollmentYear),
      semester: Number(formData.semester),
    };

    try {
      if (editingStudent) {
        const studentId = editingStudent.studentId || editingStudent.id;
        const res = await api.put(`/api/students/${studentId}`, payload);
        toast.success('Student updated successfully!');
        setStudents((prev) =>
          prev.map((s) => ((s.studentId || s.id) === studentId ? res.data : s))
        );
      } else {
        const res = await api.post('/api/students', payload);
        toast.success('Student created successfully!');
        setStudents((prev) => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.response?.data?.message || 'Failed to save student.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const studentId = deleteTarget.studentId || deleteTarget.id;
    setIsDeleting(true);

    try {
      await api.delete(`/api/students/${studentId}`);
      toast.success('Student deleted successfully');
      setStudents((prev) => prev.filter((s) => (s.studentId || s.id) !== studentId));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to get Department Name
  const getDepartmentName = (student) => {
    if (student.department?.name) return student.department.name;
    if (student.departmentName) return student.departmentName;
    const deptId = student.departmentId || student.department?.id;
    const found = departments.find(
      (d) => (d.departmentId || d.id) === deptId
    );
    return found ? found.name : '-';
  };

  // Handle Sorting
  const handleSort = (key, direction) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  // Filtered and Sorted Students
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.phone?.includes(q) ||
          getDepartmentName(s).toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'name') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (sortKey === 'department') {
        aVal = getDepartmentName(a).toLowerCase();
        bVal = getDepartmentName(b).toLowerCase();
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [students, searchQuery, sortKey, sortDirection, departments]);

  // Paginated Students
  const totalPages = Math.ceil(filteredAndSortedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedStudents, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredAndSortedStudents.map((s) => ({
      ID: s.studentId || s.id,
      'First Name': s.firstName,
      'Last Name': s.lastName,
      Email: s.email,
      Phone: s.phone || '',
      Gender: s.gender || '',
      'Date of Birth': s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
      Department: getDepartmentName(s),
      Semester: s.semester || '',
      'Enrollment Year': s.enrollmentYear || '',
      Address: s.address || '',
    }));

    exportToCSV(exportData, 'students_list.csv');
    toast.success('Students exported to CSV');
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'studentId',
      label: 'ID',
      sortable: true,
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          #{s.studentId || s.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600">
            {s.firstName?.[0]}
            {s.lastName?.[0]}
          </div>
          <div>
            <p className="font-medium text-slate-900">
              {s.firstName} {s.lastName}
            </p>
            <p className="text-xs text-slate-400 capitalize">{s.gender?.toLowerCase() || 'Student'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (s) => (
        <span className="text-slate-600">{s.email}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false,
      render: (s) => s.phone || <span className="text-slate-400">-</span>,
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (s) => (
        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {getDepartmentName(s)}
        </span>
      ),
    },
    {
      key: 'semester',
      label: 'Semester',
      sortable: true,
      render: (s) => (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-100">
          Sem {s.semester}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage student registrations, academic standing, and contact records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-colors"
          >
            <Plus size={16} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Reusable Data Table */}
      <DataTable
        columns={columns}
        data={paginatedStudents}
        loading={loading}
        searchPlaceholder="Search by name, email, or department..."
        searchValue={searchQuery}
        onSearch={(query) => {
          setSearchQuery(query);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredAndSortedStudents.length}
        onPageChange={(page) => setCurrentPage(page)}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        actions={(student) => (
          <>
            <button
              type="button"
              onClick={() => handleOpenEdit(student)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Edit student"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(student)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Delete student"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      />

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student Profile' : 'Register New Student'}
        size="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="john.doe@college.edu"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Department
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option
                    key={dept.departmentId || dept.id}
                    value={dept.departmentId || dept.id}
                  >
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Enrollment Year
              </label>
              <input
                type="number"
                min="2000"
                max="2035"
                value={formData.enrollmentYear}
                onChange={(e) => setFormData({ ...formData, enrollmentYear: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Current Semester (1-8)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              placeholder="Enter student residential address"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={formSubmitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {formSubmitting
                ? 'Saving...'
                : editingStudent
                ? 'Update Student'
                : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Student"
        message={`Are you sure you want to permanently delete student "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? This will also remove any associated course registrations.`}
        confirmText="Delete Student"
        confirmColor="red"
      />
    </div>
  );
};

export default StudentsPage;
