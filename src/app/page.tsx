'use client';

import { useRouter } from "next/navigation";
import { useSupabase } from "../lib/supabase-provider";
import { useState, useEffect } from "react";
import { DocumentUpload } from "../components/DocumentUpload";
import { AuditFeatures } from "../components/AuditFeatures";
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { session } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (session?.user?.email) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  };

  return (
    <div className="font-sans min-h-screen bg-[#f8fafc] dark:bg-[#0a101f] overflow-x-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-screen bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-900/10 -z-10 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-screen bg-gradient-to-t from-indigo-50/30 to-transparent dark:from-indigo-900/10 -z-10 blur-3xl rounded-full transform -translate-x-1/2 translate-y-1/4"></div>
      
      {/* Modern Header with subtle blur effect */}
      <header className={`sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 transition-all duration-300 ${scrollPosition > 50 ? 'shadow-md' : ''}`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Clincerta
              </h1>
            </div>
            
            {session?.user?.email ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/auth/signin")}
                  className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/auth/signup")}
                  className="relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium overflow-hidden group"
                >
                  <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6">
        {/* Hero section with asymmetric design */}
        <section className="relative py-16 md:py-24 mb-12 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative z-10">
              <div className="w-20 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 mb-6 rounded-full"></div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="block">AI-Powered</span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Clinical Document</span>
                <span className="block">Auditing</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
                Ensure compliance, detect cloned content, and improve clinical documentation
                with our advanced audit platform designed for healthcare professionals.
              </p>
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="relative group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50 overflow-hidden"
              >
                <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                <span className="relative flex items-center">
                  {isLoading ? "Loading..." : "Get Started"}
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>
              <div className="relative bg-white dark:bg-gray-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-sm border border-gray-100 dark:border-gray-700/30">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg mb-4 w-fit">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Document Analysis</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Our AI evaluates clinical documentation against industry standards in seconds.</p>
                <div className="space-y-3">
                  {['Compliance Check', 'Clone Detection', 'Quality Metrics'].map((item, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Document upload component */}
        <div className="relative mb-20">
          <DocumentUpload demoMode={!session?.user?.email} />
        </div>

        {/* Features section */}
        <AuditFeatures />

        {/* How It Works section with custom styling */}
        <section className="my-24 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-3xl -z-10"></div>
          <div className="p-10 rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">How It Works</span>
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mt-2 md:mt-0"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  title: "Upload Documents",
                  description: "Securely upload clinical documents in various formats including PDF, DOCX, and more.",
                  icon: (
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  ),
                },
                {
                  title: "Automated Analysis",
                  description: "Our AI checks for compliance, cloning, and clinical integrity using advanced algorithms.",
                  icon: (
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  ),
                },
                {
                  title: "Get Actionable Insights",
                  description: "Receive detailed reports and improvement suggestions tailored to your documentation.",
                  icon: (
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                },
              ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800/80 p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-gray-100 dark:border-gray-700/30 transform hover:-translate-y-2 transition-transform duration-300">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl w-fit mb-5">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Modern footer with distinct styling */}
      <footer className="relative mt-24 pt-16 pb-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-1 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Clincerta
                </h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                Ensuring compliance and improving clinical documentation with AI-powered analysis.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Product</h4>
                <ul className="space-y-2">
                  {['Features', 'Pricing', 'Case Studies', 'Documentation'].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Company</h4>
                <ul className="space-y-2">
                  {['About', 'Team', 'Careers', 'Contact'].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Legal</h4>
                <ul className="space-y-2">
                  {['Privacy', 'Terms', 'Security', 'Compliance'].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Clincerta. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social, i) => (
                <a key={i} href="#" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
