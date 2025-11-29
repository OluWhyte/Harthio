'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Trash2, Filter, Mail } from 'lucide-react';
import type { EmailCampaign, EmailTemplate } from '@/lib/email-campaign-service';

interface CampaignHistoryProps {
  campaigns: EmailCampaign[];
  templates: EmailTemplate[];
  filterTemplate: string;
  filterAudience: string;
  filterStatus: string;
  filterDateFrom: string;
  filterDateTo: string;
  onFilterTemplateChange: (value: string) => void;
  onFilterAudienceChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onFilterDateFromChange: (value: string) => void;
  onFilterDateToChange: (value: string) => void;
  onClearFilters: () => void;
  onExportRecipients: (campaign: EmailCampaign) => void;
  onDeleteCampaign: (campaignId: string) => void;
}

export function CampaignHistory({
  campaigns,
  templates,
  filterTemplate,
  filterAudience,
  filterStatus,
  filterDateFrom,
  filterDateTo,
  onFilterTemplateChange,
  onFilterAudienceChange,
  onFilterStatusChange,
  onFilterDateFromChange,
  onFilterDateToChange,
  onClearFilters,
  onExportRecipients,
  onDeleteCampaign
}: CampaignHistoryProps) {
  const hasActiveFilters = filterTemplate !== "all" || filterAudience !== "all" || 
                          filterStatus !== "all" || filterDateFrom || filterDateTo;

  return (
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
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-template">Template</Label>
              <Select value={filterTemplate} onValueChange={onFilterTemplateChange}>
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

            <div className="space-y-2">
              <Label htmlFor="filter-audience">Audience</Label>
              <Select value={filterAudience} onValueChange={onFilterAudienceChange}>
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

            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={onFilterStatusChange}>
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

            <div className="space-y-2">
              <Label htmlFor="filter-date-from">From Date</Label>
              <Input
                id="filter-date-from"
                type="date"
                value={filterDateFrom}
                onChange={(e) => onFilterDateFromChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-date-to">To Date</Label>
              <Input
                id="filter-date-to"
                type="date"
                value={filterDateTo}
                onChange={(e) => onFilterDateToChange(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Showing {campaigns.length} campaigns</span>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground">
              {hasActiveFilters ? "Try adjusting your filters" : "Your sent campaigns will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        campaigns.map((campaign) => {
          const template = templates.find(t => t.id === campaign.template_id);
          return (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>
                      From: {campaign.from_email} • {campaign.subject}
                    </CardDescription>
                    {template && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {campaign.audience_filter.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
                      onClick={() => onExportRecipients(campaign)}
                      title="Export recipients"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteCampaign(campaign.id)}
                      title="Delete campaign"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Recipients</p>
                    <p className="font-semibold">{campaign.total_recipients}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sent</p>
                    <p className="font-semibold text-green-600">{campaign.sent_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failed</p>
                    <p className="font-semibold text-red-600">{campaign.failed_count}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
