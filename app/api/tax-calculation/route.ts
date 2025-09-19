
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { extractTaxDataFromDocuments, calculateComprehensiveTax } from "@/lib/tax-calculations";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🏛️ SENIOR TAX ACCOUNTANT: Starting real data tax calculation');

    // Get all user's completed documents
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.user.id,
        processingStatus: "COMPLETED"
      },
      include: {
        extractedData: true,
      }
    });

    if (documents.length === 0) {
      console.log('📋 No processed documents found for tax calculation');
      return NextResponse.json({
        taxCalculation: null,
        message: "No processed documents found. Please upload and process your tax documents first."
      });
    }

    // Transform documents to expected format
    const processedDocs = documents.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName || 'unknown',
      documentType: doc.documentType || 'OTHER',
      extractedData: doc.extractedData || [],
      confidence: doc.confidence || 0
    }));

    console.log(`📊 Processing ${processedDocs.length} documents for tax calculation`);

    // Extract comprehensive tax data from ALL documents
    const extractedTaxData = extractTaxDataFromDocuments(processedDocs);

    console.log('💰 EXTRACTED TAX DATA SUMMARY:');
    console.log(`  W-2 Wages: $${extractedTaxData.income.wages.toLocaleString()}`);
    console.log(`  Interest: $${extractedTaxData.income.interest.toLocaleString()}`);
    console.log(`  Dividends: $${extractedTaxData.income.dividends.toLocaleString()}`);
    console.log(`  Non-Employee Comp: $${extractedTaxData.income.nonEmployeeCompensation.toLocaleString()}`);
    console.log(`  Federal Tax Withheld: $${extractedTaxData.withholdings.federalTax.toLocaleString()}`);

    // Perform comprehensive 11-phase tax calculation
    const comprehensiveTaxResult = calculateComprehensiveTax(
      extractedTaxData,
      'single', // Default filing status - could be user configurable
      false,
      0,
      0
    );

    // Convert comprehensive result to legacy format for compatibility
    const legacyTaxCalculation = {
      totalIncome: comprehensiveTaxResult.summary.adjustedGrossIncome,
      standardDeduction: comprehensiveTaxResult.phases.phase4_DeductionDetermination.standardDeduction,
      taxableIncome: comprehensiveTaxResult.summary.taxableIncome,
      estimatedTax: comprehensiveTaxResult.summary.totalTaxLiability,
      effectiveTaxRate: comprehensiveTaxResult.summary.effectiveTaxRate * 100,
      marginalTaxRate: comprehensiveTaxResult.summary.marginalTaxRate * 100
    };

    // Save or update tax return with REAL calculated values
    const taxReturn = await prisma.taxReturn.upsert({
      where: {
        userId_taxYear: {
          userId: session.user.id,
          taxYear: 2025
        }
      },
      update: {
        totalIncome: legacyTaxCalculation.totalIncome,
        standardDeduction: legacyTaxCalculation.standardDeduction,
        taxableIncome: legacyTaxCalculation.taxableIncome,
        estimatedTax: legacyTaxCalculation.estimatedTax,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        taxYear: 2025,
        totalIncome: legacyTaxCalculation.totalIncome,
        standardDeduction: legacyTaxCalculation.standardDeduction,
        taxableIncome: legacyTaxCalculation.taxableIncome,
        estimatedTax: legacyTaxCalculation.estimatedTax,
      }
    });

    console.log('✅ SENIOR TAX ACCOUNTANT: Real tax calculation complete');
    console.log(`📊 Final Tax Liability: $${legacyTaxCalculation.estimatedTax.toLocaleString()}`);

    return NextResponse.json({
      taxCalculation: legacyTaxCalculation,
      taxReturn,
      extractedTaxData, // Include extracted data for transparency
      comprehensiveResult: comprehensiveTaxResult // Include detailed results
    });
  } catch (error) {
    console.error("❌ Real tax calculation error:", error);
    return NextResponse.json(
      { error: "Tax calculation failed. Please ensure you have uploaded and processed your tax documents." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🔍 SENIOR DEVELOPER: Fetching real tax calculation data');

    // Get all user's completed documents for real-time calculation
    const documents = await prisma.document.findMany({
      where: { 
        userId: session.user.id,
        processingStatus: "COMPLETED"
      },
      include: {
        extractedData: true,
      }
    });

    if (documents.length === 0) {
      console.log('📋 No processed documents found');
      return NextResponse.json({ 
        taxCalculation: null,
        message: "No processed documents found. Upload documents to see tax calculation."
      });
    }

    // Always calculate from real extracted data, never use cached mock values
    const processedDocs = documents.map((doc: any) => ({
      id: doc.id,
      fileName: doc.fileName || 'unknown',
      documentType: doc.documentType || 'OTHER',
      extractedData: doc.extractedData || [],
      confidence: doc.confidence || 0
    }));

    const extractedTaxData = extractTaxDataFromDocuments(processedDocs);
    const comprehensiveTaxResult = calculateComprehensiveTax(extractedTaxData, 'single');

    const realTaxCalculation = {
      totalIncome: comprehensiveTaxResult.summary.adjustedGrossIncome,
      standardDeduction: comprehensiveTaxResult.phases.phase4_DeductionDetermination.standardDeduction,
      taxableIncome: comprehensiveTaxResult.summary.taxableIncome,
      estimatedTax: comprehensiveTaxResult.summary.totalTaxLiability,
      effectiveTaxRate: comprehensiveTaxResult.summary.effectiveTaxRate * 100,
      marginalTaxRate: comprehensiveTaxResult.summary.marginalTaxRate * 100
    };

    console.log('✅ SENIOR DEVELOPER: Real-time calculation complete');

    return NextResponse.json({
      taxCalculation: realTaxCalculation,
      extractedTaxData,
      comprehensiveResult: comprehensiveTaxResult,
      message: "Tax calculation based on real extracted data"
    });
  } catch (error) {
    console.error("❌ Get real tax calculation error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax calculation" },
      { status: 500 }
    );
  }
}
