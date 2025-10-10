'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Database } from 'lucide-react';

interface ExportMenuProps {
  onExport: (format: 'csv' | 'json') => Promise<void>;
  disabled?: boolean;
  label?: string;
}

export function ExportMenu({ onExport, disabled = false, label = "Export Data" }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      await onExport(format);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || exporting}>
          <Download className="h-4 w-4 mr-2" />
          {exporting ? 'Exporting...' : label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          CSV Format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <Database className="h-4 w-4 mr-2" />
          JSON Format
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}