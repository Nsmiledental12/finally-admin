import React, { useState, useEffect } from 'react';
import { Download, Users, FileText, UserCheck, Loader, AlertCircle } from 'lucide-react';
import Chart from './Chart';
import { analyticsService, AnalyticsOverview, MonthlyData, DoctorStatusDistribution } from '../services/analyticsService';

const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [clinicsGrowth, setClinicsGrowth] = useState<MonthlyData[]>([]);
  const [applicationsTrend, setApplicationsTrend] = useState<MonthlyData[]>([]);
  const [doctorDistribution, setDoctorDistribution] = useState<DoctorStatusDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, growthData, trendData, distributionData] = await Promise.all([
        analyticsService.fetchOverview(),
        analyticsService.fetchClinicsGrowth(),
        analyticsService.fetchApplicationsTrend(),
        analyticsService.fetchDoctorStatusDistribution()
      ]);
      setOverview(overviewData);
      setClinicsGrowth(growthData);
      setApplicationsTrend(trendData);
      setDoctorDistribution(distributionData);
    } catch (err) {
      setError('Failed to load analytics data. Please ensure the backend server is running.');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const applicationStatusData = {
    labels: ['Approved', 'Pending', 'Rejected', 'In Process', 'New'],
    datasets: [{
      data: [
        overview?.applicationStatusBreakdown.approved || 0,
        overview?.applicationStatusBreakdown.pending || 0,
        overview?.applicationStatusBreakdown.rejected || 0,
        overview?.applicationStatusBreakdown['in-process'] || 0,
        overview?.applicationStatusBreakdown.new || 0
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6']
    }]
  };

  const patientGrowthData = {
    labels: clinicsGrowth.length > 0 ? clinicsGrowth.map(d => d.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'New Clinics',
      data: clinicsGrowth.length > 0 ? clinicsGrowth.map(d => d.count) : [0, 0, 0, 0, 0, 0],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  };

  const doctorStatusData = {
    labels: ['Active', 'Resigned'],
    datasets: [{
      data: [doctorDistribution?.active || 0, doctorDistribution?.resigned || 0],
      backgroundColor: ['#10B981', '#EF4444']
    }]
  };

  const monthlyApplicationsData = {
    labels: applicationsTrend.length > 0 ? applicationsTrend.map(d => d.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Applications',
      data: applicationsTrend.length > 0 ? applicationsTrend.map(d => d.count) : [0, 0, 0, 0, 0, 0],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)'
    }]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600 mt-2">Comprehensive insights and data visualization</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      ) : (
        <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.approvedDoctors || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-teal-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clinics</p>
              <p className="text-2xl font-bold text-gray-900">{overview?.totalClinics || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Application Status Breakdown</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
          </div>
          <Chart type="pie" data={applicationStatusData} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Clinic Growth Over Time</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
          </div>
          <Chart type="line" data={patientGrowthData} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Doctor Status Distribution</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
          </div>
          <Chart type="pie" data={doctorStatusData} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Applications Trend</h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
          </div>
          <Chart type="line" data={monthlyApplicationsData} />
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200">
            <div className="text-center">
              <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Doctor Applications Report</p>
              <p className="text-sm text-gray-500">Export as CSV or PDF</p>
            </div>
          </button>

          <button className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-colors duration-200">
            <div className="text-center">
              <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Clinic Analytics Report</p>
              <p className="text-sm text-gray-500">Export as CSV or PDF</p>
            </div>
          </button>

          <button className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200">
            <div className="text-center">
              <Download className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">System Performance Report</p>
              <p className="text-sm text-gray-500">Export as CSV or PDF</p>
            </div>
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default Analytics;