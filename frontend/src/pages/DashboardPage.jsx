import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Users,
  BookOpen,
  Building2,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Database,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user, isOwner } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalDepartments: 0,
    totalRegistrations: 0,
    activeRegistrations: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch dashboard statistics
      const statsRes = await api.get('/api/dashboard/stats');
      if (statsRes.data) {
        setStats({
          totalStudents: statsRes.data.totalStudents ?? statsRes.data.students ?? 0,
          totalCourses: statsRes.data.totalCourses ?? statsRes.data.courses ?? 0,
          totalDepartments: statsRes.data.totalDepartments ?? statsRes.data.departments ?? 0,
          totalRegistrations: statsRes.data.totalRegistrations ?? statsRes.data.registrations ?? 0,
          activeRegistrations: statsRes.data.activeRegistrations ?? statsRes.data.active ?? 0,
        });
      }

      // 2. Fetch recent registrations
      try {
        const regRes = await api.get('/api/registrations');
        if (Array.isArray(regRes.data)) {
          // Sort desc by ID or date, take first 5
          const sorted = [...regRes.data].sort((a, b) => (b.registrationId || b.id || 0) - (a.registrationId || a.id || 0));
          setRecentRegistrations(sorted.slice(0, 5));
        }
      } catch (regErr) {
        console.warn('Could not load recent registrations:', regErr);
      }

      if (isRefresh) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
            Completed
          </span>
        );
      case 'DROPPED':
        return (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
            Dropped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-md bg-indigo-500/30 px-2.5 py-1 text-xs font-semibold tracking-wide uppercase text-indigo-200">
                {user?.role || 'User'} Dashboard
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName || user?.username}!
            </h1>
            <p className="mt-1 text-sm sm:text-base text-indigo-200 max-w-xl">
              Manage student registrations, academic departments, courses, and explore real-time enrollment statistics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 backdrop-blur-xs transition-colors focus:outline-hidden disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Link
              to="/registrations"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-400 shadow-md shadow-indigo-500/30 transition-colors"
            >
              <PlusCircle size={16} />
              <span>New Registration</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      {loading ? (
        <div className="py-12">
          <LoadingSpinner text="Loading dashboard statistics..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            color="blue"
            description="Enrolled in system"
          />
          <StatsCard
            title="Total Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            color="green"
            description="Active course offerings"
          />
          <StatsCard
            title="Departments"
            value={stats.totalDepartments}
            icon={Building2}
            color="purple"
            description="Academic divisions"
          />
          <StatsCard
            title="Total Registrations"
            value={stats.totalRegistrations}
            icon={ClipboardList}
            color="orange"
            description="All-time enrollments"
          />
          <StatsCard
            title="Active Registrations"
            value={stats.activeRegistrations}
            icon={CheckCircle2}
            color="teal"
            description="Current semester"
          />
        </div>
      )}

      {/* Bottom Grid: Recent Registrations & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Registrations Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Recent Registrations</h3>
              <p className="text-xs text-slate-400">Latest student course enrollments</p>
            </div>
            <Link
              to="/registrations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/70 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                      No recent registrations recorded yet
                    </td>
                  </tr>
                ) : (
                  recentRegistrations.map((reg) => {
                    const studentName = reg.student
                      ? `${reg.student.firstName} ${reg.student.lastName}`
                      : reg.studentName || `Student #${reg.studentId}`;
                    const courseTitle = reg.course
                      ? `${reg.course.courseCode} - ${reg.course.title}`
                      : reg.courseTitle || `Course #${reg.courseId}`;
                    const dateStr = reg.registrationDate
                      ? new Date(reg.registrationDate).toLocaleDateString()
                      : '-';

                    return (
                      <tr key={reg.registrationId || reg.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                          {studentName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {courseTitle}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(reg.status)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Quick Actions</h3>
            <p className="text-xs text-slate-400 mb-5">Frequently accessed management areas</p>

            <div className="space-y-3">
              <Link
                to="/students"
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Manage Students</h4>
                    <p className="text-xs text-slate-500">View, register, and update student profiles</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>

              <Link
                to="/courses"
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Course Catalog</h4>
                    <p className="text-xs text-slate-500">Configure courses, credits, & instructors</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>

              <Link
                to="/departments"
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:scale-105 transition-transform">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Departments</h4>
                    <p className="text-xs text-slate-500">Manage academic departments & heads</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </Link>

              {isOwner && (
                <Link
                  to="/database-explorer"
                  className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 hover:border-amber-300 hover:bg-amber-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                      <Database size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        Database Explorer
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded-sm">OWNER</span>
                      </h4>
                      <p className="text-xs text-slate-500">Inspect live tables, schemas, & records</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-700 transition-colors" />
                </Link>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-3 border border-slate-100 text-center text-xs text-slate-500">
            System running on Spring Boot 3.2 + MySQL 8.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
