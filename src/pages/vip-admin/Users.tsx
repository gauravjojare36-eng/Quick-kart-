import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { User as UserIcon, ShieldCheck, Crown, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function VipAdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(fetchedUsers);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]">Loading users...</div>;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/vip-admin')}
        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-bold transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to VIP Dashboard</span>
      </button>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">VIP Users Management</h1>
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <Crown className="w-3 h-3 mr-1" />
            Bulk Store
          </span>
        </div>
        <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-bold">
          Total Users: {users.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-purple-50 border-b border-purple-100">
              <th className="p-4 font-semibold text-purple-900">User</th>
              <th className="p-4 font-semibold text-purple-900">Email</th>
              <th className="p-4 font-semibold text-purple-900">Role</th>
              <th className="p-4 font-semibold text-purple-900">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="font-medium text-gray-900">{user.name}</span>
                </td>
                <td className="p-4 text-gray-600">{user.email}</td>
                <td className="p-4">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <UserIcon className="w-3 h-3 mr-1" />
                      User
                    </span>
                  )}
                </td>
                <td className="p-4 text-gray-500 text-sm">
                  {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
