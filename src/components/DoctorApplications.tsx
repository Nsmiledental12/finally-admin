import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, Clock, FileText, AlertCircle, Loader, Lock } from 'lucide-react';
import { Application } from '../types/doctor';
import { doctorService } from '../services/doctorService';

interface DoctorApplicationsProps {
  userRole: 'super_admin' | 'admin' | 'moderator';
}

const DoctorApplications: React.FC<DoctorApplicationsProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedAppIdForStatusChange, setSelectedAppIdForStatusChange] = useState('');
  const [newStatusToApply, setNewStatusToApply] = useState<'new' | 'in-process' | 'pending'>('new');

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorService.fetchAllDoctors();
      setApplications(data);
    } catch (err) {
      setError('Failed to load doctor applications. Please ensure the backend server is running.');
      console.error('Error loading doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Applications', count: applications.length },
    { id: 'new', label: 'New', count: applications.filter(app => app.status === 'new').length },
    { id: 'in-process', label: 'In Process', count: applications.filter(app => app.status === 'in-process').length },
    { id: 'pending', label: 'Pending', count: applications.filter(app => app.status === 'pending').length },
    { id: 'approved', label: 'Approved', count: applications.filter(app => app.status === 'approved').length },
    { id: 'rejected', label: 'Rejected', count: applications.filter(app => app.status === 'rejected').length }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', icon: FileText },
      'in-process': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      pending: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: 'new' | 'in-process' | 'pending' | 'approved' | 'rejected') => {
    if ((newStatus === 'approved' || newStatus === 'rejected') && userRole !== 'super_admin') {
      setError('Only super admins can approve or reject applications.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      setUpdatingStatus(true);
      await doctorService.updateDoctorStatus(applicationId, newStatus, userRole);
      setApplications(prevApplications =>
        prevApplications.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFormStatusUpdate = async () => {
    if (selectedAppIdForStatusChange) {
      await handleStatusUpdate(selectedAppIdForStatusChange, newStatusToApply);
      setSelectedAppIdForStatusChange('');
      setNewStatusToApply('new');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeTab === 'all' || app.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const pendingApplications = applications.filter(app => app.status === 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Doctor Applications</h2>
        <p className="text-gray-600 mt-2">Review and manage doctor applications</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading doctor applications...</p>
        </div>
      ) : (
        <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">All Doctor Applications</h3>

          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by doctor name or specialization..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No applications found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application) => (
              <div key={application.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{application.doctorName}</h4>
                    <p className="text-sm text-gray-600">{application.specialization}</p>
                    <p className="text-sm text-gray-500 mt-1">Applied: {new Date(application.dateOfApplication).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(application.status)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {application.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Experience:</span> {application.experience}
                  </p>
                  {application.mobileNumber && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {application.countryCode} {application.mobileNumber}
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedApplication(application)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Update Application Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Application
            </label>
            <select
              value={selectedAppIdForStatusChange}
              onChange={(e) => setSelectedAppIdForStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an application...</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.id} - {app.doctorName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <select
              value={newStatusToApply}
              onChange={(e) => setNewStatusToApply(e.target.value as 'new' | 'in-process' | 'pending')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="new">New</option>
              <option value="in-process">In Process</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <button
              onClick={handleFormStatusUpdate}
              disabled={!selectedAppIdForStatusChange || updatingStatus}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {updatingStatus ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Pending Applications
            <span className="ml-2 bg-orange-100 text-orange-800 text-sm font-medium px-2 py-1 rounded-full">
              {pendingApplications.length}
            </span>
          </h3>
          {userRole !== 'super_admin' && (
            <div className="flex items-center bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <Lock className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-700">Super Admin access required to approve/reject</span>
            </div>
          )}
        </div>

        {pendingApplications.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending applications at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingApplications.map((application) => (
              <div key={application.id} className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{application.doctorName}</h4>
                    <p className="text-sm text-gray-600">{application.specialization}</p>
                    <p className="text-sm text-gray-500 mt-1">Applied: {new Date(application.dateOfApplication).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(application.status)}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {application.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Experience:</span> {application.experience}
                  </p>
                </div>

                <div className="flex space-x-3">
                  {userRole === 'super_admin' ? (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(application.id, 'approved')}
                        disabled={updatingStatus}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(application.id, 'rejected')}
                        disabled={updatingStatus}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center text-sm"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="w-full bg-gray-100 border border-gray-300 text-gray-500 py-2 px-3 rounded-lg flex items-center justify-center text-sm">
                      <Lock className="h-4 w-4 mr-2" />
                      Super Admin access required
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Application Details</h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Application ID</label>
                  <p className="text-gray-900">{selectedApplication.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Doctor Name</label>
                  <p className="text-gray-900">{selectedApplication.doctorName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedApplication.email}</p>
                </div>
                {selectedApplication.mobileNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedApplication.countryCode} {selectedApplication.mobileNumber}</p>
                  </div>
                )}
                {selectedApplication.licenseNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">License Number</label>
                    <p className="text-gray-900">{selectedApplication.licenseNumber}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Specialization</label>
                  <p className="text-gray-900">{selectedApplication.specialization}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Experience</label>
                  <p className="text-gray-900">{selectedApplication.experience}</p>
                </div>
                {selectedApplication.clinicAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Clinic Address</label>
                    <p className="text-gray-900">{selectedApplication.clinicAddress}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Date of Application</label>
                  <p className="text-gray-900">{new Date(selectedApplication.dateOfApplication).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Current Status</label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorApplications;
