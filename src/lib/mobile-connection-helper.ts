/**
 * Mobile Connection Helper
 * Provides mobile-specific connection detection and optimization
 */

export interface MobileConnectionInfo {
  isMobile: boolean;
  connectionType: string;
  isLowBandwidth: boolean;
  recommendations: string[];
}

export class MobileConnectionHelper {
  static detectMobileConnection(): MobileConnectionInfo {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Try to detect connection type
    let connectionType = "unknown";
    let isLowBandwidth = false;
    const recommendations: string[] = [];

    // Check for Network Information API (limited browser support)
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connectionType = connection.effectiveType || connection.type || "unknown";

        // Detect low bandwidth connections
        if (
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g" ||
          connection.downlink < 1
        ) {
          isLowBandwidth = true;
          recommendations.push(
            "Your connection appears slow. Consider switching to WiFi for better video quality."
          );
        }

        if (connection.effectiveType === "3g") {
          recommendations.push("3G connection detected. Video quality may be limited.");
        }
      }
    }

    // Mobile-specific recommendations
    if (isMobile) {
      recommendations.push("For best results on mobile: Use WiFi when possible");
      recommendations.push("If using mobile data: Try moving to an area with better signal");
      recommendations.push("Close other apps that might be using bandwidth");

      if (isLowBandwidth) {
        recommendations.push("Video quality may be reduced on slow connections");
      }
    }

    return {
      isMobile,
      connectionType,
      isLowBandwidth,
      recommendations,
    };
  }

  static getOptimizedConstraints(connectionInfo: MobileConnectionInfo) {
    const { isMobile, isLowBandwidth } = connectionInfo;

    if (isLowBandwidth) {
      // Ultra-low bandwidth settings
      return {
        video: {
          width: { ideal: 240, max: 320 },
          height: { ideal: 180, max: 240 },
          frameRate: { ideal: 10, max: 15 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 8000,
          channelCount: 1,
        },
      };
    }

    if (isMobile) {
      // Mobile-optimized settings
      return {
        video: {
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 15, max: 20 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      };
    }

    // Desktop settings
    return {
      video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 20, max: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };
  }

  static showMobileGuidance(connectionInfo: MobileConnectionInfo): string[] {
    const guidance: string[] = [];

    if (connectionInfo.isMobile) {
      guidance.push("📱 Mobile Device Detected");

      if (connectionInfo.isLowBandwidth) {
        guidance.push("⚠️ Slow connection detected");
        guidance.push("💡 Try switching to WiFi for better quality");
      }

      guidance.push("🔄 If connection fails, try:");
      guidance.push("• Switch between WiFi and mobile data");
      guidance.push("• Move to an area with better signal");
      guidance.push("• Close other apps using internet");
      guidance.push("• Refresh the page and try again");
    }

    return guidance;
  }
}
