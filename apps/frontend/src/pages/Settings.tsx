import { useState, useEffect } from 'react';
import { Save, RefreshCw, Key, Clock, Rss, Zap, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { useSettings, useSaveAllSettings } from '../hooks/useSettings';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ElementType;
}

const sections: SettingsSection[] = [
  { id: 'api', title: 'API Keys', icon: Key },
  { id: 'schedule', title: 'Schedule', icon: Clock },
  { id: 'feeds', title: 'RSS Feeds', icon: Rss },
  { id: 'automation', title: 'Automation', icon: Zap },
  { id: 'notifications', title: 'Notifications', icon: Bell },
];

// Default settings values
const defaultSettings: Record<string, string> = {
  twitter_bearer_token: '',
  linkedin_access_token: '',
  instagram_access_token: '',
  schedule_start_hour: '9',
  schedule_end_hour: '18',
  max_posts_per_day: '6',
  feed_fetch_interval: '30',
  max_items_per_feed: '10',
  auto_generate_content: 'true',
  auto_publish: 'true',
  require_approval: 'false',
  email_notifications: 'false',
  error_alerts: 'true',
};

export default function Settings() {
  const [activeSection, setActiveSection] = useState('api');
  const [localSettings, setLocalSettings] = useState<Record<string, string>>(defaultSettings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const saveSettings = useSaveAllSettings();

  // Load settings from API into local state
  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = { ...defaultSettings };
      settings.forEach((s) => {
        settingsMap[s.key] = s.value;
      });
      setLocalSettings(settingsMap);
    }
  }, [settings]);

  const updateLocalSetting = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    try {
      const settingsToSave = Object.entries(localSettings).map(([key, value]) => ({
        key,
        value,
      }));
      await saveSettings.mutateAsync(settingsToSave);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const renderApiSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
      <p className="text-sm text-gray-500">
        Configure your social media platform API credentials. These are stored securely.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Twitter API Bearer Token
          </label>
          <input
            type="password"
            value={localSettings.twitter_bearer_token}
            onChange={(e) => updateLocalSetting('twitter_bearer_token', e.target.value)}
            placeholder="Enter your Twitter Bearer Token"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn Access Token
          </label>
          <input
            type="password"
            value={localSettings.linkedin_access_token}
            onChange={(e) => updateLocalSetting('linkedin_access_token', e.target.value)}
            placeholder="Enter your LinkedIn Access Token"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderScheduleSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Posting Schedule</h3>
      <p className="text-sm text-gray-500">
        Define when posts should be automatically published.
      </p>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Hour
            </label>
            <select
              value={localSettings.schedule_start_hour}
              onChange={(e) => updateLocalSetting('schedule_start_hour', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Hour
            </label>
            <select
              value={localSettings.schedule_end_hour}
              onChange={(e) => updateLocalSetting('schedule_end_hour', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{i}:00</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Posts Per Day
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={localSettings.max_posts_per_day}
            onChange={(e) => updateLocalSetting('max_posts_per_day', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderFeedsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">RSS Feed Settings</h3>
      <p className="text-sm text-gray-500">
        Configure how RSS feeds are fetched and processed.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fetch Interval (minutes)
          </label>
          <input
            type="number"
            min="15"
            max="120"
            value={localSettings.feed_fetch_interval}
            onChange={(e) => updateLocalSetting('feed_fetch_interval', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Items Per Feed
          </label>
          <input
            type="number"
            min="5"
            max="50"
            value={localSettings.max_items_per_feed}
            onChange={(e) => updateLocalSetting('max_items_per_feed', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderToggle = (
    key: string,
    title: string,
    description: string
  ) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={localSettings[key] === 'true'}
          onChange={(e) => updateLocalSetting(key, e.target.checked ? 'true' : 'false')}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );

  const renderAutomationSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Automation Settings</h3>
      <p className="text-sm text-gray-500">
        Control how content is automatically generated and published.
      </p>
      <div className="space-y-4">
        {renderToggle('auto_generate_content', 'Auto-generate content', 'Automatically create posts from RSS feeds')}
        {renderToggle('auto_publish', 'Auto-publish', 'Automatically publish scheduled posts')}
        {renderToggle('require_approval', 'Require approval', 'Require manual approval before publishing')}
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
      <p className="text-sm text-gray-500">
        Configure how you receive notifications about your posts.
      </p>
      <div className="space-y-4">
        {renderToggle('email_notifications', 'Email notifications', 'Receive daily summary emails')}
        {renderToggle('error_alerts', 'Error alerts', 'Get notified when posts fail')}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'api':
        return renderApiSection();
      case 'schedule':
        return renderScheduleSection();
      case 'feeds':
        return renderFeedsSection();
      case 'automation':
        return renderAutomationSection();
      case 'notifications':
        return renderNotificationsSection();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Saved successfully
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              Error saving
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saveSettings.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saveSettings.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow overflow-hidden">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <section.icon className="w-5 h-5" />
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  );
}
