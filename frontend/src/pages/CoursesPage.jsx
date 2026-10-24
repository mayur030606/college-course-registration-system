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
  BookOpen,
  RefreshCw,
  User,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

const initialFormState = {
  courseCode: '',
  title: '',
  description: '',
  credits: 3,
  maxCapacity: 60,
  departmentId: '',
  semester: 1,
  instructor: '',
};

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('courseId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch courses and departments
  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        api.get('/api/courses'),
        api.get('/api/departments'),
      ]);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : []);
    } catch (error) {
      console.error('Error fetching courses data:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormData({
      ...initialFormState,
      departmentId: departments[0]?.departmentId || departments[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    const deptId =
      course.departmentId ||
      course.department?.departmentId ||
      course.department?.id ||
      '';

    setFormData({
      courseCode: course.courseCode || '',
      title: course.title || '',
      description: course.description || '',
      credits: course.credits || 3,
      maxCapacity: course.maxCapacity || 60,
      departmentId: deptId,
      semester: course.semester || 1,
      instructor: course.instructor || '',
    });
    setIsModalOpen(true);
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    const payload = {
      ...formData,
      credits: Number(formData.credits),
      maxCapacity: Number(formData.maxCapacity),
      semester: Number(formData.semester),
      departmentId: formData.departmentId ? Number(formData.departmentId) : null,
    };

    try {
      if (editingCourse) {
        const courseId = editingCourse.courseId || editingCourse.id;
        const res = await api.put(`/api/courses/${courseId}`, payload);
        toast.success('Course updated successfully');
        setCourses((prev) =>
          prev.map((c) => ((c.courseId || c.id) === courseId ? res.data : c))
        );
      } else {
        const res = await api.post('/api/courses', payload);
        toast.success('Course created successfully');
        setCourses((prev) => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Course
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const courseId = deleteTarget.courseId || deleteTarget.id;
    setIsDeleting(true);

    try {
      await api.delete(`/api/courses/${courseId}`);
      toast.success('Course removed successfully');
      setCourses((prev) => prev.filter((c) => (c.courseId || c.id) !== courseId));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for Department Name
  const getDepartmentName = (course) => {
    if (course.department?.name) return course.department.name;
    if (course.departmentName) return course.departmentName;
    const deptId = course.departmentId || course.department?.id;
    const found = departments.find(
      (d) => (d.departmentId || d.id) === deptId
    );
    return found ? found.name : '-';
  };

  // Handle Sort
  const handleSort = (key, direction) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  // Filter & Sort Courses
  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.courseCode?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.instructor?.toLowerCase().includes(q) ||
          getDepartmentName(c).toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'department') {
        aVal = getDepartmentName(a).toLowerCase();
        bVal = getDepartmentName(b).toLowerCase();
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
  }, [courses, searchQuery, sortKey, sortDirection, departments]);

  // Paginated Courses
  const totalPages = Math.ceil(filteredAndSortedCourses.length / pageSize) || 1;
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedCourses.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedCourses, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredAndSortedCourses.map((c) => ({
      ID: c.courseId || c.id,
      'Course Code': c.courseCode,
      Title: c.title,
      Credits: c.credits,
      Department: getDepartmentName(c),
      Semester: c.semester,
      Instructor: c.instructor || '',
      'Max Capacity': c.maxCapacity || '',
      Description: c.description || '',
    }));
    exportToCSV(exportData, 'courses_catalog.csv');
    toast.success('Courses exported to CSV');
  };

  // Table Columns
  const columns = [
    {
      key: 'courseCode',
      label: 'Course Code',
      sortable: true,
      render: (c) => (
        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          {c.courseCode}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title & Description',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{c.title}</p>
            <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{c.description || 'No description'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'credits',
      label: 'Credits',
      sortable: true,
      render: (c) => (
        <span className="font-medium text-slate-700">
          {c.credits} {c.credits === 1 ? 'Credit' : 'Credits'}
        </span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      render: (c) => (
        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {getDepartmentName(c)}
        </span>
      ),
    },
    {
      key: 'semester',
      label: 'Semester',
      sortable: true,
      render: (c) => (
        <span className="text-xs font-medium text-slate-600">
          Sem {c.semester}
        </span>
      ),
    },
    {
      key: 'instructor',
      label: 'Instructor',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-1.5 text-slate-700 text-xs">
          <User size={14} className="text-slate-400" />
          <span>{c.instructor || 'TBD'}</span>
        </div>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      sortable: false,
      render: (c) => (
        <span className="text-xs text-slate-600">
          {c.enrolled !== undefined ? `${c.enrolled} / ` : ''}
          {c.maxCapacity} seats
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Course Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Configure courses, credit weightings, prerequisites, and faculty assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={courses.length === 0}
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
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedCourses}
        loading={loading}
        searchPlaceholder="Search courses by code, title, or instructor..."
        searchValue={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredAndSortedCourses.length}
        onPageChange={(page) => setCurrentPage(page)}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        actions={(course) => (
          <>
            <button
              type="button"
              onClick={() => handleOpenEdit(course)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Edit course"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(course)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Delete course"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      />

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Edit Course Details' : 'Add New Course'}
        size="lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Course Code *
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 uppercase focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. CS301"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. Database Management Systems"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Credits (1-6) *
              </label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Max Capacity
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Semester (1-8)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Instructor
              </label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. Prof. Rajesh Kumar"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Course Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              placeholder="Syllabus topics, goals, and learning outcomes"
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
                : editingCourse
                ? 'Update Course'
                : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Delete Course"
        message={`Are you sure you want to delete course "${deleteTarget?.courseCode} - ${deleteTarget?.title}"? Active registrations in this course may be impacted.`}
        confirmText="Delete Course"
        confirmColor="red"
      />
    </div>
  );
};

export default CoursesPage;
