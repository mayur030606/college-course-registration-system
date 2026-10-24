import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import exportToCSV from '../utils/csvExport';
import {
  Plus,
  Download,
  Trash2,
  XCircle,
  CheckCircle,
  ClipboardList,
  RefreshCw,
  Search,
  BookOpen,
  User,
  GraduationCap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const RegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Filter: 'ALL' | 'ACTIVE' | 'COMPLETED' | 'DROPPED'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('registrationId');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // New Registration Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Drop / Cancel Confirmation
  const [dropTarget, setDropTarget] = useState(null);
  const [isDropping, setIsDropping] = useState(false);

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all registrations, students, courses
  const fetchData = async () => {
    setLoading(true);
    try {
      const [regRes, stuRes, couRes] = await Promise.all([
        api.get('/api/registrations'),
        api.get('/api/students'),
        api.get('/api/courses'),
      ]);
      setRegistrations(Array.isArray(regRes.data) ? regRes.data : []);
      setStudents(Array.isArray(stuRes.data) ? stuRes.data : []);
      setCourses(Array.isArray(couRes.data) ? couRes.data : []);
    } catch (error) {
      console.error('Error fetching registrations data:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open New Registration Modal
  const handleOpenAdd = () => {
    setSelectedStudentId(students[0]?.studentId || students[0]?.id || '');
    setSelectedCourseId(courses[0]?.courseId || courses[0]?.id || '');
    setStudentSearch('');
    setCourseSearch('');
    setIsModalOpen(true);
  };

  // Submit New Registration
  const handleCreateRegistration = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId) {
      toast.error('Please select both a student and a course');
      return;
    }

    setSubmitting(true);
    const stuIdNum = Number(selectedStudentId);
    const couIdNum = Number(selectedCourseId);

    const payload = {
      studentId: stuIdNum,
      courseId: couIdNum,
      student: { studentId: stuIdNum, id: stuIdNum },
      course: { courseId: couIdNum, id: couIdNum },
      status: 'ACTIVE',
    };

    try {
      const res = await api.post('/api/registrations', payload);
      toast.success('Course registered successfully!');
      // Prepend or refresh
      setRegistrations((prev) => [res.data, ...prev]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Registration failed:', error);
      const errMsg =
        error.response?.data?.message ||
        (error.response?.status === 409 || error.response?.status === 400
          ? 'Registration failed: Student is already registered for this course or course is full.'
          : 'Could not register course.');
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Drop Registration (Status -> DROPPED)
  const handleConfirmDrop = async () => {
    if (!dropTarget) return;
    const regId = dropTarget.registrationId || dropTarget.id;
    setIsDropping(true);

    try {
      const updatedPayload = {
        ...dropTarget,
        status: 'DROPPED',
      };
      const res = await api.put(`/api/registrations/${regId}`, updatedPayload);
      toast.success('Registration has been dropped');
      setRegistrations((prev) =>
        prev.map((r) => ((r.registrationId || r.id) === regId ? (res.data || updatedPayload) : r))
      );
      setDropTarget(null);
    } catch (error) {
      console.error('Failed to drop registration:', error);
      toast.error(error.response?.data?.message || 'Failed to update registration status');
    } finally {
      setIsDropping(false);
    }
  };

  // Delete Registration
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const regId = deleteTarget.registrationId || deleteTarget.id;
    setIsDeleting(true);

    try {
      await api.delete(`/api/registrations/${regId}`);
      toast.success('Registration record removed');
      setRegistrations((prev) => prev.filter((r) => (r.registrationId || r.id) !== regId));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete registration:', error);
      toast.error(error.response?.data?.message || 'Failed to delete registration');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper getters
  const getStudentInfo = (reg) => {
    if (reg.student) {
      return {
        id: reg.student.studentId || reg.student.id,
        name: `${reg.student.firstName} ${reg.student.lastName}`,
        email: reg.student.email,
      };
    }
    const found = students.find((s) => (s.studentId || s.id) === (reg.studentId || reg.student?.id));
    if (found) {
      return {
        id: found.studentId || found.id,
        name: `${found.firstName} ${found.lastName}`,
        email: found.email,
      };
    }
    return {
      id: reg.studentId,
      name: reg.studentName || `Student #${reg.studentId}`,
      email: reg.studentEmail || '-',
    };
  };

  const getCourseInfo = (reg) => {
    if (reg.course) {
      return {
        id: reg.course.courseId || reg.course.id,
        code: reg.course.courseCode,
        title: reg.course.title,
        credits: reg.course.credits,
      };
    }
    const found = courses.find((c) => (c.courseId || c.id) === (reg.courseId || reg.course?.id));
    if (found) {
      return {
        id: found.courseId || found.id,
        code: found.courseCode,
        title: found.title,
        credits: found.credits,
      };
    }
    return {
      id: reg.courseId,
      code: reg.courseCode || `C#${reg.courseId}`,
      title: reg.courseTitle || 'Course',
      credits: reg.credits || 0,
    };
  };

  // Filter & Sort Registrations
  const filteredAndSortedRegistrations = useMemo(() => {
    let result = [...registrations];

    // Status tab filter
    if (statusFilter !== 'ALL') {
      result = result.filter((r) => r.status?.toUpperCase() === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const student = getStudentInfo(r);
        const course = getCourseInfo(r);
        return (
          student.name.toLowerCase().includes(q) ||
          student.email?.toLowerCase().includes(q) ||
          course.code.toLowerCase().includes(q) ||
          course.title.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q) ||
          r.grade?.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'student') {
        aVal = getStudentInfo(a).name.toLowerCase();
        bVal = getStudentInfo(b).name.toLowerCase();
      } else if (sortKey === 'course') {
        aVal = getCourseInfo(a).code.toLowerCase();
        bVal = getCourseInfo(b).code.toLowerCase();
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string') {
        const comp = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comp : -comp;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [registrations, statusFilter, searchQuery, sortKey, sortDirection, students, courses]);

  // Paginated Registrations
  const totalPages = Math.ceil(filteredAndSortedRegistrations.length / pageSize) || 1;
  const paginatedRegistrations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedRegistrations.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedRegistrations, currentPage, pageSize]);

  // CSV Export
  const handleExportCSV = () => {
    const exportData = filteredAndSortedRegistrations.map((r) => {
      const s = getStudentInfo(r);
      const c = getCourseInfo(r);
      return {
        'Registration ID': r.registrationId || r.id,
        'Student ID': s.id,
        'Student Name': s.name,
        'Student Email': s.email,
        'Course Code': c.code,
        'Course Title': c.title,
        'Registration Date': r.registrationDate ? new Date(r.registrationDate).toLocaleDateString() : '',
        Status: r.status,
        Grade: r.grade || 'N/A',
      };
    });
    exportToCSV(exportData, 'course_registrations.csv');
    toast.success('Registrations exported to CSV');
  };

  // Filter students for dropdown search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // Filter courses for dropdown search
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase();
    return courses.filter(
      (c) =>
        c.courseCode?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q)
    );
  }, [courses, courseSearch]);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            <CheckCircle size={12} className="text-blue-500" />
            Completed
          </span>
        );
      case 'DROPPED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-500" />
            Dropped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Columns Configuration
  const columns = [
    {
      key: 'registrationId',
      label: 'Reg #',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          #{r.registrationId || r.id}
        </span>
      ),
    },
    {
      key: 'student',
      label: 'Student',
      sortable: true,
      render: (r) => {
        const student = getStudentInfo(r);
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
              <User size={14} />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{student.name}</p>
              <p className="text-xs text-slate-400">{student.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'course',
      label: 'Course',
      sortable: true,
      render: (r) => {
        const course = getCourseInfo(r);
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                {course.code}
              </span>
              <span className="font-medium text-slate-800 text-sm truncate max-w-xs">{course.title}</span>
            </div>
            {course.credits > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{course.credits} Credits</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'registrationDate',
      label: 'Date',
      sortable: true,
      render: (r) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {r.registrationDate
            ? new Date(r.registrationDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (r) => getStatusBadge(r.status),
    },
    {
      key: 'grade',
      label: 'Grade',
      sortable: true,
      render: (r) => (
        <span
          className={`font-semibold text-xs px-2 py-0.5 rounded-sm ${
            r.grade
              ? 'bg-amber-100 text-amber-800'
              : 'text-slate-400 font-normal italic'
          }`}
        >
          {r.grade || 'Not Graded'}
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
            Course Registrations
          </h1>
          <p className="text-sm text-slate-500">
            Enroll students in academic courses, monitor registration status, and grade history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh registrations"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
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
            <span>New Registration</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Status */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['ALL', 'ACTIVE', 'COMPLETED', 'DROPPED'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setStatusFilter(status);
              setCurrentPage(1);
            }}
            className={`rounded-xl px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              statusFilter === status
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Registrations Table */}
      <DataTable
        columns={columns}
        data={paginatedRegistrations}
        loading={loading}
        searchPlaceholder="Search by student, course code, title, or grade..."
        searchValue={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredAndSortedRegistrations.length}
        onPageChange={(page) => setCurrentPage(page)}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={(key, dir) => {
          setSortKey(key);
          setSortDirection(dir);
        }}
        actions={(reg) => (
          <>
            {reg.status === 'ACTIVE' && (
              <button
                type="button"
                onClick={() => setDropTarget(reg)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                title="Drop course registration"
              >
                <XCircle size={14} />
                <span>Drop</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setDeleteTarget(reg)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Delete registration record"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      />

      {/* New Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Enroll Student in Course"
        size="md"
      >
        <form onSubmit={handleCreateRegistration} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Select Student *
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="Filter students by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full mb-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">-- Choose a student --</option>
                {filteredStudents.map((s) => (
                  <option
                    key={s.studentId || s.id}
                    value={s.studentId || s.id}
                  >
                    {s.firstName} {s.lastName} ({s.email}) - Sem {s.semester || 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Select Course *
            </label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="Filter courses by code or title..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full mb-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
              />
              <select
                required
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">-- Choose a course --</option>
                {filteredCourses.map((c) => (
                  <option
                    key={c.courseId || c.id}
                    value={c.courseId || c.id}
                  >
                    {c.courseCode}: {c.title} ({c.credits} Credits, Sem {c.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-500">
            <p><strong>Note:</strong> Students cannot be registered for the same course more than once. Registration will begin in <strong>ACTIVE</strong> status.</p>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Drop Registration Dialog */}
      <ConfirmDialog
        isOpen={!!dropTarget}
        onClose={() => setDropTarget(null)}
        onConfirm={handleConfirmDrop}
        loading={isDropping}
        title="Drop Course Registration"
        message={`Are you sure you want to mark this course registration as DROPPED for "${getStudentInfo(dropTarget || {}).name}" in "${getCourseInfo(dropTarget || {}).code}"?`}
        confirmText="Confirm Drop"
        confirmColor="blue"
      />

      {/* Delete Record Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Remove Registration Record"
        message="Are you sure you want to completely erase this registration entry from the database? This action is permanent."
        confirmText="Delete Record"
        confirmColor="red"
      />
    </div>
  );
};

export default RegistrationsPage;
