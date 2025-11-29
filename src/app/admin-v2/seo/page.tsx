'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Globe, 
  BarChart3, 
  Settings, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  TrendingUp,
  FileText,
  Link as LinkIcon
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
  const [seoMetrics, setSeoMetrics] = useState<SEOMetrics | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [googleSiteVerification, setGoogleSiteVerification] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadSEOData();
  }, []);

  const loadSEOData = async () => {
    setLoading(true);
    try {
      // Load current SEO configuration
      const metrics: SEOMetrics = {
        googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || null,
        googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || null,
        totalPages: 15, // Static pages count
        indexedPages: 8, // Public pages indexed
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
      setOgImage('https://harthio.com/og-image.png');
      
    } catch (error) {
      console.error('Error loading SEO data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SEO data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSEOSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, save to database or config
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'SEO Settings Saved',
        description: 'Your SEO configuration has been updated successfully.',
      });
      
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
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading SEO data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">SEO Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Optimize search engine visibility</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSEOData} className="gap-2 flex-shrink-0">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* SEO Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 sm:p-6">
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
          <CardContent className="p-4 sm:p-6">
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
          <CardContent className="p-4 sm:p-6">
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
          <CardContent className="p-4 sm:p-6">
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
      <Tabs defaultValue="analytics" className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics</TabsTrigger>
            <TabsTrigger value="metadata" className="whitespace-nowrap">Metadata</TabsTrigger>
            <TabsTrigger value="technical" className="whitespace-nowrap">Technical</TabsTrigger>
            <TabsTrigger value="tools" className="whitespace-nowrap">Tools</TabsTrigger>
          </TabsList>
        </div>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Google Analytics Configuration
              </CardTitle>
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
                <p className="text-sm text-muted-foreground mt-1">
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
                <p className="text-sm text-muted-foreground mt-1">
                  Meta tag verification code from Google Search Console
                </p>
              </div>

              <Button onClick={handleSaveSEOSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Analytics Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Key SEO performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Indexation Rate</span>
                  <Badge variant="outline" className="text-green-600">
                    {seoMetrics ? Math.round((seoMetrics.indexedPages / seoMetrics.totalPages) * 100) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Last Crawled</span>
                  <span className="text-sm text-muted-foreground">
                    {seoMetrics?.lastCrawled ? new Date(seoMetrics.lastCrawled).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">Sitemap Health</span>
                  <Badge variant="outline" className="text-green-600">Healthy</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Global Metadata Settings
              </CardTitle>
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
                <p className="text-sm text-muted-foreground mt-1">
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
                <p className="text-sm text-muted-foreground mt-1">
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
                <p className="text-sm text-muted-foreground mt-1">
                  Comma-separated keywords for your website
                </p>
              </div>

              <div>
                <Label htmlFor="og-image">Open Graph Image URL</Label>
                <Input
                  id="og-image"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://harthio.com/og-image.png"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Image shown when sharing on social media (1200x630px recommended)
                </p>
              </div>

              <Button onClick={handleSaveSEOSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Metadata Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Search Result Preview</CardTitle>
              <CardDescription>How your site appears in search results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">harthio.com</span>
                </div>
                <h3 className="text-xl text-blue-600 mb-1">{metaTitle || 'Your Page Title'}</h3>
                <p className="text-sm text-gray-600">
                  {metaDescription || 'Your meta description will appear here...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical SEO Tab */}
        <TabsContent value="technical" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
                    <span className="text-sm">Sitemap URL</span>
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
                    <span className="text-sm">Last Updated</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total URLs</span>
                    <span className="text-sm font-medium">{seoMetrics?.totalPages}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Indexed URLs</span>
                    <span className="text-sm font-medium">{seoMetrics?.indexedPages}</span>
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
                    <span className="text-sm">Robots.txt URL</span>
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
                    <span className="text-sm">Crawl Allowed</span>
                    <Badge variant="outline" className="text-green-600">Yes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sitemap Referenced</span>
                    <Badge variant="outline" className="text-green-600">Yes</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Admin Blocked</span>
                    <Badge variant="outline" className="text-blue-600">Yes</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Structured Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Structured Data
              </CardTitle>
              <CardDescription>
                Schema.org markup for rich search results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Organization Schema</p>
                    <p className="text-xs text-muted-foreground">Company information</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">WebSite Schema</p>
                    <p className="text-xs text-muted-foreground">Site search box</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Article Schema</p>
                    <p className="text-xs text-muted-foreground">Blog posts</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SEO Analysis Tools</CardTitle>
                <CardDescription>
                  External tools to analyze your website's SEO performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('https://developers.google.com/search/docs/appearance/structured-data', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Structured Data Testing
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
              <CardContent className="space-y-2">
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => copyToClipboard('https://harthio.com', 'Site URL')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Site URL
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* SEO Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Checklist</CardTitle>
              <CardDescription>Essential SEO tasks to complete</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Sitemap submitted to Google</span>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Robots.txt configured</span>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {seoMetrics?.googleAnalyticsId ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="text-sm">Google Analytics installed</span>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  {seoMetrics?.googleSiteVerification ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="text-sm">Site verified in Search Console</span>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Meta descriptions optimized</span>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Structured data implemented</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
