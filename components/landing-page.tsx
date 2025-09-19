
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Zap, CheckCircle, ArrowRight, Upload } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-6xl items-center justify-between px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">TAXGROK</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-24 pb-20 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6">
            <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              2025 Tax Season • AI-Powered
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            Tax Prep
            <br />
            <span className="text-gradient">Reimagined</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload documents, get instant data extraction, file in minutes.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-tax hover:opacity-90 h-14 px-8 text-lg">
                Start Filing Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg" onClick={() => {
              const featuresSection = document.querySelector('section:nth-of-type(2)');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See How It Works
            </Button>
          </motion.div>
          
          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>IRS compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span>2-min filing</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Three Simple Steps</h2>
          <p className="text-lg text-muted-foreground">
            Professional tax prep, simplified
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Upload className="h-10 w-10 text-primary" />,
              step: "01",
              title: "Upload",
              description: "Drop your tax docs and we'll extract everything instantly"
            },
            {
              icon: <CheckCircle className="h-10 w-10 text-primary" />,
              step: "02", 
              title: "Review",
              description: "Verify the auto-populated data and make any adjustments"
            },
            {
              icon: <FileText className="h-10 w-10 text-primary" />,
              step: "03",
              title: "File",
              description: "Download your complete Form 1040 and submit electronically"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
                <CardContent className="p-8 text-center">
                  <div className="relative mb-6">
                    <div className="absolute -top-2 -right-2 text-6xl font-bold text-gray-100 select-none">
                      {feature.step}
                    </div>
                    <div className="relative z-10 mx-auto p-4 bg-primary/10 rounded-2xl w-fit">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported Documents Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Works with all your tax documents</h2>
            <p className="text-muted-foreground">
              Automatic data extraction from any tax form
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            {["W-2", "1099-DIV", "1099-MISC", "1099-INT", "1099-NEC", "1040"].map((form, index) => (
              <motion.div
                key={form}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <span className="font-medium text-gray-900">{form}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-tax text-white py-24">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">File your taxes in 2 minutes</h2>
            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              No hidden fees. No complicated forms. Just simple, accurate tax preparation.
            </p>
            <Link href="/auth/signup">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100 transition-colors h-14 px-8 text-lg"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center max-w-6xl">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <FileText className="h-6 w-6" />
            <span className="text-xl font-bold">TAXGROK</span>
          </div>
          <p className="text-gray-400">
            © 2025 TAXGROK. Simplified tax preparation for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}
