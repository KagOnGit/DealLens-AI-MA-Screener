import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getAlert, trackEvent } from '../../../lib/api';
import { Alert } from '../../../types';

interface AlertDetailPageProps {
  params: {
    id: string;
  };
}

function getSeverityIcon(severity: Alert['severity']) {
  switch (severity) {
    case 'critical':
      return <XMarkIcon className="h-6 w-6 text-red-500" />;
    case 'high':
      return <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />;
    case 'medium':
      return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    case 'low':
    default:
      return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
  }
}

function getSeverityColor(severity: Alert['severity']) {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800';
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800';
    case 'low':
    default:
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800';
  }
}

export default async function AlertDetailPage({ params }: AlertDetailPageProps) {
  let alert: Alert;

  try {
    alert = await getAlert(params.id);
  } catch (error) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/alerts"
            className="inline-flex items-center text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Alerts
          </Link>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Alert Details</h1>
          </div>
        </div>

        {/* Alert Card */}
        <div className="bg-[hsl(var(--card-background))] border border-[hsl(var(--border))] rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              {getSeverityIcon(alert.severity)}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Title and Metadata */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-[hsl(var(--card-foreground))] mb-2">
                  {alert.title}
                </h2>
                
                <div className="flex items-center space-x-4 text-sm text-[hsl(var(--muted-foreground))]">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  
                  {alert.ticker && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[hsl(var(--primary-100))] text-[hsl(var(--primary-800))] border border-[hsl(var(--primary-200))] dark:bg-[hsl(var(--primary-800))] dark:text-[hsl(var(--primary-100))] dark:border-[hsl(var(--primary-700))]">
                      {alert.ticker}
                    </span>
                  )}
                  
                  <span>
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Alert Body */}
              <div className="prose prose-sm max-w-none text-[hsl(var(--card-foreground))]">
                <div className="whitespace-pre-wrap">{alert.body}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
