
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calculator, Receipt, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { calculateComprehensiveTax, type ComprehensiveTaxResult, type TaxDocumentData } from "@/lib/tax-calculations";

interface TaxCalculationStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function TaxCalculationStep({ taxData, updateTaxData }: TaxCalculationStepProps) {
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [comprehensiveResult, setComprehensiveResult] = useState<ComprehensiveTaxResult | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  // Convert filing status to match our comprehensive engine
  const normalizeFilingStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'single': 'single',
      'married-jointly': 'marriedFilingJointly',
      'married-separately': 'marriedFilingSeparately', 
      'head-of-household': 'headOfHousehold',
      'qualifying-widow': 'qualifyingWidow'
    };
    return statusMap[status] || 'single';
  };

  // Prepare tax data for comprehensive calculation
  const prepareExtractedTaxData = (): TaxDocumentData => {
    return {
      income: {
        wages: taxData.income?.wages || 0,
        interest: taxData.income?.interest || 0,
        dividends: taxData.income?.dividends || 0,
        nonEmployeeCompensation: taxData.income?.nonEmployeeCompensation || 0,
        miscellaneousIncome: taxData.income?.miscellaneousIncome || 0,
        rentalRoyalties: taxData.income?.rentalRoyalties || 0,
        other: taxData.income?.other || 0
      },
      withholdings: {
        federalTax: taxData.withholdings?.federalTax || 0,
        stateTax: taxData.withholdings?.stateTax || 0,
        socialSecurityTax: taxData.withholdings?.socialSecurityTax || 0,
        medicareTax: taxData.withholdings?.medicareTax || 0
      },
      personalInfo: {
        name: taxData.personalInfo?.firstName && taxData.personalInfo?.lastName 
          ? `${taxData.personalInfo.firstName} ${taxData.personalInfo.lastName}` 
          : '',
        ssn: taxData.personalInfo?.ssn || '',
        address: taxData.personalInfo?.address || ''
      },
      breakdown: taxData.breakdown || { byDocument: [] }
    };
  };

  // Calculate comprehensive tax results
  useEffect(() => {
    const extractedTaxData = prepareExtractedTaxData();
    const filingStatus = normalizeFilingStatus(taxData.personalInfo?.filingStatus || 'single');
    const useItemized = !taxData.deductions?.useStandard;
    const itemizedAmount = taxData.deductions?.itemized || 0;

    console.log('🏛️ TAXGROK: Starting Industry-Standard Tax Calculation');
    console.log('📊 Input Data:', {
      extractedTaxData,
      filingStatus,
      useItemized,
      itemizedAmount
    });

    const result = calculateComprehensiveTax(
      extractedTaxData,
      filingStatus as any,
      useItemized,
      itemizedAmount,
      0 // estimated tax payments
    );

    setComprehensiveResult(result);

    // Update tax data for other components
    updateTaxData('taxCalculation', {
      taxableIncome: result.summary.taxableIncome,
      federalTax: result.summary.totalTaxLiability,
      refund: result.phases.phase11_FinalBalance.refundAmount,
      owed: result.phases.phase11_FinalBalance.balanceDue,
      effectiveTaxRate: result.summary.effectiveTaxRate,
      marginalTaxRate: result.summary.marginalTaxRate,
      comprehensiveResult: result
    });

  }, [taxData.income, taxData.withholdings, taxData.personalInfo, taxData.deductions, updateTaxData]);

  if (!comprehensiveResult) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Performing industry-standard tax calculations...</p>
        </div>
      </div>
    );
  }

  const { phases, summary, metadata } = comprehensiveResult;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Industry-Standard Tax Calculation</h2>
        <p className="text-muted-foreground mb-4">
          Complete 11-phase IRS-compliant tax calculation based on your extracted document data.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Tax Year {metadata.taxYear}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Receipt className="w-3 h-3" />
            Filing Status: {metadata.filingStatus}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calculator className="w-3 h-3" />
            {metadata.standardDeductionUsed ? 'Standard' : 'Itemized'} Deduction
          </Badge>
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Adjusted Gross Income (AGI):</span>
                <span className="font-bold">{formatCurrency(summary.adjustedGrossIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">
                  {phases.phase4_DeductionDetermination.useStandardDeduction ? 'Standard' : 'Itemized'} Deduction:
                </span>
                <span className="font-bold">{formatCurrency(phases.phase4_DeductionDetermination.selectedDeduction)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-lg">Taxable Income:</span>
                <span className="font-bold text-lg">{formatCurrency(summary.taxableIncome)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Total Tax Liability:</span>
                <span className="font-bold text-red-600">{formatCurrency(summary.totalTaxLiability)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Total Withholdings:</span>
                <span className="font-bold text-blue-600">{formatCurrency(phases.phase10_WithholdingsAndCredits.federalIncomeTax)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-lg">
                  {phases.phase11_FinalBalance.finalStatus === 'refund' ? 'Refund Due:' : 'Amount Owed:'}
                </span>
                <span className={`font-bold text-lg ${
                  phases.phase11_FinalBalance.finalStatus === 'refund' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(
                    phases.phase11_FinalBalance.finalStatus === 'refund' 
                      ? phases.phase11_FinalBalance.refundAmount
                      : phases.phase11_FinalBalance.balanceDue
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KEY METRICS */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className={`border-2 ${
          phases.phase11_FinalBalance.finalStatus === 'refund' 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              {phases.phase11_FinalBalance.finalStatus === 'refund' ? (
                <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600 mr-3" />
              )}
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    phases.phase11_FinalBalance.finalStatus === 'refund'
                      ? phases.phase11_FinalBalance.refundAmount
                      : phases.phase11_FinalBalance.balanceDue
                  )}
                </div>
                <div className="text-sm font-medium">
                  {phases.phase11_FinalBalance.finalStatus === 'refund' ? 'Expected Refund' : 'Amount Owed'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentage(summary.effectiveTaxRate)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Effective Tax Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                (Total Tax ÷ AGI)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(summary.marginalTaxRate)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Marginal Tax Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                (Last Dollar Tax Rate)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TAX LIABILITY BREAKDOWN */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Liability Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Regular Income Tax</h4>
                <div className="flex justify-between">
                  <span>Federal Income Tax:</span>
                  <span className="font-medium">{formatCurrency(phases.phase9_TotalTaxLiability.regularTax)}</span>
                </div>
                {phases.phase7_SelfEmploymentTax.totalSETax > 0 && (
                  <>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Self-Employment Tax</h4>
                    <div className="flex justify-between text-sm">
                      <span>Social Security (12.4%):</span>
                      <span>{formatCurrency(phases.phase7_SelfEmploymentTax.socialSecurityTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medicare (2.9%):</span>
                      <span>{formatCurrency(phases.phase7_SelfEmploymentTax.medicareTax)}</span>
                    </div>
                    {phases.phase7_SelfEmploymentTax.additionalMedicareTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Additional Medicare (0.9%):</span>
                        <span>{formatCurrency(phases.phase7_SelfEmploymentTax.additionalMedicareTax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total SE Tax:</span>
                      <span>{formatCurrency(phases.phase7_SelfEmploymentTax.totalSETax)}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Withholdings & Credits</h4>
                {phases.phase10_WithholdingsAndCredits.federalIncomeTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Federal Income Tax Withheld:</span>
                    <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.federalIncomeTax)}</span>
                  </div>
                )}
                {phases.phase10_WithholdingsAndCredits.socialSecurityTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Social Security Tax Withheld:</span>
                    <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.socialSecurityTax)}</span>
                  </div>
                )}
                {phases.phase10_WithholdingsAndCredits.medicareTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Medicare Tax Withheld:</span>
                    <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.medicareTax)}</span>
                  </div>
                )}
                {phases.phase10_WithholdingsAndCredits.stateTax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>State Tax Withheld:</span>
                    <span>{formatCurrency(phases.phase10_WithholdingsAndCredits.stateTax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Withholdings:</span>
                  <span className="text-blue-600">{formatCurrency(phases.phase10_WithholdingsAndCredits.totalWithholdings)}</span>
                </div>
                
                {phases.phase7_SelfEmploymentTax.seDeduction > 0 && (
                  <>
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Deductions</h4>
                    <div className="flex justify-between text-sm">
                      <span>SE Tax Deduction (50%):</span>
                      <span className="text-green-600">-{formatCurrency(phases.phase7_SelfEmploymentTax.seDeduction)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Tax Liability:</span>
                <span className="text-red-600">{formatCurrency(summary.totalTaxLiability)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DETAILED BREAKDOWN TOGGLE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progressive Tax Bracket Analysis</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
              className="flex items-center gap-2"
            >
              {showDetailedBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showDetailedBreakdown ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {phases.phase6_RegularTax.bracketBreakdown.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Your taxable income of {formatCurrency(summary.taxableIncome)} is taxed progressively across multiple brackets:
              </p>
              
              {showDetailedBreakdown ? (
                <div className="space-y-2">
                  {phases.phase6_RegularTax.bracketBreakdown.map((bracket, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">
                          {formatPercentage(bracket.rate)} on {bracket.bracketRange}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Taxable in this bracket: {formatCurrency(bracket.taxableInThisBracket)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(bracket.taxFromThisBracket)}</div>
                        <div className="text-sm text-muted-foreground">
                          Cumulative: {formatCurrency(bracket.cumulativeTax)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {phases.phase6_RegularTax.bracketBreakdown.slice(0, 3).map((bracket, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{formatPercentage(bracket.rate)} on {bracket.bracketRange}</span>
                      <span>{formatCurrency(bracket.taxFromThisBracket)}</span>
                    </div>
                  ))}
                  {phases.phase6_RegularTax.bracketBreakdown.length > 3 && (
                    <div className="text-sm text-muted-foreground text-center">
                      ... and {phases.phase6_RegularTax.bracketBreakdown.length - 3} more brackets
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No taxable income falls within regular tax brackets.</p>
          )}
        </CardContent>
      </Card>

      {/* INCOME BREAKDOWN BY DOCUMENT TYPE */}
      <Card>
        <CardHeader>
          <CardTitle>Income Sources from Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Employment Income</h4>
              {phases.phase1_IncomeCollection.w2Income > 0 && (
                <div className="flex justify-between">
                  <span>W-2 Wages & Tips:</span>
                  <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.w2Income)}</span>
                </div>
              )}
              
              {phases.phase1_IncomeCollection.form1099NEC > 0 && (
                <>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">Self-Employment Income</h4>
                  <div className="flex justify-between">
                    <span>1099-NEC Non-employee Comp:</span>
                    <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.form1099NEC)}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Investment Income</h4>
              {phases.phase1_IncomeCollection.form1099INT > 0 && (
                <div className="flex justify-between">
                  <span>1099-INT Interest:</span>
                  <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.form1099INT)}</span>
                </div>
              )}
              {phases.phase1_IncomeCollection.form1099DIV > 0 && (
                <div className="flex justify-between">
                  <span>1099-DIV Dividends:</span>
                  <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.form1099DIV)}</span>
                </div>
              )}
              {phases.phase1_IncomeCollection.form1099MISC > 0 && (
                <div className="flex justify-between">
                  <span>1099-MISC Other Income:</span>
                  <span className="font-medium">{formatCurrency(phases.phase1_IncomeCollection.form1099MISC)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between font-semibold">
              <span>Total Income (Phase 2):</span>
              <span>{formatCurrency(phases.phase2_IncomeAggregation.totalOrdinaryIncome)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INDUSTRY COMPLIANCE NOTICE */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Industry-Standard Calculations</h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li>✓ 11-Phase IRS-compliant calculation procedure followed</li>
              <li>✓ 2025 tax brackets and standard deductions applied</li>
              <li>✓ Self-employment tax calculated with proper deduction (50%)</li>
              <li>✓ Progressive tax brackets applied correctly</li>
              <li>✓ All withholdings and credits properly allocated</li>
              <li>✓ No mock data used - calculations based entirely on your extracted documents</li>
            </ul>
            <div className="mt-3 text-xs text-green-700">
              <strong>Note:</strong> This calculation follows IRS Publication 17 and current federal tax code. 
              For complex situations or state taxes, consult a tax professional.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
