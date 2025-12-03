"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { emailCampaignService, type EmailTemplate, type EmailCampaign } from "@/lib/email-campaign-service";
import {
  Mail,
  Send,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Trash2,
  Plus,
  TestTube,
  Download,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmailCampaignsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // History filters
  const [filterTemplate, setFilterTemplate] = useState<string>("all");
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [exportingAudience, setExportingAudience] = useState(false);
  
  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [fromEmail, setFromEmail] = useState<string>("tosin@harthio.com");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [customContent, setCustomContent] = useState<string>("");
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [customEmails, setCustomEmails] = useState<string>("");
  const [customEmailsList, setCustomEmailsList] = useState<string[]>([]);
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  
  // Confirm send dialog
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (audienceFilter) {
      loadAudienceCount();
    }
  }, [audienceFilter, customEmailsList]);

  useEffect(() => {
    applyFilters();
  }, [campaigns, filterTemplate, filterAudience, filterStatus, filterDateFrom, filterDateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, campaignsData] = await Promise.all([
        emailCampaignService.getTemplates(),
        emailCampaignService.getCampaigns(),
      ]);
      setTemplates(templatesData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load campaign data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAudienceCount = async () => {
    try {
      const count = await emailCampaignService.getAudienceCount(
        audienceFilter,
        audienceFilter === 'custom' ? customEmailsList : undefined
      );
      setAudienceCount(count);
    } catch (error) {
      console.error("Error loading audience count:", error);
    }
  };

  const handleCustomEmailsChange = (value: string) => {
    setCustomEmails(value);
    // Parse emails (comma or newline separated)
    const emails = value
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));
    setCustomEmailsList(emails);
  };

  const handlePreview = () => {
    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    // Replace variables with sample data
    let html = template.html_content;
    html = html.replace(/{{firstName}}/g, "John");
    html = html.replace(/{{appUrl}}/g, process.env.NEXT_PUBLIC_APP_URL || "https://harthio.com");
    html = html.replace(/{{unsubscribeToken}}/g, "sample-token");

    setPreviewHtml(html);
    setShowPreview(true);
  };

  const handleSendCampaign = async () => {
    if (!selectedTemplate || !user) {
      toast({
        title: "Error",
        description: "Please select a template",
        variant: "destructive",
      });
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplate);
    if (!template) return;

    // Validate custom content for custom templates
    const isCustomTemplate = template.name === 'Custom Email (Blank)' || template.name === 'Executive Email (No Unsubscribe)';
    if (isCustomTemplate && (!customSubject || !customContent)) {
      toast({
        title: "Error",
        description: "Please fill in both subject and content for custom email",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      // Create campaign with custom content if applicable
      const { success, campaign, error } = await emailCampaignService.createCampaign({
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        template_id: selectedTemplate,
        from_email: fromEmail,
        subject: customSubject || template.subject,
        audience_filter: audienceFilter,
        created_by: user.uid,
        custom_emails: audienceFilter === 'custom' ? customEmailsList : undefined,
        // custom_html_content: isCustomTemplate ? customContent : undefined, // Not in type
        // custom_text_content: isCustomTemplate ? customContent : undefined, // Not in type
      });

      if (!success || !campaign) {
        throw new Error(error || "Failed to create campaign");
      }

      // Send campaign
      const sendResult = await emailCampaignService.sendCampaign(
        campaign.id,
        audienceFilter === 'custom' ? customEmailsList : undefined
      );

      if (!sendResult.success) {
        throw new Error(sendResult.error || "Failed to send campaign");
      }

      toast({
        title: "Campaign Sent!",
        description: `Email campaign sent to ${audienceCount} users`,
      });

      // Reset form
      setSelectedTemplate("");
      setCustomSubject("");
      setCustomContent("");
      setShowConfirm(false);

      // Reload campaigns
      await loadData();
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send campaign",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const { success } = await emailCampaignService.deleteCampaign(campaignId);
      if (success) {
        toast({
          title: "Campaign Deleted",
          description: "Campaign has been removed",
        });
        await loadData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...campaigns];

    // Filter by template
    if (filterTemplate !== "all") {
      filtered = filtered.filter(c => c.template_id === filterTemplate);
    }

    // Filter by audience
    if (filterAudience !== "all") {
      filtered = filtered.filter(c => c.audience_filter === filterAudience);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    // Filter by date range
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(c => new Date(c.created_at) >= fromDate);
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(c => new Date(c.created_at) <= toDate);
    }

    setFilteredCampaigns(filtered);
  };

  const clearFilters = () => {
    setFilterTemplate("all");
    setFilterAudience("all");
    setFilterStatus("all");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const exportAudienceToCSV = async () => {
    if (!audienceFilter) return;

    try {
      setExportingAudience(true);
      
      // Get the audience users
      const users = await emailCampaignService.getAudienceUsers(
        audienceFilter,
        audienceFilter === 'custom' ? customEmailsList : undefined
      );

      if (users.length === 0) {
        toast({
          title: "No Data",
          description: "No users found for this audience",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = ["Email", "First Name", "Last Name", "Display Name", "Created At", "Unsubscribed"];
      const rows = users.map(user => [
        user.email || "",
        user.first_name || "",
        user.last_name || "",
        user.display_name || "",
        user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
        user.unsubscribed ? "Yes" : "No"
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const audienceLabel = audienceFilter === 'custom' ? 'custom' : audienceFilter;
      const filename = `harthio-audience-${audienceLabel}-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Downloaded ${users.length} users to ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting audience:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export audience data",
        variant: "destructive",
      });
    } finally {
      setExportingAudience(false);
    }
  };

  const exportCampaignRecipientsToCSV = async (campaign: EmailCampaign) => {
    try {
      // Get campaign recipients
      const recipients = await emailCampaignService.getCampaignRecipients(campaign.id);

      if (recipients.length === 0) {
        toast({
          title: "No Data",
          description: "No recipients found for this campaign",
          variant: "destructive",
        });
        return;
      }

      // Create CSV content
      const headers = ["Email", "Status", "Sent At", "Error Message"];
      const rows = recipients.map(recipient => [
        recipient.email || "",
        recipient.status || "",
        recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : "",
        recipient.error_message || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const campaignName = campaign.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `harthio-campaign-${campaignName}-recipients-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Downloaded ${recipients.length} recipients to ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting campaign recipients:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export campaign recipients",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Email Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Send targeted email campaigns to your users
        </p>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">
            <Send className="h-4 w-4 mr-2" />
            Send Campaign
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Campaign History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
              <CardDescription>
                Select a template and audience to send your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{template.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {template.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateData && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplateData.description}
                  </p>
                )}
              </div>

              {/* Custom Content for Custom/Executive Templates */}
              {selectedTemplateData && (selectedTemplateData.name === 'Custom Email (Blank)' || selectedTemplateData.name === 'Executive Email (No Unsubscribe)') && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="customSubjectInput">Email Subject *</Label>
                    <Input
                      id="customSubjectInput"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Enter your email subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customContentInput">Email Content *</Label>
                    <Textarea
                      id="customContentInput"
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      placeholder="Write your email content here..."
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available variables: {'{'}firstName{'}'}, {'{'}email{'}'}, {'{'}appUrl{'}'}
                    </p>
                  </div>
                </div>
              )}

              {/* Audience Selection */}
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test_users">
                      <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4" />
                        Test Users (3 accounts)
                      </div>
                    </SelectItem>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Users
                      </div>
                    </SelectItem>
                    
                    {/* Precise Date Range Filters */}
                    <SelectItem value="new_users_24h">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        New Users (Last 24 Hours)
                      </div>
                    </SelectItem>
                    <SelectItem value="new_users_1_3d">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        New Users (1-3 Days Ago)
                      </div>
                    </SelectItem>
                    <SelectItem value="new_users_3_7d">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        New Users (3-7 Days Ago)
                      </div>
                    </SelectItem>
                    <SelectItem value="new_users_7_30d">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        New Users (7-30 Days Ago)
                      </div>
                    </SelectItem>
                    <SelectItem value="new_users_30plus">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Users (30+ Days Ago)
                      </div>
                    </SelectItem>
                    
                    {/* Activity-based Filters */}
                    <SelectItem value="active_users">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Active Users (Last 30 Days)
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive_users">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Inactive Users (30+ Days)
                      </div>
                    </SelectItem>
                    
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Custom Email List
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {audienceCount} recipients will receive this email
                </p>
              </div>

              {/* Custom Emails Input */}
              {audienceFilter === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-emails">
                    Email Addresses
                  </Label>
                  <Textarea
                    id="custom-emails"
                    placeholder="Enter email addresses (comma or newline separated)&#10;example@email.com, another@email.com&#10;third@email.com"
                    value={customEmails}
                    onChange={(e) => handleCustomEmailsChange(e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    {customEmailsList.length} valid email{customEmailsList.length !== 1 ? 's' : ''} detected
                    {customEmailsList.length > 0 && (
                      <span className="block mt-1 text-xs">
                        Note: Custom emails bypass unsubscribe preferences
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* From Email */}
              <div className="space-y-2">
                <Label htmlFor="from">From Email</Label>
                <Select value={fromEmail} onValueChange={setFromEmail}>
                  <SelectTrigger id="from">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tosin@harthio.com">
                      Tosin (tosin@harthio.com)
                    </SelectItem>
                    <SelectItem value="seyi@harthio.com">
                      Seyi (seyi@harthio.com)
                    </SelectItem>
                    <SelectItem value="Harthio <no-reply@harthio.com>">
                      No Reply (no-reply@harthio.com)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Subject (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Custom Subject (Optional)
                </Label>
                <Input
                  id="subject"
                  placeholder={selectedTemplateData?.subject || "Leave blank to use template subject"}
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!selectedTemplate}
                  className="w-full sm:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Preview</span>
                  <span className="sm:hidden">Preview Email</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={exportAudienceToCSV}
                  disabled={!audienceFilter || audienceCount === 0 || exportingAudience}
                  className="w-full sm:w-auto"
                >
                  {exportingAudience ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Exporting...</span>
                      <span className="sm:hidden">Exporting</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Export Audience</span>
                      <span className="sm:hidden">Export</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!selectedTemplate || audienceCount === 0 || sending}
                  className="w-full sm:w-auto"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Sending...</span>
                      <span className="sm:hidden">Sending</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Send Campaign</span>
                      <span className="sm:hidden">Send</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Filter Campaigns</CardTitle>
                    <CardDescription>
                      Filter by template, audience, status, or date range
                    </CardDescription>
                  </div>
                  {(filterTemplate !== "all" || filterAudience !== "all" || filterStatus !== "all" || filterDateFrom || filterDateTo) && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Template Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="filter-template">Template</Label>
                    <Select value={filterTemplate} onValueChange={setFilterTemplate}>
                      <SelectTrigger id="filter-template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Templates</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Audience Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="filter-audience">Audience</Label>
                    <Select value={filterAudience} onValueChange={setFilterAudience}>
                      <SelectTrigger id="filter-audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Audiences</SelectItem>
                        <SelectItem value="test_users">Test Users</SelectItem>
                        <SelectItem value="new_users_24h">New (24h)</SelectItem>
                        <SelectItem value="new_users_1_3d">New (1-3d)</SelectItem>
                        <SelectItem value="new_users_3_7d">New (3-7d)</SelectItem>
                        <SelectItem value="new_users_7_30d">New (7-30d)</SelectItem>
                        <SelectItem value="new_users_30plus">Users (30+d)</SelectItem>
                        <SelectItem value="active_users">Active Users</SelectItem>
                        <SelectItem value="inactive_users">Inactive Users</SelectItem>
                        <SelectItem value="custom">Custom List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="filter-status">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger id="filter-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="sending">Sending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <Label htmlFor="filter-date-from">From Date</Label>
                    <Input
                      id="filter-date-from"
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                    />
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label htmlFor="filter-date-to">To Date</Label>
                    <Input
                      id="filter-date-to"
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Results Summary */}
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>
                      Showing {filteredCampaigns.length} of {campaigns.length} campaigns
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign List */}
            {filteredCampaigns.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {campaigns.length === 0 ? "No campaigns yet" : "No campaigns match your filters"}
                  </h3>
                  <p className="text-muted-foreground">
                    {campaigns.length === 0 
                      ? "Your sent campaigns will appear here"
                      : "Try adjusting your filters to see more results"
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCampaigns.map((campaign) => {
                const template = templates.find(t => t.id === campaign.template_id);
                return (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg break-words">{campaign.name}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm break-words">
                            From: {campaign.from_email} • {campaign.subject}
                          </CardDescription>
                          {template && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {template.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {campaign.audience_filter.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge
                            variant={
                              campaign.status === "sent"
                                ? "default"
                                : campaign.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportCampaignRecipientsToCSV(campaign)}
                            title="Export recipients"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            title="Delete campaign"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Recipients</p>
                          <p className="font-semibold">{campaign.total_recipients}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Sent</p>
                          <p className="font-semibold text-green-600">
                            {campaign.sent_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Failed</p>
                          <p className="font-semibold text-red-600">
                            {campaign.failed_count}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-muted-foreground text-xs">Date & Time</p>
                          <p className="font-semibold text-xs sm:text-sm">
                            {new Date(campaign.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[98vw] max-w-6xl h-[95vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              This is how your email will look to recipients
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div
              className="border rounded-lg p-4 bg-white min-h-full"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this campaign?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Template:</strong> {selectedTemplateData?.name}
            </p>
            <p className="text-sm">
              <strong>From:</strong> {fromEmail}
            </p>
            <p className="text-sm">
              <strong>Recipients:</strong> {audienceCount} users
            </p>
            <p className="text-sm">
              <strong>Subject:</strong> {customSubject || selectedTemplateData?.subject}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendCampaign} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
