import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface LogoProps {
  showBeta?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({
  showBeta = true,
  size = "md",
  className = "",
}: LogoProps) {
  const sizeClasses = {
    sm: { logo: 24, text: "text-lg" },
    md: { logo: 32, text: "text-xl" },
    lg: { logo: 40, text: "text-2xl" },
  };

  const { logo, text } = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.svg"
        alt="Harthio Logo"
        width={logo}
        height={logo}
        priority
      />
      <div className="flex items-center gap-2">
        <span className={`font-headline font-bold ${text}`}>Harthio</span>
        {showBeta && (
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
          >
            BETA
          </Badge>
        )}
      </div>
    </div>
  );
}
