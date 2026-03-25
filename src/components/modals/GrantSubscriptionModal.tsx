import React, { useState, useEffect } from 'react';
import { X, Search, CreditCard } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface User {
  uuid: string;
  username: string;
  email: string;
}

interface TestSeries {
  id: number;
  title: string;
  price: number;
  validity_days: number;
}

interface GrantSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GrantSubscriptionModal: React.FC<GrantSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    test_series_id: '',
    payment_method: 'admin_grant',
    amount_paid: 0,
    currency: 'INR',
    expiry_days: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchTestSeries();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/students', {
        params: { limit: 100 }
      });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchTestSeries = async () => {
    try {
      const response = await api.get('/admin/test-management', {
        params: { limit: 100 }
      });

      // Safely extract the testSeries array with fallback
      const testSeriesData = response.data?.data || [];

      // Ensure it's an array before setting state
      if (Array.isArray(testSeriesData)) {
        setTestSeries(testSeriesData);
      } else {
        console.warn('Expected testSeries to be an array, got:', typeof testSeriesData);
        setTestSeries([]);
      }
    } catch (error) {
      console.error('Error fetching test series:', error);
      toast.error('Failed to fetch test series');
      setTestSeries([]); // Ensure state remains as empty array on error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate unique transaction ID for admin grants
      const transactionId = `ADMIN_GRANT_${Date.now()}_${formData.user_id.slice(0, 8)}`;

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + formData.expiry_days);


      await api.post('/admin/subscriptions/manual', {
        user_id: formData.user_id,
        test_series_id: formData.test_series_id,
        transaction_id: transactionId,
        payment_method: formData.payment_method,
        amount_paid: formData.amount_paid,
        currency: formData.currency,
        status: 'completed',
        expiry_date: expiryDate.toISOString()
      });

      toast.success('Subscription granted successfully!');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        user_id: '',
        test_series_id: '',
        payment_method: 'admin_grant',
        amount_paid: 0,
        currency: 'INR',
        expiry_days: 0
      });
    } catch (error: any) {
      console.error('Error granting subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to grant subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSeriesChange = (testSeriesId: string) => {
    const selectedTestSeries = testSeries.find(ts => ts.id.toString() === testSeriesId);
    setFormData({
      ...formData,
      test_series_id: testSeriesId,
      amount_paid: selectedTestSeries?.price || 0,
      expiry_days: selectedTestSeries?.validity_days || 0 // Assuming 30 days for paid, 0 for free
    });
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-primary-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold">Grant Subscription</h2>
              <p className="text-sm text-gray-600">Give a subscription to any user</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select a user</option>
                  {filteredUsers.map(user => (
                    <option key={user.uuid} value={user.uuid}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Test Series Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Series
              </label>
              <select
                value={formData.test_series_id}
                onChange={(e) => handleTestSeriesChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select test series</option>
                {Array.isArray(testSeries) && testSeries.map(ts => (
                  <option key={ts.id} value={ts.id}>
                    {ts.title} (₹{ts.price})
                  </option>
                ))}
              </select>
            </div>

            {/* Subscription Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Set to 0 for free subscription</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Months)
                </label>
                <input
                  value={`${formData.expiry_days} Days`}
                  disabled
                  // onChange={(e) => setFormData({ ...formData, expiry_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grant Type
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="admin_grant">Admin Grant (Free)</option>
                <option value="manual_payment">Manual Payment</option>
                <option value="refund_compensation">Refund/Compensation</option>
                <option value="promotional">Promotional Offer</option>
              </select>
            </div>

            {/* Summary */}
            {formData.user_id && formData.test_series_id && (
              <div className="bg-primary-50 p-4 rounded-lg">
                <h3 className="font-medium text-primary-900 mb-2">Subscription Summary</h3>
                <div className="text-sm text-primary-800 space-y-1">
                  <p><span className="font-medium">User:</span> {users.find(u => u.uuid === formData.user_id)?.username}</p>
                  <p><span className="font-medium">Test Series:</span> {testSeries.find(ts => ts.id.toString() === formData.test_series_id)?.title}</p>
                  <p><span className="font-medium">Amount:</span> ₹{formData.amount_paid} {formData.amount_paid === 0 ? '(Free)' : ''}</p>
                  <p><span className="font-medium">Duration:</span> {formData.expiry_days === 0 ? 'Lifetime' : `${formData.expiry_days} Days`}</p>
                  <p><span className="font-medium">Type:</span> {formData.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              disabled={loading || !formData.user_id || !formData.test_series_id}
            >
              {loading ? 'Granting...' : 'Grant Subscription'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};