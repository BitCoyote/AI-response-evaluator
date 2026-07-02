import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../lib/api';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Moon, Sun, User } from 'lucide-react';

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await authApi.updateSettings({ full_name: fullName });
      updateUser(data);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input label="Email" value={user?.email || ''} disabled />
          <Input label="Username" value={user?.username || ''} disabled />
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500">Toggle between light and dark themes</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>API Configuration</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            API keys are configured on the server side via environment variables.
            Set <code className="text-primary-600">OPENAI_API_KEY</code>,{' '}
            <code className="text-primary-600">ANTHROPIC_API_KEY</code>, and{' '}
            <code className="text-primary-600">GOOGLE_API_KEY</code> in your backend .env file.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
