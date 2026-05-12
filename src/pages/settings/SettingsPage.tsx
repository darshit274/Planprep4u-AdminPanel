import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Shield, 
  Mail, 
  Bell, 
  Globe, 
  Database,
  Key,
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface AdminSettings {
  // Profile Settings
  name: string;
  email: string;
  avatar?: string;
  
  // Security Settings
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  
  // Notification Settings
  emailNotifications: boolean;
  browserNotifications: boolean;
  weeklyReports: boolean;
  
  // System Settings
  timezone: string;
  language: string;
  dateFormat: string;
  
  // Application Settings
  defaultPageSize: number;
  autoLogoutTime: number;
  themeMode: 'light' | 'dark' | 'system';
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Public-facing platform settings (intro video URL + Telegram channel URL).
  // Stored in the platform_settings table on the backend; fetched once on mount
  // and saved per-key when the admin clicks Save next to each input.
  const [platformSettings, setPlatformSettings] = useState<{
    signup_intro_video_url: string;
    telegram_channel_url: string;
  }>({ signup_intro_video_url: '', telegram_channel_url: '' });
  const [platformLoading, setPlatformLoading] = useState<{ [k: string]: boolean }>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/settings/admin');
        if (!cancelled && res.data?.success) {
          setPlatformSettings({
            signup_intro_video_url: res.data.data.signup_intro_video_url || '',
            telegram_channel_url: res.data.data.telegram_channel_url || '',
          });
        }
      } catch (err) {
        // Surface a soft error; admins can still navigate the rest of the page.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const savePlatformSetting = async (key: 'signup_intro_video_url' | 'telegram_channel_url') => {
    setPlatformLoading((p) => ({ ...p, [key]: true }));
    try {
      await api.put(`/settings/admin/${key}`, { value: platformSettings[key] || null });
      toast.success('Saved');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save setting');
    } finally {
      setPlatformLoading((p) => ({ ...p, [key]: false }));
    }
  };

  // Upload a video file as the intro video. On success the backend persists the
  // file under /uploads/intro_videos/ AND writes the public URL into the
  // signup_intro_video_url setting, so we mirror that into local state.
  const uploadIntroVideo = async (file: File) => {
    setPlatformLoading((p) => ({ ...p, intro_video_upload: true }));
    try {
      const fd = new FormData();
      fd.append('video', file);
      const res = await api.post('/settings/admin/upload-intro-video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        setPlatformSettings((p) => ({ ...p, signup_intro_video_url: url }));
        toast.success('Intro video uploaded and activated');
      } else {
        toast.error('Upload returned no URL');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setPlatformLoading((p) => ({ ...p, intro_video_upload: false }));
    }
  };

  const [settings, setSettings] = useState<AdminSettings>({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    emailNotifications: true,
    browserNotifications: true,
    weeklyReports: true,
    timezone: 'Asia/Kolkata',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    defaultPageSize: 10,
    autoLogoutTime: 480, // 8 hours in minutes
    themeMode: 'light'
  });

  const [originalSettings, setOriginalSettings] = useState<AdminSettings>(settings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data.success) {
        const loadedSettings = { ...settings, ...response.data.data };
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  };

  const handleSave = async (section?: string) => {
    setLoading(true);
    try {
      const endpoint = section ? `/admin/settings/${section}` : '/admin/settings';
      const response = await api.put(endpoint, settings);
      
      if (response.data.success) {
        toast.success(`${section ? section.charAt(0).toUpperCase() + section.slice(1) : 'Settings'} updated successfully`);
        setOriginalSettings(settings);
        
        // Clear passwords after successful update
        if (section === 'security') {
          setSettings(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        }
      }
    } catch (error: any) {
      console.error('Settings update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/gif';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (1MB)
      if (file.size > 1024 * 1024) {
        toast.error('File size must be less than 1MB');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error('Only JPG, PNG, and GIF files are allowed');
        return;
      }

      setAvatarUploading(true);
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await api.post('/admin/settings/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success) {
          setSettings(prev => ({ ...prev, avatar: response.data.data.avatar_url }));
          toast.success('Avatar updated successfully');
        }
      } catch (error: any) {
        console.error('Avatar upload error:', error);
        toast.error(error.response?.data?.message || 'Failed to upload avatar');
      } finally {
        setAvatarUploading(false);
      }
    };
    input.click();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'system', label: 'System', icon: Database },
    { id: 'platform', label: 'Platform', icon: Globe }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-6">
        <div className="flex-shrink-0">
          {settings.avatar ? (
            <img 
              src={settings.avatar} 
              alt="Avatar" 
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <button 
            onClick={handleAvatarUpload}
            disabled={avatarUploading}
            className="btn-secondary text-sm"
          >
            {avatarUploading ? 'Uploading...' : 'Change Avatar'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            JPG, GIF or PNG. 1MB max size.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
            className="input-field"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('profile')}
          disabled={loading || !hasChanges()}
          className="btn-primary inline-flex items-center"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Profile
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={settings.currentPassword}
                onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.current ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={settings.newPassword}
                onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={settings.confirmPassword}
                onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.twoFactorEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('security')}
          disabled={loading}
          className="btn-primary inline-flex items-center"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Key className="h-4 w-4 mr-2" />
          )}
          Update Security
        </button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Browser Notifications</h4>
            <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.browserNotifications}
              onChange={(e) => setSettings(prev => ({ ...prev, browserNotifications: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Weekly Reports</h4>
            <p className="text-sm text-gray-500">Receive weekly analytics reports</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.weeklyReports}
              onChange={(e) => setSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('notifications')}
          disabled={loading}
          className="btn-primary inline-flex items-center"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bell className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
            className="input-field"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
            className="input-field"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="gu">Gujarati</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
            className="input-field"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Page Size
          </label>
          <select
            value={settings.defaultPageSize}
            onChange={(e) => setSettings(prev => ({ ...prev, defaultPageSize: parseInt(e.target.value) }))}
            className="input-field"
          >
            <option value={10}>10 items</option>
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
            <option value={100}>100 items</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('preferences')}
          disabled={loading}
          className="btn-primary inline-flex items-center"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Globe className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Settings className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              System Settings
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              These settings affect the entire application. Please use caution when making changes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto Logout Time (minutes)
          </label>
          <input
            type="number"
            value={settings.autoLogoutTime}
            onChange={(e) => setSettings(prev => ({ ...prev, autoLogoutTime: parseInt(e.target.value) || 480 }))}
            className="input-field"
            min="30"
            max="1440"
          />
          <p className="text-xs text-gray-500 mt-1">
            Time in minutes before automatic logout (30-1440)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme Mode
          </label>
          <select
            value={settings.themeMode}
            onChange={(e) => setSettings(prev => ({ ...prev, themeMode: e.target.value as 'light' | 'dark' | 'system' }))}
            className="input-field"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => handleSave('system')}
          disabled={loading}
          className="btn-primary inline-flex items-center"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Save System Settings
        </button>
      </div>
    </div>
  );

  const renderPlatformTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Platform Settings</h3>
        <p className="text-sm text-gray-500 mt-1">
          Public-facing values. The student web app reads these from the public settings endpoint.
        </p>
      </div>

      {/* Intro video */}
      <div className="border rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Signup intro video</label>
          <p className="text-xs text-gray-500">
            Shown as a popup the first time a user visits the signup page. Either upload a video file
            (MP4 / WebM / MOV, max 50 MB) <em>or</em> paste an external URL (YouTube, Vimeo, etc.).
            Leave the URL blank to disable the popup.
          </p>
        </div>

        {/* File upload */}
        <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
          <label className="block text-xs font-semibold text-gray-700 mb-2">Upload video file</label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="file"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v"
              disabled={platformLoading.intro_video_upload}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ''; // allow re-uploading the same filename
                if (file) uploadIntroVideo(file);
              }}
              className="flex-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700 file:font-medium"
            />
            {platformLoading.intro_video_upload && (
              <span className="inline-flex items-center text-xs text-gray-600">
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                Uploading…
              </span>
            )}
          </div>
          {platformSettings.signup_intro_video_url && (
            <p className="text-[11px] text-gray-500 mt-2 break-all">
              Current: <a href={platformSettings.signup_intro_video_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">{platformSettings.signup_intro_video_url}</a>
            </p>
          )}
        </div>

        {/* Manual URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Or paste a video URL</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={platformSettings.signup_intro_video_url}
            onChange={(e) =>
              setPlatformSettings((p) => ({ ...p, signup_intro_video_url: e.target.value }))
            }
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => savePlatformSetting('signup_intro_video_url')}
            disabled={platformLoading.signup_intro_video_url}
            className="btn-primary inline-flex items-center justify-center"
          >
            {platformLoading.signup_intro_video_url ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </button>
        </div>
        </div>{/* /Or paste a video URL */}
      </div>

      {/* Telegram URL */}
      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Telegram channel URL</label>
        <p className="text-xs text-gray-500 mb-3">
          Shown as a Telegram link in the website footer. Leave blank to hide the link.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={platformSettings.telegram_channel_url}
            onChange={(e) =>
              setPlatformSettings((p) => ({ ...p, telegram_channel_url: e.target.value }))
            }
            placeholder="https://t.me/planprep4u"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => savePlatformSetting('telegram_channel_url')}
            disabled={platformLoading.telegram_channel_url}
            className="btn-primary inline-flex items-center justify-center"
          >
            {platformLoading.telegram_channel_url ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'security':
        return renderSecurityTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'system':
        return renderSystemTab();
      case 'platform':
        return renderPlatformTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        {hasChanges() && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-amber-600">You have unsaved changes</span>
            <button
              onClick={() => handleSave()}
              disabled={loading}
              className="btn-primary inline-flex items-center"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save All
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};