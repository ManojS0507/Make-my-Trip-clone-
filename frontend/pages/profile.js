import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // In a real app, this would call the backend API with auth token
      // const response = await axios.get('/api/auth/profile');
      // setUser(response.data);

      // Mock data for demonstration
      setTimeout(() => {
        setUser({
          id: 1,
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1 (555) 123-4567',
          address: '123 Main Street, Anytown, USA',
          role: 'USER',
          createdAt: '2026-09-01T10:00:00Z'
        });

        setFormData({
          firstName: 'John',
          lastName: 'Doe',
          email: 'user@example.com',
          phone: '+1 (555) 123-4567',
          address: '123 Main Street, Anytown, USA'
        });

        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveProfile = async () => {
    try {
      // In a real app, this would call the backend API
      // await axios.put('/api/users/' + user.id, formData);

      // Mock save
      setTimeout(() => {
        setUser(prev => ({ ...prev, ...formData }));
        setEditMode(false);
        alert('Profile saved successfully!');
      }, 500);
    } catch (err) {
      alert('Failed to save profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button onClick={() => fetchUserProfile()} className="btn-outline mt-4">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">User not found</p>
          <Link href="/" className="btn-outline mt-4">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - MyTrip</title>
      </Head>

      <div className="min-h-screen bg-light">
        {/* Header */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <Link href="/" className="text-sm text-gray-600 hover:text-primary">
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Profile Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Profile Header */}
            <div className="flex items-center space-x-4 p-6 border-b">
              <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-xl">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role === 'ADMIN' ? 'Admin' : 'User'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setEditMode(false)}
                className={`flex-1 py-3 text-center font-medium ${editMode ? 'text-gray-500 border-b-2 border-gray-300' : 'text-primary border-b-2 border-primary'}`}
              >
                Profile Info
              </button>
              <button
                onClick={() => setEditMode(true)}
                className={`flex-1 py-3 text-center font-medium ${editMode ? 'text-primary border-b-2 border-primary' : 'text-gray-500 border-b-2 border-gray-300'}`}
              >
                Edit Profile
              </button>
            </div>

            {/* Profile Info View */}
            {!editMode && (
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                  <div className="space-y-2">
                    <p className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                        👤
                      </span>
                      <span>{user.firstName} {user.lastName}</span>
                    </p>
                    <p className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                        📧
                      </span>
                      <span>{user.email}</span>
                    </p>
                    <p className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                        📞
                      </span>
                      <span>{user.phone}</span>
                    </p>
                    <p className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                        🏠
                      </span>
                      <span>{user.address}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold mb-2">Account Information</h3>
                  <div className="space-y-2">
                    <p className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                        📅
                      </span>
                      <span>Member since: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </p>
                    <p className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                        🔐
                      </span>
                      <span>Account status: Active</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button onClick={() => setEditMode(true)} className="btn-primary px-6 py-3">
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {/* Edit Profile Form */}
            {editMode && (
              <form className="p-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="input w-full"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="btn-outline px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="btn-primary px-4 py-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}