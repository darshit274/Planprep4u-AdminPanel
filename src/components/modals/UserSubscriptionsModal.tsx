import React, { useState, useEffect } from 'react';
import { CreditCard, X, Plus, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface User {
  uuid: string;
  username: string;
  email: string;
  subscription_status: 'none' | 'active' | 'expired';
  total_subscriptions: number;
}

interface Subscription {
  id: string;
  test_series_id: string;
  transaction_id: string;
  payment_method: string;
  amount_paid: number;
  currency: string;
  status: string;
  purchase_date: string;
  expiry_date: string | null;
  is_active: boolean;
  days_remaining: number | null;
  testSeries: {
    id: string;
    title: string;
    price: number;
  };
}

interface UserSubscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: () => void;
}

export const UserSubscriptionsModal: React.FC<UserSubscriptionsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableTestSeries, setAvailableTestSeries] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    test_series_id: '',
    transaction_id: '',
    payment_method: 'manual',
    amount_paid: 0,
    currency: 'INR'
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchUserSubscriptions();
      fetchAvailableTestSeries();
    }
  }, [isOpen, user]);

  const fetchUserSubscriptions = async () => {
    try {
      setLoading(true);
      // Using admin endpoint to get specific user's subscriptions
      const response = await api.get('/subscriptions/all', {
        params: {
          search: user.email,
          limit: 100
        }
      });
      // Filter to only show this user's subscriptions
      const userSubs = response.data.data.filter((sub: any) => sub.user_id === user.uuid);
      setSubscriptions(userSubs);
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTestSeries = async () => {
    try {
      const response = await api.get('/admin/test-series', {
        params: { limit: 100 }
      });
      setAvailableTestSeries(response.data.data);
    } catch (error) {
      console.error('Error fetching test series:', error);
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate a unique transaction ID for manual subscriptions
      const transactionId = `MANUAL_${Date.now()}_${user.uuid.slice(0, 8)}`;
      
      await api.post('/admin/subscriptions/manual', {
        user_id: user.uuid,
        ...formData,
        transaction_id: transactionId,
        status: 'completed'
      });
      
      toast.success('Subscription added successfully');
      setShowAddForm(false);
      setFormData({
        test_series_id: '',
        transaction_id: '',
        payment_method: 'manual',
        amount_paid: 0,
        currency: 'INR'
      });
      fetchUserSubscriptions();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error adding subscription:', error);
      toast.error(error.response?.data?.message || 'Failed to add subscription');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      await api.patch(`/admin/subscriptions/${subscriptionId}/status`, {
        status: 'refunded',
        expiry_date: new Date().toISOString()
      });
      
      toast.success('Subscription cancelled successfully');
      fetchUserSubscriptions();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleExtendSubscription = async (subscriptionId: string, days: number) => {
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) return;
      
      const currentExpiry = subscription.expiry_date ? new Date(subscription.expiry_date) : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + days);
      
      await api.patch(`/admin/subscriptions/${subscriptionId}/status`, {
        expiry_date: newExpiry.toISOString()
      });
      
      toast.success(`Subscription extended by ${days} days`);
      fetchUserSubscriptions();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error extending subscription:', error);
      toast.error('Failed to extend subscription');
    }
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) return 'bg-green-100 text-green-800';
    if (status === 'refunded') return 'bg-red-100 text-red-800';
    if (status === 'completed') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusIcon = (status: string, isActive: boolean) => {
    if (isActive) return <CheckCircle className="h-4 w-4" />;
    if (status === 'refunded') return <XCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Manage Subscriptions</h2>
            <p className="text-sm text-gray-600 mt-1">
              {user.username} ({user.email})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* User Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Subscription Status</p>
                <p className="text-lg font-medium capitalize">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                    user.subscription_status === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.subscription_status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Subscriptions</p>
                <p className="text-lg font-medium">{user.total_subscriptions}</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add Subscription
              </button>
            </div>
          </div>

          {/* Add Subscription Form */}
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg">
              <h3 className="font-medium mb-4">Add New Subscription</h3>
              <form onSubmit={handleAddSubscription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Series
                  </label>
                  <select
                    value={formData.test_series_id}
                    onChange={(e) => {
                      const testSeries = availableTestSeries.find(ts => ts.id === e.target.value);
                      setFormData({
                        ...formData,
                        test_series_id: e.target.value,
                        amount_paid: testSeries?.price || 0
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Test Series</option>
                    {availableTestSeries.map(ts => (
                      <option key={ts.id} value={ts.id}>
                        {ts.title} (₹{ts.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Paid
                    </label>
                    <input
                      type="number"
                      value={formData.amount_paid}
                      onChange={(e) => setFormData({ ...formData, amount_paid: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="manual">Manual</option>
                      <option value="UPI">UPI</option>
                      <option value="card">Card</option>
                      <option value="netbanking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Add Subscription
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subscriptions List */}
          {loading ? (
            <LoadingSpinner />
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No subscriptions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{subscription.testSeries.title}</h4>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Transaction ID:</span> {subscription.transaction_id}
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span> {subscription.currency} {subscription.amount_paid}
                        </div>
                        <div>
                          <span className="font-medium">Purchase Date:</span> {new Date(subscription.purchase_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Expiry:</span> {
                            subscription.expiry_date ? 
                              new Date(subscription.expiry_date).toLocaleDateString() : 
                              'Lifetime'
                          }
                          {subscription.days_remaining !== null && subscription.days_remaining > 0 && (
                            <span className="text-xs text-gray-500"> ({subscription.days_remaining} days left)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(subscription.status, subscription.is_active)
                      }`}>
                        {getStatusIcon(subscription.status, subscription.is_active)}
                        <span className="ml-1">{subscription.is_active ? 'Active' : subscription.status}</span>
                      </span>
                      
                      {subscription.is_active && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExtendSubscription(subscription.id, 30)}
                            className="text-sm text-primary-600 hover:text-primary-800"
                            title="Extend by 30 days"
                          >
                            +30d
                          </button>
                          <button
                            onClick={() => handleCancelSubscription(subscription.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};