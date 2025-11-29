'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalyticsExportProps {
  data: any;
  dateRange: { from: Date; to: Date };
}

export function AnalyticsExport({ data, dateRange }: AnalyticsExportProps) {
  const exportToCSV = () => {
    if (!data) return;

    const csvData = [
      ['Harthio Analytics Report'],
      [`Period: ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`],
      [''],
      ['Metric', 'Value'],
      ['Total Users', data.users?.total || 0],
      ['New Users', data.users?.new || 0],
      ['Total Sessions', data.sessions?.total || 0],
      ['Active Trackers', data.trackers?.active || 0],
      ['Total Trackers', data.trackers?.total || 0],
      ['AI Chats', data.aiChats?.total || 0],
      ['Messages', data.messages?.total || 0],
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `harthio-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Harthio Analytics Report', 14, 20);
    
    // Date Range
    doc.setFontSize(12);
    doc.text(`Period: ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`, 14, 30);

    
    // Summary Table
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', data.users?.total || 0],
        ['New Users', data.users?.new || 0],
        ['Total Sessions', data.sessions?.total || 0],
        ['Active Trackers', data.trackers?.active || 0],
        ['Total Trackers', data.trackers?.total || 0],
        ['AI Chats', data.aiChats?.total || 0],
        ['Messages', data.messages?.total || 0],
      ],
    });

    doc.save(`harthio-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
