
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, Calculator, Eye, EyeOff, RefreshCw } from "lucide-react";

interface EnhancedIncomeStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function EnhancedIncomeStep({ taxData, documents, updateTaxData }: EnhancedIncomeStepProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showMathematicalBreakdown, setShowMathematicalBreakdown] = useState(false);
  const [mathematicalBreakdown, setMathematicalBreakdown] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  useEffect(() => {
    // Auto-load mathematical breakdown on component mount
    loadMathematicalBreakdown();
  }, []);

  const loadMathematicalBreakdown = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/tax-data-extraction");
      
      if (response.ok) {
        const data = await response.json();
        setMathematicalBreakdown(data.mathematicalBreakdown);
        console.log("📊 Mathematical breakdown loaded:", data.mathematicalBreakdown);
        
        // Update tax data if the API has more recent information
        if (data.extractedTaxData) {
          updateTaxData('income', {
            wages: data.extractedTaxData.income.wages || 0,
            interest: data.extractedTaxData.income.interest || 0,
            dividends: data.extractedTaxData.income.dividends || 0,
            other: (data.extractedTaxData.income.nonEmployeeCompensation || 0) + 
                   (data.extractedTaxData.income.miscellaneousIncome || 0) + 
                   (data.extractedTaxData.income.rentalRoyalties || 0) + 
                   (data.extractedTaxData.income.other || 0),
          });
          
          // CRITICAL: Also update withholdings for tax calculation
          updateTaxData('withholdings', {
            federalTax: data.extractedTaxData.withholdings.federalTax || 0,
            stateTax: data.extractedTaxData.withholdings.stateTax || 0,
            socialSecurityTax: data.extractedTaxData.withholdings.socialSecurityTax || 0,
            medicareTax: data.extractedTaxData.withholdings.medicareTax || 0,
          });
        }
      } else {
        console.error("Failed to load mathematical breakdown");
      }
    } catch (error) {
      console.error("Error loading mathematical breakdown:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncomeChange = (field: string, value: string) => {
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    const roundedValue = Math.round(numValue * 100) / 100;
    
    updateTaxData('income', {
      [field]: roundedValue,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const relevantDocs = (documents || []).filter(doc => {
    const confidence = doc?.confidence || 0;
    return confidence > 0.1 && doc.extractedData && doc.extractedData.length > 0;
  });

  const totalIncome = (taxData?.income?.wages || 0) + 
                     (taxData?.income?.interest || 0) + 
                     (taxData?.income?.dividends || 0) + 
                     (taxData?.income?.other || 0);

  const IncomeSourceCard = ({ title, field, value, description, boxInfo, mathematicalData }: any) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor={field}>{title}</Label>
          <Input
            id={field}
            type="number"
            step="0.01"
            value={value || ''}
            onChange={(e) => handleIncomeChange(field, e.target.value)}
            placeholder="0.00"
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {boxInfo}
            {value > 0 && (
              <span className="text-green-600 font-medium"> • Auto-filled from uploaded documents</span>
            )}
          </p>
        </div>
        
        {/* Show mathematical breakdown for this income source */}
        {mathematicalData && mathematicalData.sources && mathematicalData.sources.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-blue-800 mb-2">
              📄 Document Sources ({mathematicalData.sources.length}):
            </h4>
            {mathematicalData.sources.map((source: any, idx: number) => (
              <div key={idx} className="mb-2 p-2 bg-white rounded border border-blue-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{source.document}</span>
                    <span className="text-xs text-muted-foreground block">
                      {source.documentType.replace('FORM_', '').replace('_', '-')} • {Math.round(source.confidence * 100)}% confidence
                    </span>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    ${source.contribution.toLocaleString()}
                  </Badge>
                </div>
                
                {/* Enhanced: Show extracted fields with proper box labeling */}
                {source.extractedFields && source.extractedFields.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs font-medium text-muted-foreground">Extracted fields:</span>
                    {source.extractedFields.map((field: any, fieldIdx: number) => (
                      <div key={fieldIdx} className="mb-2 p-2 bg-gray-50 rounded border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-800">
                              {field.box || 'Unknown Box'}: {field.boxDetails || field.description || 'Tax form field'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-semibold">Field:</span> {field.fieldName}
                            </div>
                          </div>
                          <div className="ml-2 text-right">
                            <div className="font-mono text-sm font-bold">
                              ${field.amount?.toLocaleString() || '0'}
                            </div>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {Math.round((field.confidence || 0) * 100)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Show when no data found */}
        {(!mathematicalData || !mathematicalData.sources || mathematicalData.sources.length === 0) && value === 0 && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <div className="flex items-center space-x-2 text-amber-700">
              <FileText className="w-4 h-4" />
              <span className="font-medium">No data extracted yet</span>
            </div>
            <p className="text-amber-600 mt-1">
              Upload relevant tax documents (W-2, 1099-INT, 1099-DIV, etc.) or enter manually
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Income Information</h2>
        <p className="text-muted-foreground">
          Review and modify your income from all sources. Data has been auto-populated from your uploaded documents.
        </p>
      </div>

      {/* Document Processing Status */}
      {relevantDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Document Processing Status
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadMathematicalBreakdown}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Analysis
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Processing documents...</p>
              </div>
            ) : mathematicalBreakdown ? (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">📊 Processing Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Documents Processed:</span>
                    <div className="font-bold text-lg">{mathematicalBreakdown.summary.documentsProcessed}/{mathematicalBreakdown.summary.totalDocumentsUploaded}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Confidence:</span>
                    <div className="font-bold text-lg">{Math.round(mathematicalBreakdown.summary.averageConfidence * 100)}%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fields Extracted:</span>
                    <div className="font-bold text-lg">{mathematicalBreakdown.summary.extractedFieldsCount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Income:</span>
                    <div className="font-bold text-lg text-green-600">${mathematicalBreakdown.totalIncome.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No processing data available. Upload documents to get started.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Income Source Cards with Enhanced Breakdown */}
      <IncomeSourceCard
        title="W-2 Wages & Salary"
        field="wages"
        value={taxData.income.wages}
        boxInfo="From Box 1 of your W-2 form(s) - Wages, tips, and other compensation • Auto-filled from uploaded documents"
        mathematicalData={mathematicalBreakdown?.incomeBreakdown?.w2Wages}
      />

      <IncomeSourceCard
        title="Interest Income"
        field="interest"
        value={taxData.income.interest}
        boxInfo="From Box 1 of your 1099-INT form(s) - Interest income • Auto-filled from uploaded documents"
        mathematicalData={mathematicalBreakdown?.incomeBreakdown?.interest}
      />

      <IncomeSourceCard
        title="Dividend Income"
        field="dividends"
        value={taxData.income.dividends}
        boxInfo="From Box 1a of your 1099-DIV form(s) - Ordinary dividends • Auto-filled from uploaded documents"
        mathematicalData={mathematicalBreakdown?.incomeBreakdown?.dividends}
      />

      <IncomeSourceCard
        title="Other Income"
        field="other"
        value={taxData.income.other}
        boxInfo="1099-NEC nonemployee compensation, 1099-MISC other income, rental income, royalties, and other taxable income • Auto-filled from uploaded documents"
        mathematicalData={{
          sources: [
            ...(mathematicalBreakdown?.incomeBreakdown?.nonEmployeeCompensation?.sources || []),
            ...(mathematicalBreakdown?.incomeBreakdown?.miscellaneousIncome?.sources || []),
            ...(mathematicalBreakdown?.incomeBreakdown?.rentalRoyalties?.sources || []),
            ...(mathematicalBreakdown?.incomeBreakdown?.otherIncome?.sources || [])
          ]
        }}
      />

      {/* Tax Withholdings Section - Separate from Income with Detailed Breakdown */}
      {mathematicalBreakdown?.withholdingsBreakdown && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Tax Withholdings (Credits for Tax Calculation)
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMathematicalBreakdown(!showMathematicalBreakdown)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showMathematicalBreakdown ? "Hide Details" : "Show Calculations"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              These amounts were withheld from your income for taxes and will be applied as credits against your tax liability.
            </p>
            
            {showMathematicalBreakdown && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
                <h4 className="font-bold text-sm mb-3">📊 Detailed Tax Withholdings Calculation:</h4>
                <div className="space-y-3 text-xs font-mono">
                  {mathematicalBreakdown.withholdingsBreakdown.calculationSteps?.map((step: string, idx: number) => (
                    <div key={idx} className={
                      step.startsWith('💸') ? 'font-bold text-blue-800 text-sm' :
                      step.startsWith('📋') ? 'font-bold text-gray-800 mt-2' :
                      step.startsWith('   ➤') ? 'font-bold text-green-700 border-l-2 border-green-400 pl-2' :
                      step.startsWith('━━━') ? 'font-bold text-gray-600 border-t mt-2 pt-2' :
                      step.startsWith('💰') ? 'font-bold text-lg text-gray-800' :
                      step.startsWith('✅') ? 'font-bold text-green-800 mt-2' :
                      step.startsWith('   •') ? 'text-green-700 text-xs' :
                      'text-gray-700'
                    }>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid gap-4">
              {/* Federal Tax Withheld with Detailed Breakdown */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">Federal Income Tax Withheld</h4>
                    <p className="text-sm text-muted-foreground">
                      {mathematicalBreakdown.withholdingsBreakdown.federalTax.description}
                    </p>
                    <div className="text-xs text-blue-600 mt-1">
                      Sources: {mathematicalBreakdown.withholdingsBreakdown.federalTax.sources.join(', ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(mathematicalBreakdown.withholdingsBreakdown.federalTax.amount)}
                    </span>
                  </div>
                </div>
                
                {/* Show document-level breakdown for Federal Tax */}
                {mathematicalBreakdown.withholdingsBreakdown.federalTax.documentBreakdown && mathematicalBreakdown.withholdingsBreakdown.federalTax.documentBreakdown.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <h5 className="font-medium text-sm text-blue-800 mb-2">
                      📄 Document Sources ({mathematicalBreakdown.withholdingsBreakdown.federalTax.documentBreakdown.length}):
                    </h5>
                    {mathematicalBreakdown.withholdingsBreakdown.federalTax.documentBreakdown.map((docBreakdown: any, idx: number) => (
                      <div key={idx} className="mb-2 p-2 bg-white rounded border border-blue-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="font-medium text-sm">{docBreakdown.document}</span>
                            <span className="text-xs text-muted-foreground block">
                              {docBreakdown.documentType} • {docBreakdown.confidence}% confidence
                            </span>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            ${docBreakdown.totalContribution.toLocaleString()}
                          </Badge>
                        </div>
                        
                        {/* Show field-level extraction */}
                        {docBreakdown.extractedFields && docBreakdown.extractedFields.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <span className="text-xs font-medium text-muted-foreground">Extracted fields:</span>
                            {docBreakdown.extractedFields.map((field: any, fieldIdx: number) => (
                              <div key={fieldIdx} className="mb-2 p-2 bg-blue-25 rounded border">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-800">
                                      {field.box}: {field.boxDetails}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      <span className="font-semibold">Field:</span> {field.fieldName}
                                    </div>
                                  </div>
                                  <div className="ml-2 text-right">
                                    <div className="font-mono text-sm font-bold">
                                      ${field.amount?.toLocaleString() || '0'}
                                    </div>
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      {field.confidence}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Security Tax Withheld with Detailed Breakdown */}
              {mathematicalBreakdown.withholdingsBreakdown.socialSecurityTax.amount > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">Social Security Tax Withheld</h4>
                      <p className="text-sm text-muted-foreground">
                        {mathematicalBreakdown.withholdingsBreakdown.socialSecurityTax.description}
                      </p>
                      <div className="text-xs text-purple-600 mt-1">
                        Sources: {mathematicalBreakdown.withholdingsBreakdown.socialSecurityTax.sources.join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-600">
                        {formatCurrency(mathematicalBreakdown.withholdingsBreakdown.socialSecurityTax.amount)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Show document-level breakdown for Social Security Tax */}
                  {mathematicalBreakdown.withholdingsBreakdown.socialSecurityTax.documentBreakdown && mathematicalBreakdown.withholdingsBreakdown.socialSecurityTax.documentBreakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <h5 className="font-medium text-sm text-purple-800 mb-2">
                        📄 Document Sources ({mathematicalBreakdown.withholdingsBreakdown.socialSecurityTax.documentBreakdown.length}):
                      </h5>
                      {mathematicalBreakdown.withholdingsBreakdown.socialSecurityTax.documentBreakdown.map((docBreakdown: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-white rounded border border-purple-100">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{docBreakdown.document}</span>
                              <span className="text-xs text-muted-foreground block">
                                {docBreakdown.documentType} • {docBreakdown.confidence}% confidence
                              </span>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              ${docBreakdown.totalContribution.toLocaleString()}
                            </Badge>
                          </div>
                          
                          {/* Show field-level extraction */}
                          {docBreakdown.extractedFields && docBreakdown.extractedFields.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-xs font-medium text-muted-foreground">Extracted fields:</span>
                              {docBreakdown.extractedFields.map((field: any, fieldIdx: number) => (
                                <div key={fieldIdx} className="mb-2 p-2 bg-purple-25 rounded border">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-gray-800">
                                        {field.box}: {field.boxDetails}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <span className="font-semibold">Field:</span> {field.fieldName}
                                      </div>
                                    </div>
                                    <div className="ml-2 text-right">
                                      <div className="font-mono text-sm font-bold">
                                        ${field.amount?.toLocaleString() || '0'}
                                      </div>
                                      <Badge variant="outline" className="mt-1 text-xs">
                                        {field.confidence}%
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Medicare Tax Withheld with Detailed Breakdown */}
              {mathematicalBreakdown.withholdingsBreakdown.medicareTax.amount > 0 && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">Medicare Tax Withheld</h4>
                      <p className="text-sm text-muted-foreground">
                        {mathematicalBreakdown.withholdingsBreakdown.medicareTax.description}
                      </p>
                      <div className="text-xs text-orange-600 mt-1">
                        Sources: {mathematicalBreakdown.withholdingsBreakdown.medicareTax.sources.join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(mathematicalBreakdown.withholdingsBreakdown.medicareTax.amount)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Show document-level breakdown for Medicare Tax */}
                  {mathematicalBreakdown.withholdingsBreakdown.medicareTax.documentBreakdown && mathematicalBreakdown.withholdingsBreakdown.medicareTax.documentBreakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <h5 className="font-medium text-sm text-orange-800 mb-2">
                        📄 Document Sources ({mathematicalBreakdown.withholdingsBreakdown.medicareTax.documentBreakdown.length}):
                      </h5>
                      {mathematicalBreakdown.withholdingsBreakdown.medicareTax.documentBreakdown.map((docBreakdown: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-white rounded border border-orange-100">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{docBreakdown.document}</span>
                              <span className="text-xs text-muted-foreground block">
                                {docBreakdown.documentType} • {docBreakdown.confidence}% confidence
                              </span>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              ${docBreakdown.totalContribution.toLocaleString()}
                            </Badge>
                          </div>
                          
                          {/* Show field-level extraction */}
                          {docBreakdown.extractedFields && docBreakdown.extractedFields.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-xs font-medium text-muted-foreground">Extracted fields:</span>
                              {docBreakdown.extractedFields.map((field: any, fieldIdx: number) => (
                                <div key={fieldIdx} className="mb-2 p-2 bg-orange-25 rounded border">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-gray-800">
                                        {field.box}: {field.boxDetails}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <span className="font-semibold">Field:</span> {field.fieldName}
                                      </div>
                                    </div>
                                    <div className="ml-2 text-right">
                                      <div className="font-mono text-sm font-bold">
                                        ${field.amount?.toLocaleString() || '0'}
                                      </div>
                                      <Badge variant="outline" className="mt-1 text-xs">
                                        {field.confidence}%
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* State Tax Withheld with Detailed Breakdown */}
              {mathematicalBreakdown.withholdingsBreakdown.stateTax.amount > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">State Income Tax Withheld</h4>
                      <p className="text-sm text-muted-foreground">
                        {mathematicalBreakdown.withholdingsBreakdown.stateTax.description}
                      </p>
                      <div className="text-xs text-green-600 mt-1">
                        Sources: {mathematicalBreakdown.withholdingsBreakdown.stateTax.sources.join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(mathematicalBreakdown.withholdingsBreakdown.stateTax.amount)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Show document-level breakdown for State Tax */}
                  {mathematicalBreakdown.withholdingsBreakdown.stateTax.documentBreakdown && mathematicalBreakdown.withholdingsBreakdown.stateTax.documentBreakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <h5 className="font-medium text-sm text-green-800 mb-2">
                        📄 Document Sources ({mathematicalBreakdown.withholdingsBreakdown.stateTax.documentBreakdown.length}):
                      </h5>
                      {mathematicalBreakdown.withholdingsBreakdown.stateTax.documentBreakdown.map((docBreakdown: any, idx: number) => (
                        <div key={idx} className="mb-2 p-2 bg-white rounded border border-green-100">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{docBreakdown.document}</span>
                              <span className="text-xs text-muted-foreground block">
                                {docBreakdown.documentType} • {docBreakdown.confidence}% confidence
                              </span>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              ${docBreakdown.totalContribution.toLocaleString()}
                            </Badge>
                          </div>
                          
                          {/* Show field-level extraction */}
                          {docBreakdown.extractedFields && docBreakdown.extractedFields.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <span className="text-xs font-medium text-muted-foreground">Extracted fields:</span>
                              {docBreakdown.extractedFields.map((field: any, fieldIdx: number) => (
                                <div key={fieldIdx} className="mb-2 p-2 bg-green-25 rounded border">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="text-xs font-medium text-gray-800">
                                        {field.box}: {field.boxDetails}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <span className="font-semibold">Field:</span> {field.fieldName}
                                      </div>
                                    </div>
                                    <div className="ml-2 text-right">
                                      <div className="font-mono text-sm font-bold">
                                        ${field.amount?.toLocaleString() || '0'}
                                      </div>
                                      <Badge variant="outline" className="mt-1 text-xs">
                                        {field.confidence}%
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Total Withholdings Summary */}
              <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-lg">Total Tax Withholdings</h4>
                    <p className="text-sm text-muted-foreground">
                      Total credits to apply against tax liability
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-gray-700">
                      {formatCurrency(mathematicalBreakdown.withholdingsBreakdown.totalWithholdings)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Income Summary
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            >
              <Calculator className="w-4 h-4 mr-2" />
              {showCalculationDetails ? "Hide Details" : "Show Details"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showCalculationDetails && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Total Income Calculation:</h4>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between">
                  <span>W-2 Wages:</span>
                  <span>+ {formatCurrency(taxData.income.wages)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest (1099-INT):</span>
                  <span>+ {formatCurrency(taxData.income.interest)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dividends (1099-DIV):</span>
                  <span>+ {formatCurrency(taxData.income.dividends)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Income:</span>
                  <span>+ {formatCurrency(taxData.income.other)}</span>
                </div>
                <div className="flex justify-between border-t pt-1 font-bold">
                  <span>Total Income:</span>
                  <span>= {formatCurrency(totalIncome)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between font-bold text-xl border-t pt-3">
            <span>Total Income:</span>
            <span className="text-green-600">{formatCurrency(totalIncome)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information for Development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500 flex items-center">
              🔧 Debug Information (Development Only)
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="ml-2"
              >
                {showBreakdown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showBreakdown && (
            <CardContent className="text-sm">
              <div className="space-y-3">
                <div>
                  <strong>Documents Found:</strong> {documents.length}
                  <ul className="ml-4 mt-1">
                    {documents.map((doc, index) => (
                      <li key={index} className="font-mono">
                        {doc.fileName} - {doc.documentType} ({Math.round((doc.confidence || 0) * 100)}% confidence)
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <strong>Current Tax Data:</strong>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(taxData.income, null, 2)}
                  </pre>
                </div>

                {mathematicalBreakdown && (
                  <div>
                    <strong>Mathematical Breakdown Summary:</strong>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify({
                        totalIncome: mathematicalBreakdown.totalIncome,
                        documentsProcessed: mathematicalBreakdown.summary?.documentsProcessed,
                        averageConfidence: Math.round((mathematicalBreakdown.summary?.averageConfidence || 0) * 100) + '%',
                        extractedFields: mathematicalBreakdown.summary?.extractedFieldsCount
                      }, null, 2)}
                    </pre>
                  </div>
                )}
                
                <Button 
                  onClick={loadMathematicalBreakdown}
                  variant="outline" 
                  size="sm"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
