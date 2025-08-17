'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Clock, Globe, Server, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown'
  timestamp?: string
  error?: string
  responseTime?: number
}

interface APIStatus {
  readyz: HealthStatus
  healthz: HealthStatus
}

export default function StatusPage() {
  const [apiStatus, setApiStatus] = useState<APIStatus>({
    readyz: { status: 'unknown' },
    healthz: { status: 'unknown' }
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Environment info
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const environment = process.env.NODE_ENV || 'development'
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()
  
  const checkEndpoint = async (endpoint: string): Promise<HealthStatus> => {
    const startTime = Date.now()
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          responseTime
        }
      } else {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: `HTTP ${response.status}: ${response.statusText}`,
          responseTime
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      }
    }
  }
  
  const refreshStatus = async () => {
    setIsRefreshing(true)
    try {
      const [readyzResult, healthzResult] = await Promise.all([
        checkEndpoint('/readyz'),
        checkEndpoint('/healthz')
      ])
      
      setApiStatus({
        readyz: readyzResult,
        healthz: healthzResult
      })
    } finally {
      setIsRefreshing(false)
    }
  }
  
  // Initial load and periodic refresh
  useEffect(() => {
    refreshStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(refreshStatus, 30000)
    return () => clearInterval(interval)
  }, [])
  
  const getStatusBadge = (health: HealthStatus) => {
    switch (health.status) {
      case 'healthy':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-4 h-4 mr-1" />
            Healthy
          </Badge>
        )
      case 'unhealthy':
        return (
          <Badge variant="destructive">
            <XCircle className="w-4 h-4 mr-1" />
            Unhealthy
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-4 h-4 mr-1" />
            Checking...
          </Badge>
        )
    }
  }
  
  const getOverallStatus = () => {
    if (apiStatus.readyz.status === 'healthy' && apiStatus.healthz.status === 'healthy') {
      return 'healthy'
    }
    if (apiStatus.readyz.status === 'unhealthy' || apiStatus.healthz.status === 'unhealthy') {
      return 'unhealthy'
    }
    return 'unknown'
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">DealLens System Status</h1>
          <p className="text-gray-600">Real-time health monitoring and system information</p>
        </div>
        
        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overall System Status</span>
              <div className="flex items-center gap-2">
                {getOverallStatus() === 'healthy' && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    All Systems Operational
                  </Badge>
                )}
                {getOverallStatus() === 'unhealthy' && (
                  <Badge variant="destructive">
                    <XCircle className="w-4 h-4 mr-1" />
                    System Issues Detected
                  </Badge>
                )}
                {getOverallStatus() === 'unknown' && (
                  <Badge variant="secondary">
                    <Clock className="w-4 h-4 mr-1" />
                    Checking Status...
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </Card>
        
        {/* API Health Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Server className="w-5 h-5 mr-2" />
                API Health Checks
              </span>
              <Button
                onClick={refreshStatus}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Readiness Check */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Readiness Check</div>
                  <div className="text-sm text-gray-600">
                    <code>{apiUrl}/readyz</code>
                  </div>
                  {apiStatus.readyz.error && (
                    <div className="text-sm text-red-600 mt-1">
                      {apiStatus.readyz.error}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {getStatusBadge(apiStatus.readyz)}
                  {apiStatus.readyz.responseTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      {apiStatus.readyz.responseTime}ms
                    </div>
                  )}
                </div>
              </div>
              
              {/* Health Check */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Health Check</div>
                  <div className="text-sm text-gray-600">
                    <code>{apiUrl}/healthz</code>
                  </div>
                  {apiStatus.healthz.error && (
                    <div className="text-sm text-red-600 mt-1">
                      {apiStatus.healthz.error}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {getStatusBadge(apiStatus.healthz)}
                  {apiStatus.healthz.responseTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      {apiStatus.healthz.responseTime}ms
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-sm">Environment</div>
                  <div className="text-lg">
                    <Badge variant={environment === 'production' ? 'default' : 'secondary'}>
                      {environment}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-sm">API URL</div>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {apiUrl}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-sm">Using Mocks</div>
                  <div className="text-lg">
                    <Badge variant={useMocks ? 'secondary' : 'default'}>
                      {useMocks ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-sm">Build Time</div>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {new Date(buildTime).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-sm">Last Updated</div>
                  <div className="text-sm text-gray-600">
                    {apiStatus.readyz.timestamp 
                      ? new Date(apiStatus.readyz.timestamp).toLocaleString()
                      : 'Never'
                    }
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-sm">Next Refresh</div>
                  <div className="text-sm text-gray-600">
                    Auto-refresh every 30 seconds
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/">
                  Go to Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href={`${apiUrl}/docs`} target="_blank" rel="noopener noreferrer">
                  API Documentation
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`${apiUrl}/readyz`} target="_blank" rel="noopener noreferrer">
                  Raw Readiness Check
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`${apiUrl}/healthz`} target="_blank" rel="noopener noreferrer">
                  Raw Health Check
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
