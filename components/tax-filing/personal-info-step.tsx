
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MapPin, Shield, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PersonalInfoStepProps {
  taxData: any;
  documents: any[];
  updateTaxData: (section: string, data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function PersonalInfoStep({ taxData, documents, updateTaxData }: PersonalInfoStepProps) {
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [autoPopulateStatus, setAutoPopulateStatus] = useState<'none' | 'success' | 'partial' | 'error'>('none');
  
  const w2Documents = documents.filter(doc => doc.documentType === 'W2' && doc.confidence > 0.1);
  const hasW2Data = w2Documents.length > 0;

  useEffect(() => {
    if (hasW2Data && !taxData.personalInfo.firstName && autoPopulateStatus === 'none') {
      autoPopulateFromW2();
    }
  }, [hasW2Data, taxData.personalInfo.firstName]);

  // Helper function to extract value from Azure Document Intelligence nested structure
  const extractValueFromAzureField = (fieldValue: any): { value: any, confidence: number } => {
    if (!fieldValue) return { value: null, confidence: 0 };
    
    try {
      let parsed = fieldValue;
      if (typeof fieldValue === 'string') {
        parsed = JSON.parse(fieldValue);
      }
      
      // Handle nested Azure Document Intelligence structure
      if (parsed && typeof parsed === 'object') {
        let extractedValue = null;
        let confidence = parsed.confidence || 0;
        
        // Check for value.valueNumber (most common for numbers)
        if (parsed.value && typeof parsed.value.valueNumber === 'number') {
          extractedValue = parsed.value.valueNumber;
        }
        // Check for value.valueString (strings)
        else if (parsed.value && typeof parsed.value.valueString === 'string') {
          extractedValue = parsed.value.valueString;
        }
        // Check for direct valueNumber
        else if (typeof parsed.valueNumber === 'number') {
          extractedValue = parsed.valueNumber;
        }
        // Check for direct valueString
        else if (typeof parsed.valueString === 'string') {
          extractedValue = parsed.valueString;
        }
        // Check for direct value
        else if (parsed.value !== undefined) {
          extractedValue = parsed.value;
        }
        // Fallback to the parsed object itself
        else {
          extractedValue = parsed;
        }
        
        return { value: extractedValue, confidence };
      }
      
      // Direct value
      return { value: parsed, confidence: 1.0 };
      
    } catch (e) {
      // If not JSON, return as-is
      return { value: fieldValue, confidence: 1.0 };
    }
  };

  const autoPopulateFromW2 = async () => {
    if (!hasW2Data) return;

    setIsAutoPopulating(true);
    setAutoPopulateStatus('none');

    try {
      console.log('🔍 Senior Azure Developer: Auto-populating personal info from W-2 documents...');
      
      // Get the W-2 document with highest confidence
      const bestW2 = w2Documents.reduce((best, current) => 
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      );

      console.log(`📋 Using W-2 document: ${bestW2.originalFileName || bestW2.fileName} (${Math.round((bestW2.confidence || 0) * 100)}% confidence)`);

      // Extract data from the best W-2 document
      const extractedData = bestW2.extractedData || [];
      
      let personalInfo = { ...taxData.personalInfo };
      let fieldsUpdated = 0;

      // Map extracted fields to personal info with proper Azure parsing
      extractedData.forEach((field: any) => {
        const fieldName = field.fieldName?.toLowerCase() || '';
        const rawFieldValue = field.fieldValue;
        
        console.log(`🔍 Processing field: ${field.fieldName} = ${rawFieldValue?.substring(0, 100)}...`);
        
        if (!rawFieldValue) return;

        // Handle Employee object with nested name, SSN, address data (Azure's standard format)
        if (fieldName === 'employee') {
          try {
            const employeeData = JSON.parse(rawFieldValue);
            console.log(`📋 Employee data structure detected`);
            
            // Extract name from nested structure
            if (employeeData?.value?.Name?.value?.valueString && !personalInfo.firstName) {
              const fullName = employeeData.value.Name.value.valueString;
              const nameParts = fullName.split(/\s+/);
              if (nameParts.length >= 2) {
                personalInfo.firstName = nameParts[0];
                personalInfo.lastName = nameParts.slice(1).join(' ');
                fieldsUpdated += 2;
                console.log(`✅ Extracted name from Employee object: ${personalInfo.firstName} ${personalInfo.lastName}`);
              }
            }
            
            // Extract SSN from nested structure
            if (employeeData?.value?.SocialSecurityNumber?.value?.valueString && !personalInfo.ssn) {
              personalInfo.ssn = employeeData.value.SocialSecurityNumber.value.valueString;
              fieldsUpdated++;
              console.log(`✅ Extracted SSN from Employee object: ${personalInfo.ssn}`);
            }
            
            // Extract address from nested structure - Use individual components first
            if (employeeData?.value?.Address?.value && !personalInfo.address) {
              const addressData = employeeData.value.Address.value;
              
              // Use individual address components directly from Azure (most accurate)
              if (addressData.streetAddress) {
                personalInfo.street = addressData.streetAddress;
                fieldsUpdated++;
                console.log(`✅ Extracted street from Azure components: ${personalInfo.street}`);
              }
              
              if (addressData.city) {
                personalInfo.city = addressData.city;
                fieldsUpdated++;
                console.log(`✅ Extracted city from Azure components: ${personalInfo.city}`);
              }
              
              if (addressData.state) {
                personalInfo.state = addressData.state;
                fieldsUpdated++;
                console.log(`✅ Extracted state from Azure components: ${personalInfo.state}`);
              }
              
              if (addressData.postalCode) {
                personalInfo.zip = addressData.postalCode;
                fieldsUpdated++;
                console.log(`✅ Extracted zip from Azure components: ${personalInfo.zip}`);
              }
              
              // Build full address for display if components exist
              if (personalInfo.street || personalInfo.city || personalInfo.state || personalInfo.zip) {
                const addressParts = [];
                if (personalInfo.street) addressParts.push(personalInfo.street);
                if (personalInfo.city) addressParts.push(personalInfo.city);
                if (personalInfo.state) addressParts.push(personalInfo.state);
                if (personalInfo.zip) addressParts.push(personalInfo.zip);
                personalInfo.address = addressParts.join(', ');
                console.log(`✅ Built full address from Azure components: ${personalInfo.address}`);
              }
              
              // Only fallback to parsing streetAddress if individual components aren't available
              else if (addressData.streetAddress) {
                const fullAddress = addressData.streetAddress;
                personalInfo.address = fullAddress;
                
                // Parse address components as fallback
                const { street, city, state, zip } = parseAddress(fullAddress);
                if (street) personalInfo.street = street;
                if (city) personalInfo.city = city;
                if (state) personalInfo.state = state;
                if (zip) personalInfo.zip = zip;
                
                fieldsUpdated += street || city || state || zip ? 4 : 1;
                console.log(`✅ Fallback: Parsed address components from streetAddress: ${fullAddress}`);
              }
            }
          } catch (parseError) {
            console.warn(`⚠️ Failed to parse Employee object:`, parseError);
          }
        }
        
        // Also handle direct field mappings for other formats
        const extracted = extractValueFromAzureField(rawFieldValue);
        if (extracted.value && extracted.confidence > 0.3) {
          // Handle other direct field formats (fallback)
          switch (fieldName) {
            case 'employee_name':
            case 'employee.name':
            case 'name':
              if (!personalInfo.firstName && typeof extracted.value === 'string') {
                const nameParts = extracted.value.split(/\s+/);
                if (nameParts.length >= 2) {
                  personalInfo.firstName = nameParts[0];
                  personalInfo.lastName = nameParts.slice(1).join(' ');
                  fieldsUpdated += 2;
                  console.log(`✅ Extracted name from direct field: ${personalInfo.firstName} ${personalInfo.lastName}`);
                }
              }
              break;
              
            case 'employee_ssn':
            case 'employee.ssn':
            case 'ssn':
            case 'social_security_number':
              if (!personalInfo.ssn && typeof extracted.value === 'string') {
                const ssnDigits = extracted.value.replace(/\D/g, '');
                if (ssnDigits.length === 9) {
                  personalInfo.ssn = `${ssnDigits.slice(0,3)}-${ssnDigits.slice(3,5)}-${ssnDigits.slice(5)}`;
                  fieldsUpdated++;
                  console.log(`✅ Extracted SSN from direct field: ${personalInfo.ssn}`);
                }
              }
              break;
              
            case 'employee_address':
            case 'employee.address':
            case 'address':
              if (!personalInfo.address && typeof extracted.value === 'string') {
                personalInfo.address = extracted.value;
                
                const { street, city, state, zip } = parseAddress(extracted.value);
                if (street) personalInfo.street = street;
                if (city) personalInfo.city = city;
                if (state) personalInfo.state = state;
                if (zip) personalInfo.zip = zip;
                
                fieldsUpdated += street || city || state || zip ? 4 : 1;
                console.log(`✅ Extracted address from direct field: ${extracted.value}`);
              }
              break;
          }
        }
      });

      // Update tax data if we found information
      if (fieldsUpdated > 0) {
        updateTaxData('personalInfo', personalInfo);
        setAutoPopulateStatus('success');
        console.log(`🎉 Successfully auto-populated ${fieldsUpdated} fields from W-2 data`);
      } else {
        setAutoPopulateStatus('partial');
        console.log('⚠️ No extractable personal information found in W-2 documents');
      }

    } catch (error) {
      console.error('❌ Error auto-populating from W-2:', error);
      setAutoPopulateStatus('error');
    } finally {
      setIsAutoPopulating(false);
    }
  };

  const parseAddress = (fullAddress: string) => {
    const address = fullAddress.trim();
    
    // Try to extract ZIP code (5 or 9 digits at the end)
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\s*$/);
    const zip = zipMatch ? zipMatch[1] : '';
    
    // Try to extract state (2 letters before ZIP)
    const beforeZip = zip ? address.substring(0, address.lastIndexOf(zip)).trim() : address;
    const stateMatch = beforeZip.match(/\b([A-Z]{2})\s*,?\s*$/);
    const state = stateMatch ? stateMatch[1] : '';
    
    // Try to extract city (word before state)
    const beforeState = state ? beforeZip.substring(0, beforeZip.lastIndexOf(state)).trim() : beforeZip;
    const cityMatch = beforeState.match(/,?\s*([^,]+?)\s*,?\s*$/);
    const city = cityMatch ? cityMatch[1].trim() : '';
    
    // Remaining is street address
    const street = city ? beforeState.substring(0, beforeState.lastIndexOf(city)).replace(/,?\s*$/, '').trim() : beforeState;
    
    return { street, city, state, zip };
  };

  const handleInputChange = (field: string, value: string | number) => {
    updateTaxData('personalInfo', {
      [field]: value,
    });
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSSN(e.target.value);
    handleInputChange('ssn', formatted);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        <p className="text-gray-600">
          Verify and complete your personal information for your tax return.
        </p>
      </div>

      {/* Auto-populate Status */}
      {hasW2Data && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {autoPopulateStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {autoPopulateStatus === 'partial' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                {autoPopulateStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                {autoPopulateStatus === 'none' && <Shield className="w-5 h-5 text-blue-500" />}
                
                <div>
                  <p className="font-semibold text-gray-900">
                    {autoPopulateStatus === 'success' && 'Information Auto-Populated'}
                    {autoPopulateStatus === 'partial' && 'Partial Information Available'}
                    {autoPopulateStatus === 'error' && 'Auto-Population Failed'}
                    {autoPopulateStatus === 'none' && 'W-2 Data Available'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {autoPopulateStatus === 'success' && `Data extracted from ${w2Documents.length} W-2 document(s)`}
                    {autoPopulateStatus === 'partial' && 'Please review and complete the information below'}
                    {autoPopulateStatus === 'error' && 'Please enter your information manually'}
                    {autoPopulateStatus === 'none' && 'Ready to auto-populate from your W-2'}
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={autoPopulateFromW2}
                disabled={isAutoPopulating}
              >
                {isAutoPopulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {autoPopulateStatus === 'none' ? 'Auto-Fill' : 'Refresh'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-500" />
            Basic Information
            {(taxData.personalInfo.firstName || taxData.personalInfo.lastName || taxData.personalInfo.ssn) && (
              <Badge className="ml-2 bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Data Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                First Name *
              </Label>
              <Input
                id="firstName"
                value={taxData.personalInfo.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                Last Name *
              </Label>
              <Input
                id="lastName"
                value={taxData.personalInfo.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ssn" className="text-sm font-semibold text-gray-700">
              Social Security Number *
            </Label>
            <Input
              id="ssn"
              value={taxData.personalInfo.ssn || ''}
              onChange={handleSSNChange}
              placeholder="XXX-XX-XXXX"
              maxLength={11}
              className="mt-1 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Format: 123-45-6789</p>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-green-500" />
            Address Information
            {(taxData.personalInfo.street || taxData.personalInfo.city || taxData.personalInfo.state || taxData.personalInfo.zip) && (
              <Badge className="ml-2 bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Data Found
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street" className="text-sm font-semibold text-gray-700">
              Street Address *
            </Label>
            <Input
              id="street"
              value={taxData.personalInfo.street || ''}
              onChange={(e) => handleInputChange('street', e.target.value)}
              placeholder="123 Main Street"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="unit" className="text-sm font-semibold text-gray-700">
              Apt/Suite/Unit/Floor (Optional)
            </Label>
            <Input
              id="unit"
              value={taxData.personalInfo.unit || ''}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              placeholder="Apt 4B, Suite 200, Unit 15, Floor 3, etc."
              className="mt-1"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
                City *
              </Label>
              <Input
                id="city"
                value={taxData.personalInfo.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state" className="text-sm font-semibold text-gray-700">
                State *
              </Label>
              <Input
                id="state"
                value={taxData.personalInfo.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                placeholder="CA"
                maxLength={2}
                className="mt-1 uppercase"
              />
            </div>
            <div>
              <Label htmlFor="zip" className="text-sm font-semibold text-gray-700">
                ZIP Code *
              </Label>
              <Input
                id="zip"
                value={taxData.personalInfo.zip || ''}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                placeholder="12345"
                maxLength={10}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-purple-500" />
            Filing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="filingStatus" className="text-sm font-semibold text-gray-700">
              Filing Status *
            </Label>
            <Select
              value={taxData.personalInfo.filingStatus || 'single'}
              onValueChange={(value) => handleInputChange('filingStatus', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select filing status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married-jointly">Married Filing Jointly</SelectItem>
                <SelectItem value="married-separately">Married Filing Separately</SelectItem>
                <SelectItem value="head-of-household">Head of Household</SelectItem>
                <SelectItem value="qualifying-widow">Qualifying Widow(er)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dependents" className="text-sm font-semibold text-gray-700">
              Number of Dependents
            </Label>
            <Input
              id="dependents"
              type="number"
              min="0"
              max="20"
              value={taxData.personalInfo.dependents || 0}
              onChange={(e) => handleInputChange('dependents', parseInt(e.target.value) || 0)}
              placeholder="0"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the number of qualifying children and other dependents
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Professional Note */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Security:</strong> All personal information is encrypted and processed securely. 
          This information is used solely for preparing your tax return and is never shared with third parties.
        </AlertDescription>
      </Alert>
    </div>
  );
}
