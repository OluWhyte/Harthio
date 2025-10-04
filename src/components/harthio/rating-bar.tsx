
'use client';

import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface RatingBarProps {
    label: string;
    average: number;
    description: string;
}

export function RatingBar({ label, average, description }: RatingBarProps) {
    const progressValue = (average / 10) * 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{label}</span>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">{average.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/ 10</span>
                </div>
            </div>
            <Progress value={progressValue} className="h-2" />
        </div>
    );
}
