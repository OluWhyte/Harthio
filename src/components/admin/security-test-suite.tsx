'use client';

/**
 * OWASP Security Test Suite
 * Tests security implementations and OWASP compliance
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { InputSanitizer, RateLimiter } from '@/lib/security/owasp-security-service';
import { Shield, AlertTriangle, CheckCircle, XCircle, Play } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export function SecurityTestSuite() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [testInput, setTestInput] = useState('');

  const runSecurityTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Input Sanitization (A03: Injection)
      const xssPayload = '<script>alert("XSS")</script>';
      const sanitized = InputSanitizer.sanitizeHTML(xssPayload);
      testResults.push({
        name: 'XSS Prevention (A03)',
        status: sanitized.includes('<script>') ? 'fail' : 'pass',
        message: sanitized.includes('<script>') 
          ? 'XSS payload not sanitized' 
          : 'XSS payload successfully sanitized',
        details: `Input: ${xssPayload} → Output: ${sanitized}`
      });

      // Test 2: Email Validation
      const validEmail = InputSanitizer.isValidEmail('test@example.com');
      const invalidEmail = InputSanitizer.isValidEmail('invalid-email');
      testResults.push({
        name: 'Email Validation',
        status: validEmail && !invalidEmail ? 'pass' : 'fail',
        message: validEmail && !invalidEmail 
          ? 'Email validation working correctly' 
          : 'Email validation failed',
        details: `Valid: ${validEmail}, Invalid: ${invalidEmail}`
      });

      // Test 3: Rate Limiting (A07: Authentication Failures)
      const testId = 'security-test-' + Date.now();
      let rateLimitHit = false;
      
      // Try to trigger rate limit
      for (let i = 0; i < 6; i++) {
        if (RateLimiter.isRateLimited(testId, 5, 60000)) {
          rateLimitHit = true;
          break;
        }
      }
      
      testResults.push({
        name: 'Rate Limiting (A07)',
        status: rateLimitHit ? 'pass' : 'warning',
        message: rateLimitHit 
          ? 'Rate limiting activated after 5 attempts' 
          : 'Rate limiting not triggered (may need more attempts)',
        details: `Test ID: ${testId}`
      });

      // Test 4: Filename Sanitization (Path Traversal)
      const maliciousFilename = '../../../etc/passwd';
      const safeFilename = InputSanitizer.sanitizeFilename(maliciousFilename);
      testResults.push({
        name: 'Path Traversal Prevention',
        status: safeFilename.includes('../') ? 'fail' : 'pass',
        message: safeFilename.includes('../') 
          ? 'Path traversal not prevented' 
          : 'Path traversal successfully prevented',
        details: `Input: ${maliciousFilename} → Output: ${safeFilename}`
      });

      // Test 5: SQL Injection Prevention
      const sqlPayload = "'; DROP TABLE users; --";
      const sqlSanitized = InputSanitizer.sanitizeSQL(sqlPayload);
      testResults.push({
        name: 'SQL Injection Prevention (A03)',
        status: sqlSanitized.includes('DROP') || sqlSanitized.includes(';') ? 'fail' : 'pass',
        message: sqlSanitized.includes('DROP') || sqlSanitized.includes(';')
          ? 'SQL injection payload not fully sanitized'
          : 'SQL injection payload sanitized',
        details: `Input: ${sqlPayload} → Output: ${sqlSanitized}`
      });

      // Test 6: Security Headers Check
      try {
        const response = await fetch('/api/security-headers');
        const data = await response.json();
        
        if (data.success && data.headers) {
          const headers = data.headers;
          const hasXFrameOptions = headers['X-Frame-Options'];
          const hasXSSProtection = headers['X-XSS-Protection'];
          const hasContentTypeOptions = headers['X-Content-Type-Options'];
          const hasReferrerPolicy = headers['Referrer-Policy'];
          
          const headerCount = [hasXFrameOptions, hasXSSProtection, hasContentTypeOptions].filter(Boolean).length;
          
          testResults.push({
            name: 'Security Headers (A05)',
            status: headerCount >= 3 ? 'pass' : headerCount >= 1 ? 'warning' : 'fail',
            message: `${headerCount}/3 critical security headers configured`,
            details: `X-Frame-Options: ${hasXFrameOptions || 'Missing'}, X-XSS-Protection: ${hasXSSProtection || 'Missing'}, X-Content-Type-Options: ${hasContentTypeOptions || 'Missing'}, Referrer-Policy: ${hasReferrerPolicy || 'Missing'}`
          });
        } else {
          throw new Error('Invalid response from security headers endpoint');
        }
      } catch (error) {
        testResults.push({
          name: 'Security Headers (A05)',
          status: 'warning',
          message: 'Could not check security headers',
          details: error instanceof Error ? error.message : 'Headers check failed'
        });
      }

      // Test 7: Custom Input Test
      if (testInput) {
        const customSanitized = InputSanitizer.sanitizeHTML(testInput);
        testResults.push({
          name: 'Custom Input Test',
          status: customSanitized !== testInput ? 'pass' : 'warning',
          message: customSanitized !== testInput 
            ? 'Input was sanitized' 
            : 'Input unchanged (may be safe)',
          details: `Input: ${testInput} → Output: ${customSanitized}`
        });
      }

    } catch (error) {
      testResults.push({
        name: 'Test Suite Error',
        status: 'fail',
        message: 'Error running security tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>;
    }
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            OWASP Security Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Input Test (Optional)</label>
            <Textarea
              placeholder="Enter text to test input sanitization (e.g., <script>alert('test')</script>)"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={3}
            />
          </div>
          
          <Button 
            onClick={runSecurityTests} 
            disabled={testing}
            className="w-full"
          >
            <Play className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Running Security Tests...' : 'Run OWASP Security Tests'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{passCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{failCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{result.name}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    {result.details && (
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700">
                          Show details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {result.details}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
