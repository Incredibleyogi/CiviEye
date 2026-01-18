import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, Check, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function AdminManagement() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Debug log
  console.log('[AdminManagement] Page loaded - isAdmin:', isAdmin, 'User:', user?.email, 'Role:', user?.role);

  // Redirect non-admins
  if (!isAdmin) {
    console.log('[AdminManagement] Access denied - not admin');
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Only admins can access this page</p>
        </div>
      </AppLayout>
    );
  }

  // Search users by email
  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setFilteredUsers([]);
      return;
    }

    setLoading(true);
    try {
      // This is a placeholder - you'll need to create a search endpoint
      // For now, we'll show a message
      console.log('[AdminManagement] Searching for user:', searchEmail);
      toast({
        title: 'Feature Coming Soon',
        description: 'User search endpoint will be available soon',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to search users',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const handleRoleUpdate = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      console.log('[AdminManagement] Updating user', userId, 'to role:', newRole);
      const res = await profileApi.updateUserRole(userId, newRole);

      if (res.success) {
        setFilteredUsers(prev =>
          prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
        );
        toast({
          title: 'Success',
          description: `User role updated to ${newRole}`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: res.error || 'Failed to update role',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update role',
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Management</h1>
          </div>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>

        {/* Search Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Search User</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter user email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Method 1: Via Database Script */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Method 1: MongoDB Script</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Run this in MongoDB Compass → go to your database → Open Shell → Paste & Run:
          </p>
          <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto border border-border">
            <div className="text-yellow-600">
              db.users.updateOne(
              <br />
              &nbsp;&nbsp;{'{'} email: "user@email.com" {'}'},
              <br />
              &nbsp;&nbsp;{'{'} $set: {'{'}role: "admin"{'}'} {'}'}
              <br />
              )
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Replace "user@email.com" with the actual email. Then refresh page.
          </p>
        </div>

        {/* Method 2: Via API (Search First) */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Method 2: Via Admin Panel</h2>
          <p className="text-sm text-muted-foreground mb-4">
            1. Search for user by email above
            <br />
            2. Click "Make Admin" button
            <br />
            3. User will see admin features after page refresh
          </p>
        </div>

        {/* Method 3: Node.js Script */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Method 3: Node.js Script</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Create a file `makeAdmin.js` in your Backend folder and run it:
          </p>
          <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto border border-border max-h-64 overflow-y-auto">
            <pre className="text-green-600">{`import mongoose from 'mongoose';
import User from './models/User.js';

mongoose.connect('mongodb+srv://...');

const makeAdmin = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found');
    return;
  }
  user.role = 'admin';
  await user.save();
  console.log(\`✓ \${email} is now admin\`);
  process.exit(0);
};

makeAdmin('user@email.com');`}</pre>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Run: <code className="bg-muted px-2 py-1">node makeAdmin.js</code>
          </p>
        </div>

        {/* Method 4: cURL Command */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Method 4: cURL Command</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Use this cURL command (replace YOUR_TOKEN and USER_ID):
          </p>
          <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto border border-border">
            <div className="text-blue-600 break-all">
              curl -X PATCH http://localhost:5000/api/auth/users/USER_ID/role \
              <br />
              -H "Authorization: Bearer YOUR_TOKEN" \
              <br />
              -H "Content-Type: application/json" \
              <br />
              -d '{'{'}role: "admin"{'}'}'
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Replace YOUR_TOKEN with your auth token and USER_ID with user's MongoDB ID
          </p>
        </div>

        {/* Users List */}
        {filteredUsers.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Search Results</h2>
            <div className="space-y-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        'User'
                      )}
                    </Badge>
                    {user.role !== 'admin' && (
                      <Button
                        size="sm"
                        onClick={() => handleRoleUpdate(user.id, 'admin')}
                        disabled={updating === user.id}
                        variant="outline"
                      >
                        {updating === user.id ? 'Updating...' : 'Make Admin'}
                      </Button>
                    )}
                    {user.role === 'admin' && (
                      <Button
                        size="sm"
                        onClick={() => handleRoleUpdate(user.id, 'user')}
                        disabled={updating === user.id}
                        variant="outline"
                      >
                        {updating === user.id ? 'Updating...' : 'Revoke Admin'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
