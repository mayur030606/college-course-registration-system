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
  Building2,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

const initialFormState = {
  name: '',
  code: '',
  headOfDept: '',
  description: '',
};

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('departmentId');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/departments');
      setDepartments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load academic departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingDepartment(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (dept) => {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      headOfDept: dept.headOfDept || '',
      description: dept.description || '',
    });
    setIsModalOpen(true);
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      if (editingDepartment) {
        const deptId = editingDepartment.departmentId || editingDepartment.id;
        const res = await api.put(`/api/departments/${deptId}`, formData);
        toast.success('Department updated successfully');
        setDepartments((prev) =>
          prev.map((d) => ((d.departmentId || d.id) === deptId ? res.data : d))
        );
      } else {
        const res = await api.post('/api/departments', formData);
        toast.success('Department created successfully');
        setDepartments((prev) => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Department
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const deptId = deleteTarget.departmentId || deleteTarget.id;
    setIsDeleting(true);

    try {
      await api.delete(`/api/departments/${deptId}`);
      toast.success('Department deleted successfully');
      setDepartments((prev) => prev.filter((d) => (d.departmentId || d.id) !== deptId));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error(error.response?.data?.message || 'Cannot delete department in use');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Sort
  const handleSort = (key, direction) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  // Filter & Sort Departments
  const filteredAndSortedDepartments = useMemo(() => {
    let result = [...departments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.code?.toLowerCase().includes(q) ||
          d.headOfDept?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

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
  }, [departments, searchQuery, sortKey, sortDirection]);

  // Paginated Departments
  const totalPages = Math.ceil(filteredAndSortedDepartments.length / pageSize) || 1;
  const paginatedDepartments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedDepartments.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedDepartments, currentPage, pageSize]);

  // Export CSV
  const handleExportCSV = () => {
    const exportData = filteredAndSortedDepartments.map((d) => ({
      ID: d.departmentId || d.id,
      'Department Name': d.name,
      Code: d.code,
      'Head of Department': d.headOfDept || '',
      Description: d.description || '',
    }));
    exportToCSV(exportData, 'departments_list.csv');
    toast.success('Departments exported to CSV');
  };

  // Columns Configuration
  const columns = [
    {
      key: 'departmentId',
      label: 'ID',
      sortable: true,
      render: (d) => (
        <span className="font-mono text-xs font-semibold text-slate-500">
          #{d.departmentId || d.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Department Name',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Building2 size={18} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{d.name}</p>
            <p className="text-xs text-slate-400 line-clamp-1">{d.description || 'No description provided'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (d) => (
        <span className="inline-flex items-center rounded-md bg-purple-100/80 px-2.5 py-0.5 text-xs font-bold text-purple-800 tracking-wider">
          {d.code}
        </span>
      ),
    },
    {
      key: 'headOfDept',
      label: 'Head of Department',
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-2 text-slate-700">
          <UserCheck size={16} className="text-slate-400" />
          <span>{d.headOfDept || <span className="text-slate-400 italic">Not Assigned</span>}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Academic Departments
          </h1>
          <p className="text-sm text-slate-500">
            Create, update, and manage academic departments and their department heads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDepartments}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={departments.length === 0}
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
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedDepartments}
        loading={loading}
        searchPlaceholder="Search departments by name, code, or head..."
        searchValue={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredAndSortedDepartments.length}
        onPageChange={(page) => setCurrentPage(page)}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        actions={(dept) => (
          <>
            <button
              type="button"
              onClick={() => handleOpenEdit(dept)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              title="Edit department"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(dept)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Delete department"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDepartment ? 'Edit Department' : 'Create New Department'}
        size="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. Computer Science"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Department Code *
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 uppercase focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. CS"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">
                Head of Department
              </label>
              <input
                type="text"
                value={formData.headOfDept}
                onChange={(e) => setFormData({ ...formData, headOfDept: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g. Dr. Rajesh Kumar"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              placeholder="Brief description about the academic curriculum and focus"
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
                : editingDepartment
                ? 'Update Department'
                : 'Create Department'}
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
        title="Delete Department"
        message={`Are you sure you want to delete the department "${deleteTarget?.name}" (${deleteTarget?.code})? If students or courses belong to this department, foreign key constraints may be affected.`}
        confirmText="Delete Department"
        confirmColor="red"
      />
    </div>
  );
};

export default DepartmentsPage;
