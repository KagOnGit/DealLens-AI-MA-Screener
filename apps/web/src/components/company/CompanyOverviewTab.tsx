import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyDetail } from '@/types';
import { Shield, AlertTriangle, Building2, Users, Calendar, Globe, TrendingUp, Target } from 'lucide-react';

interface CompanyOverviewTabProps {
  company: CompanyDetail;
}

export function CompanyOverviewTab({ company }: CompanyOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Business Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed mb-4">
            {company.business_summary || company.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Industry</p>
              <p className="font-medium">{company.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Founded</p>
              <p className="font-medium">{company.founded}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="font-medium">{company.employees?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Headquarters</p>
              <p className="font-medium">{company.headquarters}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Market Capitalization</span>
              <span className="font-semibold">
                {company.market_cap >= 1000000 
                  ? `$${(company.market_cap / 1000000).toFixed(1)}T`
                  : company.market_cap >= 1000
                  ? `$${(company.market_cap / 1000).toFixed(1)}B`
                  : `$${company.market_cap.toFixed(0)}M`
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price-to-Earnings Ratio</span>
              <span className="font-semibold">{company.pe_ratio?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">EV/EBITDA</span>
              <span className="font-semibold">{company.ev_ebitda?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Annual Revenue</span>
              <span className="font-semibold">
                {company.revenue >= 1000000 
                  ? `$${(company.revenue / 1000000).toFixed(1)}T`
                  : company.revenue >= 1000
                  ? `$${(company.revenue / 1000).toFixed(1)}B`
                  : `$${company.revenue.toFixed(0)}M`
                }
              </span>
            </div>
            {company.beta && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Beta</span>
                <span className="font-semibold">{company.beta.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competitive Moats */}
      {company.competitive_moats && company.competitive_moats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Competitive Advantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {company.competitive_moats.map((moat, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-700">{moat}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Risks */}
      {company.key_risks && company.key_risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Key Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {company.key_risks.map((risk, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-700">{risk}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
