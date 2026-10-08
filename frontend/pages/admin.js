import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // users, bookings, reviews, analytics
  const [flaggedReviews, setFlaggedReviews] = useState([]);
  const [moderationError, setModerationError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // In a real app, these would call the backend APIs
      // const usersResponse = await axios.get('/api/admin/users');
      // setUsers(usersResponse.data);

      // Mock data for demonstration
      setTimeout(() => {
        setUsers([
          {
            id: 1,
            email: 'admin@mytrip.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            phone: '+1 (555) 987-6543',
            address: 'Admin Headquarters',
            createdAt: '2026-08-01T10:00:00Z'
          },
          {
            id: 2,
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER',
            phone: '+1 (555) 123-4567',
            address: '123 Main Street, Anytown, USA',
            createdAt: '2026-09-01T10:00:00Z'
          },
          {
            id: 3,
            email: 'traveler@email.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'USER',
            phone: '+1 (555) 234-5678',
            address: '456 Oak Avenue, Somewhere, USA',
            createdAt: '2026-09-15T14:30:00Z'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load admin data');
      setLoading(false);
    }
  };

  const loadFlaggedReviews = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/reviews/moderation/flagged`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFlaggedReviews(response.data);
      setModerationError('');
    } catch (requestError) {
      setModerationError(requestError.response?.data?.message || 'Admin sign-in is required to moderate reviews.');
    }
  };

  const moderateReview = async (id, decision) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/reviews/${id}/moderate`,
        { decision, notes: decision === 'REMOVE' ? 'Removed after moderator review.' : 'Approved after moderator review.' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      await loadFlaggedReviews();
    } catch (requestError) {
      setModerationError(requestError.response?.data?.message || 'Review moderation failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={() => fetchAdminData()} className="btn-outline mt-4">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - MyTrip</title>
      </Head>

      <div className="min-h-screen bg-light">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r shadow-md">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white text-lg">
                MT
              </div>
              <div>
                <h2 className="text-xl font-semibold">MyTrip Admin</h2>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium ${activeTab === 'users' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium ${activeTab === 'bookings' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Bookings
              </button>
              <button
                onClick={() => { setActiveTab('reviews'); loadFlaggedReviews(); }}
                className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium ${activeTab === 'reviews' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Reviews
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium ${activeTab === 'analytics' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Analytics
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your MyTrip platform</p>
          </div>

          {/* Tab Content */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">User Management</h2>
                <Link href="/admin/users/create" className="btn-outline px-4 py-2">
                  Add New User
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-primary/20 rounded flex items-center justify-center text-primary text-sm">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button className="text-primary hover:text-primary/80 text-sm">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-800 text-sm">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Booking Management</h2>
                <p className="text-gray-600">Overview of all bookings on the platform</p>
                {/* In a real app, this would show bookings data */}
                <div className="text-center py-12">
                  <p className="text-gray-500">Booking management interface would be displayed here</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Flagged review moderation</h2>
                {moderationError && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{moderationError}</p>}
                <div className="space-y-4">
                  {flaggedReviews.map(review => (
                    <article key={review.id} className="rounded border p-4">
                      <p className="font-semibold">{review.title} · {review.rating}/5</p>
                      <p className="my-2">{review.comment}</p>
                      <p className="text-sm text-gray-500">Flagged for moderator review · {review.user?.email}</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => moderateReview(review.id, 'APPROVE')} className="btn-outline">Approve</button>
                        <button onClick={() => moderateReview(review.id, 'REMOVE')} className="btn-primary">Remove</button>
                      </div>
                    </article>
                  ))}
                  {!flaggedReviews.length && !moderationError && <p className="py-8 text-center text-gray-500">No reviews are awaiting moderation.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Platform Analytics</h2>
                <p className="text-gray-600">Key metrics and insights about your travel platform</p>
                {/* In a real app, this would show analytics data */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                    <p className="text-2xl font-bold text-primary">{users.length}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Active Bookings</h3>
                    <p className="text-2xl font-bold text-primary">124</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Revenue This Month</h3>
                    <p className="text-2xl font-bold text-primary">$45,670</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Avg. Rating</h3>
                    <p className="text-2xl font-bold text-primary">4.8/5</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}