'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calculator, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DCFInputs {
  ticker?: string;
  revenue_base: number;
  revenue_growth: number[];
  ebitda_margin: number[];
  tax_rate: number;
  capex_pct_revenue: number[];
  nwc_pct_revenue: number;
  wacc: number;
  ltg: number;
  years: number;
}

interface DCFResults {
  inputs: DCFInputs;
  projections: {
    revenues: number[];
    ebitdas: number[];
    free_cash_flows: number[];
  };
  valuation: {
    pv_of_fcfs: number;
    pv_of_terminal: number;
    enterprise_value: number;
    terminal_value: number;
  };
  sensitivity: {
    wacc_range: number[];
    ltg_range: number[];
    ev_grid: number[][];
  };
}

async function calculateDCF(inputs: DCFInputs): Promise<DCFResults> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/valuation/dcf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inputs),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate DCF');
  }

  return response.json();
}

export default function DCFPage() {
  const [inputs, setInputs] = useState<DCFInputs>({
    revenue_base: 1000,
    revenue_growth: [0.15, 0.12, 0.10, 0.08, 0.05],
    ebitda_margin: [0.25, 0.26, 0.27, 0.27, 0.28],
    tax_rate: 0.25,
    capex_pct_revenue: [0.08, 0.07, 0.06, 0.06, 0.05],
    nwc_pct_revenue: 0.05,
    wacc: 0.10,
    ltg: 0.025,
    years: 5,
  });

  const dcfMutation = useMutation({
    mutationFn: calculateDCF,
    onError: (error) => {
      toast.error(`DCF calculation failed: ${error.message}`);
    },
    onSuccess: () => {
      toast.success('DCF calculation completed');
    },
  });

  const handleInputChange = (field: keyof DCFInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field: keyof DCFInputs, index: number, value: number) => {
    setInputs(prev => {
      const array = [...(prev[field] as number[])];
      array[index] = value;
      return { ...prev, [field]: array };
    });
  };

  const handleCalculate = () => {
    dcfMutation.mutate(inputs);
  };

  const results = dcfMutation.data;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DCF Valuation Model</h1>
            <p className="text-muted-foreground">
              Build discounted cash flow models with sensitivity analysis
            </p>
          </div>
          <Button onClick={handleCalculate} disabled={dcfMutation.isPending}>
            {dcfMutation.isPending ? (
              <LoadingSpinner className="w-4 h-4 mr-2" />
            ) : (
              <Calculator className="w-4 h-4 mr-2" />
            )}
            Calculate DCF
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Model Inputs</CardTitle>
              <CardDescription>
                Configure your DCF assumptions and parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="revenue_base">Base Revenue ($ millions)</Label>
                <Input
                  id="revenue_base"
                  type="number"
                  value={inputs.revenue_base}
                  onChange={(e) => handleInputChange('revenue_base', Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label>Revenue Growth Rates (%)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {inputs.revenue_growth.map((rate, index) => (
                    <Input
                      key={index}
                      type="number"
                      step="0.01"
                      value={(rate * 100).toFixed(1)}
                      onChange={(e) => handleArrayInputChange('revenue_growth', index, Number(e.target.value) / 100)}
                      placeholder={`Y${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>EBITDA Margins (%)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {inputs.ebitda_margin.map((margin, index) => (
                    <Input
                      key={index}
                      type="number"
                      step="0.01"
                      value={(margin * 100).toFixed(1)}
                      onChange={(e) => handleArrayInputChange('ebitda_margin', index, Number(e.target.value) / 100)}
                      placeholder={`Y${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wacc">WACC (%)</Label>
                  <Input
                    id="wacc"
                    type="number"
                    step="0.001"
                    value={(inputs.wacc * 100).toFixed(1)}
                    onChange={(e) => handleInputChange('wacc', Number(e.target.value) / 100)}
                  />
                </div>
                <div>
                  <Label htmlFor="ltg">Long-term Growth (%)</Label>
                  <Input
                    id="ltg"
                    type="number"
                    step="0.001"
                    value={(inputs.ltg * 100).toFixed(1)}
                    onChange={(e) => handleInputChange('ltg', Number(e.target.value) / 100)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={(inputs.tax_rate * 100).toFixed(0)}
                  onChange={(e) => handleInputChange('tax_rate', Number(e.target.value) / 100)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Valuation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">${results.valuation.enterprise_value.toFixed(0)}M</div>
                    <div className="text-sm text-muted-foreground">Enterprise Value</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">${results.valuation.pv_of_fcfs.toFixed(0)}M</div>
                    <div className="text-sm text-muted-foreground">PV of FCFs</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">${results.valuation.pv_of_terminal.toFixed(0)}M</div>
                    <div className="text-sm text-muted-foreground">PV of Terminal</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">${results.valuation.terminal_value.toFixed(0)}M</div>
                    <div className="text-sm text-muted-foreground">Terminal Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Projections Table */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Projections</CardTitle>
              <CardDescription>5-year forecast assumptions and cash flows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Metric</th>
                      {[1, 2, 3, 4, 5].map(year => (
                        <th key={year} className="text-right p-2">Year {year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Revenue ($M)</td>
                      {results.projections.revenues.map((rev, i) => (
                        <td key={i} className="text-right p-2">${rev.toFixed(0)}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">EBITDA ($M)</td>
                      {results.projections.ebitdas.map((ebitda, i) => (
                        <td key={i} className="text-right p-2">${ebitda.toFixed(0)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Free Cash Flow ($M)</td>
                      {results.projections.free_cash_flows.map((fcf, i) => (
                        <td key={i} className="text-right p-2">${fcf.toFixed(0)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sensitivity Analysis */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Sensitivity Analysis</CardTitle>
              <CardDescription>Enterprise value sensitivity to WACC and terminal growth assumptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      {results.sensitivity.ltg_range.map(ltg => (
                        <th key={ltg} className="text-center p-2">{(ltg * 100).toFixed(1)}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.sensitivity.wacc_range.map((wacc, i) => (
                      <tr key={wacc}>
                        <td className="font-medium p-2">{(wacc * 100).toFixed(1)}%</td>
                        {results.sensitivity.ev_grid[i].map((ev, j) => (
                          <td key={j} className="text-center p-2">${ev.toFixed(0)}M</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
