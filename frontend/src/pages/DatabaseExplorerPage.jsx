import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import exportToCSV from '../utils/csvExport';
import {
  Database,
  Table,
  Server,
  Layers,
  FileCode,
  Download,
  RefreshCw,
  Key,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Hash,
  Eye,
  Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DatabaseExplorerPage = () => {
  // DB status & tables
  const [dbStatus, setDbStatus] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'structure'

  // Table Structure
  const [tableStructure, setTableStructure] = useState([]);
  const [loadingStructure, setLoadingStructure] = useState(false);

  // Table Records
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotalPages, setRecordsTotalPages] = useState(1);
  const [recordsSearch, setRecordsSearch] = useState('');
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Overall status loading
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Fetch DB Status & Table List
  const fetchOverview = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    else setLoadingOverview(true);

    try {
      const [statusRes, tablesRes] = await Promise.allSettled([
        api.get('/api/owner/db-status'),
        api.get('/api/owner/tables'),
      ]);

      if (statusRes.status === 'fulfilled') {
        setDbStatus(statusRes.value.data);
      } else {
        console.warn('Could not fetch db-status:', statusRes.reason);
      }

      if (tablesRes.status === 'fulfilled') {
        const rawTables = tablesRes.value.data;
        let formattedTables = [];
        if (Array.isArray(rawTables)) {
          formattedTables = rawTables.map((t) => {
            if (typeof t === 'string') {
              return { name: t, recordCount: 0 };
            }
            return {
              name: t.name || t.tableName || 'unknown',
              recordCount: t.recordCount ?? t.count ?? t.rowCount ?? 0,
            };
          });
        }
        setTables(formattedTables);

        // Auto select first table if none selected
        if (!selectedTable && formattedTables.length > 0) {
          setSelectedTable(formattedTables[0].name);
        }
      }

      if (showToast) {
        toast.success('Database Explorer refreshed');
      }
    } catch (error) {
      console.error('Error fetching owner overview:', error);
      toast.error('Failed to load database overview');
    } finally {
      setLoadingOverview(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // 2. Fetch Structure for Selected Table
  const fetchTableStructure = useCallback(async (tableName) => {
    if (!tableName) return;
    setLoadingStructure(true);
    try {
      const res = await api.get(`/api/owner/tables/${tableName}`);
      let cols = [];
      if (Array.isArray(res.data)) {
        cols = res.data;
      } else if (res.data?.columns && Array.isArray(res.data.columns)) {
        cols = res.data.columns;
      }
      setTableStructure(cols);
    } catch (error) {
      console.error('Error fetching table structure:', error);
      toast.error(`Failed to load structure for ${tableName}`);
      setTableStructure([]);
    } finally {
      setLoadingStructure(false);
    }
  }, []);

  // 3. Fetch Records for Selected Table
  const fetchTableRecords = useCallback(
    async (tableName, page = 1, search = '') => {
      if (!tableName) return;
      setLoadingRecords(true);
      try {
        const pageIndex = Math.max(0, page - 1);
        const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
        const res = await api.get(
          `/api/owner/tables/${tableName}/records?page=${pageIndex}&size=20${searchParam}`
        );

        const data = res.data;
        if (data && typeof data === 'object' && Array.isArray(data.content)) {
          // Spring Page structure
          setRecords(data.content);
          setTotalRecords(data.totalElements || data.content.length);
          setRecordsTotalPages(data.totalPages || 1);
        } else if (Array.isArray(data)) {
          // Direct array
          setRecords(data);
          setTotalRecords(data.length);
          setRecordsTotalPages(Math.ceil(data.length / 20) || 1);
        } else {
          setRecords([]);
          setTotalRecords(0);
          setRecordsTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching table records:', error);
        toast.error(`Failed to load records for ${tableName}`);
        setRecords([]);
      } finally {
        setLoadingRecords(false);
      }
    },
    []
  );

  // Trigger data fetch when table changes
  useEffect(() => {
    if (selectedTable) {
      fetchTableStructure(selectedTable);
      setRecordsPage(1);
      setRecordsSearch('');
      fetchTableRecords(selectedTable, 1, '');
    }
  }, [selectedTable, fetchTableStructure, fetchTableRecords]);

  // Handle Search for Records
  const handleRecordsSearch = (query) => {
    setRecordsSearch(query);
    setRecordsPage(1);
    fetchTableRecords(selectedTable, 1, query);
  };

  // Handle Page Change for Records
  const handlePageChange = (newPage) => {
    setRecordsPage(newPage);
    fetchTableRecords(selectedTable, newPage, recordsSearch);
  };

  // Filter out any sensitive fields (like password_hash) from visible table & export
  const sanitizeRecord = (rec) => {
    const clean = { ...rec };
    Object.keys(clean).forEach((k) => {
      if (k.toLowerCase().includes('password') || k.toLowerCase().includes('hash')) {
        clean[k] = '••••••••';
      }
    });
    return clean;
  };

  // Export Records to CSV
  const handleExportRecordsCSV = () => {
    if (!records.length) {
      toast.error('No records available to export');
      return;
    }
    const sanitized = records.map(sanitizeRecord);
    exportToCSV(sanitized, `${selectedTable}_records.csv`);
    toast.success(`Exported ${selectedTable} records to CSV`);
  };

  // Dynamic columns for table records DataTable
  const dynamicRecordColumns = React.useMemo(() => {
    if (!records || records.length === 0) {
      // Fallback to table structure columns if records are currently empty
      if (tableStructure.length > 0) {
        return tableStructure
          .filter(
            (col) =>
              !(col.columnName || col.name || '').toLowerCase().includes('password') &&
              !(col.columnName || col.name || '').toLowerCase().includes('hash')
          )
          .map((col) => {
            const key = col.columnName || col.name;
            return {
              key,
              label: key,
              sortable: true,
            };
          });
      }
      return [];
    }

    // Derive from first row keys
    const firstRow = records[0];
    return Object.keys(firstRow)
      .filter((key) => !key.toLowerCase().includes('password') && !key.toLowerCase().includes('hash'))
      .map((key) => ({
        key,
        label: key,
        sortable: false,
        render: (row) => {
          const val = row[key];
          if (val === null || val === undefined) {
            return <span className="text-slate-400 italic text-xs">NULL</span>;
          }
          if (typeof val === 'boolean') {
            return val ? (
              <span className="text-emerald-600 font-semibold text-xs">TRUE</span>
            ) : (
              <span className="text-slate-400 font-semibold text-xs">FALSE</span>
            );
          }
          if (typeof val === 'object') {
            return <span className="font-mono text-xs text-slate-500">{JSON.stringify(val)}</span>;
          }
          return <span className="text-slate-700 text-xs">{String(val)}</span>;
        },
      }));
  }, [records, tableStructure]);

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Database Explorer
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-500/20 uppercase tracking-wider">
              Owner Mode
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time metadata inspection, schema definitions, and direct record browsing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchOverview(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Database Connection Status Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <Server size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Database Connection Health</h2>
              <p className="text-xs text-slate-400">Connection pool and live engine status</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                dbStatus?.connectionValid !== false
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  dbStatus?.connectionValid !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {dbStatus?.connectionValid !== false ? 'Connected & Valid' : 'Connection Error'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/60">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Database</span>
            <p className="mt-1 text-sm font-bold text-white truncate">
              {dbStatus?.database || dbStatus?.databaseName || 'CollegeRegistration'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/60">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">RDBMS Engine</span>
            <p className="mt-1 text-sm font-bold text-white truncate">
              {dbStatus?.databaseProductName || dbStatus?.product || 'MySQL'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/60">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Server Version</span>
            <p className="mt-1 text-sm font-bold text-white truncate">
              {dbStatus?.serverVersion || dbStatus?.version || '8.0+'}
            </p>
          </div>

          <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/60">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tables Count</span>
            <p className="mt-1 text-sm font-bold text-indigo-400">
              {tables.length} Active Tables
            </p>
          </div>
        </div>
      </div>

      {/* Main Explorer Body: Left Table Selector + Right Table Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Table List Sidebar */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Database Tables</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">{tables.length}</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[550px] pr-1">
            {tables.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No tables discovered</p>
            ) : (
              tables.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedTable(t.name)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                    selectedTable === t.name
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Table size={15} className={selectedTable === t.name ? 'text-white' : 'text-slate-400'} />
                    <span className="truncate">{t.name}</span>
                  </div>
                  {t.recordCount !== undefined && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        selectedTable === t.name
                          ? 'bg-indigo-800 text-indigo-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.recordCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Table View (Tabs: Data / Structure) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Bar for Selected Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold">
                <Table size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 font-mono">
                  {selectedTable || 'Select a table'}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeTab === 'data' ? `${totalRecords} total row(s)` : `${tableStructure.length} column(s)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('data')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === 'data'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers size={14} />
                  <span>Records Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('structure')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === 'structure'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode size={14} />
                  <span>Table Schema</span>
                </button>
              </div>

              {activeTab === 'data' && (
                <button
                  type="button"
                  onClick={handleExportRecordsCSV}
                  disabled={records.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  title="Export records to CSV"
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Records View */}
          {activeTab === 'data' && (
            <DataTable
              columns={dynamicRecordColumns}
              data={records}
              loading={loadingRecords}
              searchPlaceholder={`Search within ${selectedTable}...`}
              searchValue={recordsSearch}
              onSearch={handleRecordsSearch}
              currentPage={recordsPage}
              totalPages={recordsTotalPages}
              totalItems={totalRecords}
              onPageChange={handlePageChange}
              emptyMessage={`No records found in table '${selectedTable}'`}
            />
          )}

          {/* Tab 2: Structure View */}
          {activeTab === 'structure' && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Column Name</th>
                      <th className="px-6 py-3.5">Data Type</th>
                      <th className="px-6 py-3.5">Primary Key</th>
                      <th className="px-6 py-3.5">Nullable</th>
                      <th className="px-6 py-3.5">Extra / Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingStructure ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                          Loading schema details...
                        </td>
                      </tr>
                    ) : tableStructure.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                          No schema metadata available
                        </td>
                      </tr>
                    ) : (
                      tableStructure.map((col, idx) => {
                        const colName = col.columnName || col.name || `col_${idx}`;
                        const colType = col.dataType || col.type || 'VARCHAR';
                        const isPk = col.primaryKey ?? col.isPrimaryKey ?? (col.key === 'PRI');
                        const isFk = col.foreignKey ?? col.isForeignKey ?? (col.key === 'MUL');
                        const isNull = col.nullable ?? col.isNullable ?? false;

                        return (
                          <tr key={colName} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-800">
                              <div className="flex items-center gap-2">
                                <span>{colName}</span>
                                {isPk && (
                                  <span className="inline-flex items-center gap-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                    <Key size={10} />
                                    PK
                                  </span>
                                )}
                                {isFk && (
                                  <span className="inline-flex items-center gap-1 rounded-sm bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                                    FK
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-3.5 font-mono text-xs text-indigo-600">
                              {colType}
                            </td>
                            <td className="px-6 py-3.5">
                              {isPk ? (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold">
                                  <CheckCircle2 size={14} /> Yes
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5">
                              {isNull ? (
                                <span className="text-xs text-slate-600">Nullable</span>
                              ) : (
                                <span className="text-xs font-semibold text-rose-600">NOT NULL</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">
                              {col.extra || col.defaultValue || (col.autoIncrement ? 'AUTO_INCREMENT' : '-')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseExplorerPage;
