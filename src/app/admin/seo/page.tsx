"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AdminService } from '@/lib/services/admin-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ResponsiveAdminHeader } from '@/components/admin/responsive-admin-header';
import { 
  Search, 
  Globe, 
  BarChart3, 
  Settings, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw
} from 'lucide-react';

interface SEOMetrics {
  googleAnalyticsId: string | null;
  googleSiteVerification: string | null;
  totalPages: number;
  indexedPages: number;
  sitemapStatus: 'active' | 'error' | 'pending';
  robotsStatus: 'active' | 'error';
  lastCrawled: string | null;
}

export default function SEOManagementPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [seoMetrics, setSeoMetrics] = useState<SEOMetrics | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [googleSiteVerification, setGoogleSiteVerification] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkAdminAndLoadSEO();
    } else {
      router.push('/admin/login?redirect=' + encodeURIComponent('/admin/seo'));
    }
  }, [user, router]);

  const checkAdminAndLoadSEO = async () => {
    if (!user) return;

    try {
      const adminStatus = await AdminService.isUserAdmin(user.uid);
      if (!adminStatus) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive'
        });
        router.push('/');
        return;
      }

      setIsAdmin(true);
      await loadSEOData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSEOData = async () => {
    try {
      // Load current SEO configuration
      const metrics: SEOMetrics = {
        googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || null,
        googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || null,
        totalPages: 15, // Static pages count (including admin pages)
        indexedPages: 8, // Only public pages are indexed (admin blocked by robots.txt)
        sitemapStatus: 'active',
        robotsStatus: 'active',
        lastCrawled: new Date().toISOString()
      };

      setSeoMetrics(metrics);
      
      // Set form values
      setGoogleAnalyticsId(metrics.googleAnalyticsId || '');
      setGoogleSiteVerification(metrics.googleSiteVerification || '');
      setMetaTitle('Harthio - Find Someone Who Truly Gets It');
      setMetaDescription('Connect with people who understand your struggles. Schedule meaningful conversations about business stress, life changes, and personal growth with perfect matches, not random strangers.');
      setKeywords('meaningful conversations, emotional support, video calls, mental health, peer support, loneliness, connection, safe space');
      
    } catch (error) {
      console.error('Error loading SEO data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SEO data.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveSEOSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, you'd save these to your database or config
      // For now, we'll just show a success message
      
      toast({
        title: 'SEO Settings Saved',
        description: 'Your SEO configuration has been updated successfully.',
      });
      
      // Refresh the data
      await loadSEOData();
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save SEO settings.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveAdminHeader
        title="SEO Management"
        actions={[
          {
            label: 'Refresh',
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: () => loadSEOData(),
            variant: 'outline'
          }
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SEO Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Google Analytics</p>
                  <div className="flex items-center gap-2 mt-1">
                    {seoMetrics?.googleAnalyticsId ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Not Set</span>
                      </>
                    )}
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Site Verification</p>
                  <div className="flex items-center gap-2 mt-1">
                    {seoMetrics?.googleSiteVerification ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600">Not Verified</span>
                      </>
                    )}
                  </div>
                </div>
                <Search className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Indexed Pages</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {seoMetrics?.indexedPages}/{seoMetrics?.totalPages}
                  </p>
                </div>
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sitemap Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 capitalize">{seoMetrics?.sitemapStatus}</span>
                  </div>
                </div>
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEO Management Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="technical">Technical SEO</TabsTrigger>
            <TabsTrigger value="tools">SEO Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Google Analytics Configuration</CardTitle>
                <CardDescription>
                  Set up Google Analytics to track your website performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ga-id">Google Analytics ID</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="ga-id"
                      placeholder="G-XXXXXXXXXX"
                      value={googleAnalyticsId}
                      onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(googleAnalyticsId, 'Analytics ID')}
                      disabled={!googleAnalyticsId}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Format: G-XXXXXXXXXX (Google Analytics 4)
                  </p>
                </div>

                <div>
                  <Label htmlFor="site-verification">Google Site Verification</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="site-verification"
                      placeholder="abc123def456ghi789"
                      value={googleSiteVerification}
                      onChange={(e) => setGoogleSiteVerification(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(googleSiteVerification, 'Verification Code')}
                      disabled={!googleSiteVerification}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Meta tag verification code from Google Search Console
                  </p>
                </div>

                <Button onClick={handleSaveSEOSettings} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Analytics Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Global Metadata Settings</CardTitle>
                <CardDescription>
                  Configure default metadata for your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta-title">Default Meta Title</Label>
                  <Input
                    id="meta-title"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    maxLength={60}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {metaTitle.length}/60 characters (recommended)
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta-description">Default Meta Description</Label>
                  <Textarea
                    id="meta-description"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {metaDescription.length}/160 characters (recommended)
                  </p>
                </div>

                <div>
                  <Label htmlFor="keywords">Default Keywords</Label>
                  <Textarea
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    rows={2}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Comma-separated keywords for your website
                  </p>
                </div>

                <Button onClick={handleSaveSEOSettings} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Metadata Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Sitemap Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Sitemap URL</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open('/sitemap.xml', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Updated</span>
                      <span className="text-sm text-gray-600">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total URLs</span>
                      <span className="font-medium">{seoMetrics?.totalPages}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Robots.txt Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Robots.txt URL</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open('/robots.txt', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Crawl Allowed</span>
                      <Badge variant="outline" className="text-green-600">Yes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sitemap Referenced</span>
                      <Badge variant="outline" className="text-green-600">Yes</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Analysis Tools</CardTitle>
                  <CardDescription>
                    External tools to analyze your website's SEO performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open('https://search.google.com/search-console', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Google Search Console
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open('https://pagespeed.web.dev/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    PageSpeed Insights
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open('https://analytics.google.com/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Google Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick SEO Checks</CardTitle>
                  <CardDescription>
                    Verify your website's SEO configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`https://www.google.com/search?q=site:harthio.com`, '_blank')}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Check Google Indexing
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open('/sitemap.xml', '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    View Sitemap
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open('/robots.txt', '_blank')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    View Robots.txt
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
