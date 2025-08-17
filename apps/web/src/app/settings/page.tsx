'use client'

import { useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useDebounce } from '@/hooks/useDebounce'
import { useApiStatusStore } from '@/lib/api-status-store'
import { apiClient } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Clock,
  Key,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  HardDrive,
  Wifi
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { usingMocks, setUsingMocks } = useApiStatusStore();

// User Profile Settings
  const [userName, setUserName] = useState('Jane Doe')
  const [userEmail, setUserEmail] = useState('jane.doe@deallens.ai')
  const [userRole, setUserRole] = useState('Senior Analyst')
  
  // Create debounced setters for text inputs
  const debouncedSetUserName = useDebounce(setUserName, 500)
  const debouncedSetUserEmail = useDebounce(setUserEmail, 500)
  const debouncedSetUserRole = useDebounce(setUserRole, 500)

  // Display Settings
  const [theme, setTheme] = useState('dark')
  const [refreshInterval, setRefreshInterval] = useState('30')
  const [timezone, setTimezone] = useState('UTC')
  const [compactMode, setCompactMode] = useState(false)
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [dealAlerts, setDealAlerts] = useState(true)
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [earningsAlerts, setEarningsAlerts] = useState(false)
  const [systemAlerts, setSystemAlerts] = useState(true)

// API Settings
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [dataProvider, setDataProvider] = useState('bloomberg')
  const [autoSync, setAutoSync] = useState(true)
  
  // Create debounced setter for API key
  const debouncedSetApiKey = useDebounce(setApiKey, 500)

  // Security Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('24')
  const [loginNotifications, setLoginNotifications] = useState(true)

  // Data & Privacy
  const [dataRetention, setDataRetention] = useState('12')
  const [shareAnalytics, setShareAnalytics] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')

  // Toast notifications
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleMockToggle = async (enabled: boolean) => {
    try {
      // Update the store immediately for UI responsiveness
      setUsingMocks(enabled);
      
      // Clear React Query caches to force fresh data
      await queryClient.invalidateQueries();
      
      // Clear localStorage banner dismiss state when switching modes
      localStorage.removeItem('deallens-mock-banner-dismissed');
      
      // Run a health check if switching to real API mode
      if (!enabled) {
        try {
          await apiClient.healthCheck();
          toast.success('Switched to live API data');
        } catch (error) {
          toast.error('Failed to connect to live API, falling back to degraded mode');
        }
      } else {
        toast.success('Switched to demo data mode');
      }
    } catch (error) {
      console.error('Error toggling mock mode:', error);
      toast.error('Failed to switch data mode');
      // Revert the change if there was an error
      setUsingMocks(!enabled);
    }
  };

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    
    try {
      // Simulate save operation with potential error
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.1) { // 90% success rate
            resolve(true)
          } else {
            reject(new Error('Failed to save settings'))
          }
        }, 1000)
      })
      
      setShowSaveToast(true)
      setTimeout(() => setShowSaveToast(false), 3000)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'An error occurred')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const SettingSection = ({ title, icon: Icon, children }: { 
    title: string, 
    icon: any, 
    children: React.ReactNode 
  }) => (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon className="h-5 w-5 text-terminal-primary" />
        <h2 className="text-lg font-mono text-terminal-primary">{title}</h2>
      </div>
      {children}
    </div>
  )

type InputValue = string | number | boolean;

  const InputField = <T extends InputValue>({ 
    label, 
    value, 
    onChange, 
    type = 'text', 
    placeholder = '' 
  }: {
    label: string,
    value: T,
    onChange: (value: T) => void,
    type?: string,
    placeholder?: string
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        
        // Convert the value to the appropriate type
        let typedValue: T;
        if (typeof value === 'number') {
          typedValue = Number(newValue) as T;
        } else if (typeof value === 'boolean') {
          typedValue = (newValue === 'true') as unknown as T;
        } else {
          typedValue = newValue as T;
        }
        
        onChange(typedValue);
      },
      [onChange, value]
    );
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-mono text-gray-300">{label}</label>
        <input
          type={type}
          value={String(value)}
          onChange={handleChange}
          onBlur={() => {}} // Prevent submit on blur
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary focus:border-terminal-primary font-mono"
        />
      </div>
    );
  }

const SelectField = <T extends string | number>({ 
    label, 
    value, 
    onChange, 
    options 
  }: {
    label: string,
    value: T,
    onChange: (value: T) => void,
    options: { value: T, label: string }[]
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        
        // Convert the value to the appropriate type
        let typedValue: T;
        if (typeof value === 'number') {
          typedValue = Number(newValue) as T;
        } else {
          typedValue = newValue as T;
        }
        
        onChange(typedValue);
      },
      [onChange, value]
    );
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-mono text-gray-300">{label}</label>
        <select
          value={String(value)}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary font-mono"
        >
          {options.map(option => (
            <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
          ))}
        </select>
      </div>
    );
  }

const ToggleField = ({ 
    label, 
    value, 
    onChange, 
    description 
  }: {
    label: string,
    value: boolean,
    onChange: (value: boolean) => void,
    description?: string
  }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked);
      },
      [onChange]
    );
    
    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-sm font-mono text-white">{label}</div>
          {description && (
            <div className="text-xs text-gray-400 mt-1">{description}</div>
          )}
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={handleChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-terminal-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terminal-primary"></div>
        </label>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-terminal-primary font-mono">SETTINGS</h1>
            <p className="text-gray-400 text-sm mt-1">Configure your DealLens experience</p>
          </div>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2 bg-terminal-primary text-black rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
          </button>
        </div>

        {/* Save Toast */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {showSaveToast && "Settings saved successfully"}
          {saveError && `Error: ${saveError}`}
        </div>
        
        {showSaveToast && (
          <div className="fixed top-4 right-4 bg-terminal-green text-black px-4 py-2 rounded-lg font-mono text-sm flex items-center space-x-2 z-50">
            <Check className="h-4 w-4" />
            <span>Settings saved successfully</span>
          </div>
        )}
        
        {saveError && (
          <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-mono text-sm flex items-center space-x-2 z-50">
            <X className="h-4 w-4" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile */}
          <SettingSection title="USER PROFILE" icon={User}>
            <div className="space-y-4">
              <InputField
                label="Full Name"
                value={userName}
                onChange={debouncedSetUserName}
              />
              <InputField
                label="Email Address"
                value={userEmail}
                onChange={debouncedSetUserEmail}
                type="email"
              />
              <InputField
                label="Role"
                value={userRole}
                onChange={debouncedSetUserRole}
              />
            </div>
          </SettingSection>

          {/* Display Settings */}
          <SettingSection title="DISPLAY" icon={Palette}>
            <div className="space-y-4">
              <SelectField
                label="Theme"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'dark', label: '🌙 Dark' },
                  { value: 'light', label: '☀️ Light' },
                  { value: 'auto', label: '💻 System' }
                ]}
              />
              <SelectField
                label="Refresh Interval"
                value={refreshInterval}
                onChange={setRefreshInterval}
                options={[
                  { value: '10', label: '10 seconds' },
                  { value: '30', label: '30 seconds' },
                  { value: '60', label: '1 minute' },
                  { value: '300', label: '5 minutes' },
                  { value: '0', label: 'Manual' }
                ]}
              />
              <SelectField
                label="Timezone"
                value={timezone}
                onChange={setTimezone}
                options={[
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'Eastern (ET)' },
                  { value: 'America/Chicago', label: 'Central (CT)' },
                  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
                  { value: 'Europe/London', label: 'London (GMT)' }
                ]}
              />
              <ToggleField
                label="Compact Mode"
                value={compactMode}
                onChange={setCompactMode}
                description="Reduce spacing and padding for more data density"
              />
            </div>
          </SettingSection>

          {/* Notifications */}
          <SettingSection title="NOTIFICATIONS" icon={Bell}>
            <div className="space-y-3">
              <ToggleField
                label="Email Notifications"
                value={emailNotifications}
                onChange={setEmailNotifications}
                description="Receive alerts via email"
              />
              <ToggleField
                label="Push Notifications"
                value={pushNotifications}
                onChange={setPushNotifications}
                description="Browser push notifications"
              />
              <div className="border-t border-terminal-border pt-3 mt-4">
                <div className="text-xs text-gray-400 uppercase font-mono mb-3">Alert Types</div>
                <ToggleField
                  label="M&A Deal Alerts"
                  value={dealAlerts}
                  onChange={setDealAlerts}
                />
                <ToggleField
                  label="Price Movement Alerts"
                  value={priceAlerts}
                  onChange={setPriceAlerts}
                />
                <ToggleField
                  label="Earnings Alerts"
                  value={earningsAlerts}
                  onChange={setEarningsAlerts}
                />
                <ToggleField
                  label="System Notifications"
                  value={systemAlerts}
                  onChange={setSystemAlerts}
                />
              </div>
            </div>
          </SettingSection>

          {/* API & Data */}
          <SettingSection title="API & DATA" icon={Database}>
            <div className="space-y-4">
              <ToggleField
                label="Use Demo Data (Mocks)"
                value={usingMocks}
                onChange={handleMockToggle}
                description="Switch between live API data and demo data for development"
              />
              
              {usingMocks && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-400 text-sm">
                    <HardDrive className="h-4 w-4" />
                    <span className="font-mono">Demo Mode Active</span>
                  </div>
                  <p className="text-xs text-blue-300 mt-1">
                    Using mock data for demonstration. Toggle off to use live API endpoints.
                  </p>
                </div>
              )}
              
              {!usingMocks && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-400 text-sm">
                    <Wifi className="h-4 w-4" />
                    <span className="font-mono">Live API Mode Active</span>
                  </div>
                  <p className="text-xs text-green-300 mt-1">
                    Connected to real API endpoints. Data is live and up-to-date.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-mono text-gray-300">API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onBlur={(e) => debouncedSetApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                    disabled={usingMocks}
                    className={`w-full px-4 py-2 pr-12 bg-black border border-terminal-border rounded text-white focus:outline-none focus:ring-2 focus:ring-terminal-primary focus:border-terminal-primary font-mono ${
                      usingMocks ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    disabled={usingMocks}
                    className={`absolute right-3 top-2.5 text-gray-400 hover:text-white ${
                      usingMocks ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <SelectField
                label="Data Provider"
                value={dataProvider}
                onChange={setDataProvider}
                options={[
                  { value: 'bloomberg', label: 'Bloomberg Terminal' },
                  { value: 'refinitiv', label: 'Refinitiv Eikon' },
                  { value: 'factset', label: 'FactSet' },
                  { value: 'custom', label: 'Custom API' }
                ]}
              />
              <ToggleField
                label="Auto Sync"
                value={autoSync}
                onChange={setAutoSync}
                description="Automatically sync data from external sources"
              />
            </div>
          </SettingSection>

          {/* Security */}
          <SettingSection title="SECURITY" icon={Shield}>
            <div className="space-y-3">
              <ToggleField
                label="Two-Factor Authentication"
                value={twoFactorEnabled}
                onChange={setTwoFactorEnabled}
                description="Add extra security with 2FA"
              />
              <SelectField
                label="Session Timeout"
                value={sessionTimeout}
                onChange={setSessionTimeout}
                options={[
                  { value: '1', label: '1 hour' },
                  { value: '8', label: '8 hours' },
                  { value: '24', label: '24 hours' },
                  { value: '168', label: '1 week' },
                  { value: '0', label: 'Never' }
                ]}
              />
              <ToggleField
                label="Login Notifications"
                value={loginNotifications}
                onChange={setLoginNotifications}
                description="Get notified of new login attempts"
              />
            </div>
          </SettingSection>

          {/* Data & Privacy */}
          <SettingSection title="DATA & PRIVACY" icon={AlertTriangle}>
            <div className="space-y-4">
              <SelectField
                label="Data Retention"
                value={dataRetention}
                onChange={setDataRetention}
                options={[
                  { value: '1', label: '1 month' },
                  { value: '3', label: '3 months' },
                  { value: '6', label: '6 months' },
                  { value: '12', label: '1 year' },
                  { value: '0', label: 'Indefinite' }
                ]}
              />
              <SelectField
                label="Export Format"
                value={exportFormat}
                onChange={setExportFormat}
                options={[
                  { value: 'csv', label: 'CSV' },
                  { value: 'excel', label: 'Excel (.xlsx)' },
                  { value: 'json', label: 'JSON' },
                  { value: 'pdf', label: 'PDF Report' }
                ]}
              />
              <ToggleField
                label="Share Analytics"
                value={shareAnalytics}
                onChange={setShareAnalytics}
                description="Help improve DealLens by sharing anonymous usage data"
              />
            </div>
          </SettingSection>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-mono text-red-400">DANGER ZONE</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-mono">Clear All Data</div>
                <div className="text-gray-400 text-sm">Remove all stored alerts, preferences, and cached data</div>
              </div>
              <button 
                type="button"
                onClick={() => confirm('Are you sure you want to clear all data? This action cannot be undone.')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-mono text-sm"
              >
                CLEAR DATA
              </button>
            </div>
            <div className="border-t border-red-500/30 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-mono">Delete Account</div>
                  <div className="text-gray-400 text-sm">Permanently delete your account and all associated data</div>
                </div>
                <button 
                  type="button"
                  onClick={() => confirm('Are you sure you want to delete your account? This action cannot be undone.')}
                  className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors font-mono text-sm"
                >
                  DELETE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
