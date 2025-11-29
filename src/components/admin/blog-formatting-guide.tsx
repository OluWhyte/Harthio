import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export function BlogFormattingGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          Formatting Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-gray-900 mb-1">Main Heading</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">## Your Heading</code>
          <p className="text-xs text-gray-600 mt-1">Use at the start of a line for major sections</p>
        </div>
        
        <div>
          <p className="font-medium text-gray-900 mb-1">Subheading</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">### Your Subheading</code>
          <p className="text-xs text-gray-600 mt-1">Use for subsections within a section</p>
        </div>
        
        <div>
          <p className="font-medium text-gray-900 mb-1">Links</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs">[link text](url)</code>
          <p className="text-xs text-gray-600 mt-1">
            Internal: <code className="text-xs">[Sign up](/signup)</code><br />
            External: <code className="text-xs">[Twitter](https://twitter.com/harthio_)</code>
          </p>
        </div>
        
        <div>
          <p className="font-medium text-gray-900 mb-1">Paragraphs</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-xs block">Just write normally.
Each line break creates a new paragraph.</code>
          <p className="text-xs text-gray-600 mt-1">No special syntax needed</p>
        </div>

        <div className="pt-3 border-t">
          <p className="font-medium text-gray-900 mb-2">Example:</p>
          <code className="bg-gray-100 px-3 py-2 rounded text-xs block whitespace-pre-wrap">
{`## Introduction
Welcome to [Harthio](/signup)!

### Getting Started
Visit our [signup page](/signup) to begin.

Check out our [Twitter](https://twitter.com/harthio_) for updates.`}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
