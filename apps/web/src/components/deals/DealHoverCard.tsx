'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Deal } from '@/types';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Building2, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';

interface DealHoverCardProps {
  deal: Deal;
  children: React.ReactNode;
}

export function DealHoverCard({ deal, children }: DealHoverCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}T`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
    return `$${value.toFixed(0)}M`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'announced': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">
          {children}
        </div>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-96 p-0" side="right" align="start">
        <Card className="shadow-lg border-2">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg leading-tight">
                    {deal.acquirer} acquires {deal.target}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(deal.status)}>
                      {deal.status}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(deal.announced_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Deal Value</p>
                    <p className="font-semibold">{formatCurrency(deal.value)}</p>
                  </div>
                </div>
                
                {deal.premium && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Premium</p>
                      <p className="font-semibold">{deal.premium.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sectors */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    {deal.sector}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {deal.description && (
                <p className="text-sm text-gray-700 line-clamp-3">
                  {deal.description}
                </p>
              )}

              {/* Action */}
              <div className="pt-2 border-t">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/deals/${deal.id}`} className="flex items-center gap-2">
                    View Full Details
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </HoverCardContent>
    </HoverCard>
  );
}
