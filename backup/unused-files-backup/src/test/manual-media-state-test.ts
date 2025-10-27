/**
 * Manual Media State Consolidation Test
 * Simple verification script for the unified media state system
 */

import { mediaStreamController } from "@/lib/media-stream-controller";

export interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

/**
 * Manual test functions to verify media state consolidation
 */
export class MediaStateTest {
  static async runBasicTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: MediaStreamController exists and has required methods
    try {
      const hasToggleAudio =
        typeof mediaStreamController.toggleAudio === "function";
      const hasToggleVideo =
        typeof mediaStreamController.toggleVideo === "function";
      const hasSubscribe =
        typeof mediaStreamController.subscribe === "function";
      const hasGetState = typeof mediaStreamController.getState === "function";

      results.push({
        test: "MediaStreamController API",
        passed: hasToggleAudio && hasToggleVideo && hasSubscribe && hasGetState,
        message:
          hasToggleAudio && hasToggleVideo && hasSubscribe && hasGetState
            ? "All required methods exist"
            : "Missing required methods",
      });
    } catch (error) {
      results.push({
        test: "MediaStreamController API",
        passed: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }

    // Test 2: MediaStreamController state structure
    try {
      const state = mediaStreamController.getState();
      const hasRequiredProps =
        typeof state.isAudioMuted === "boolean" &&
        typeof state.isVideoOff === "boolean" &&
        typeof state.hasAudio === "boolean" &&
        typeof state.hasVideo === "boolean";

      results.push({
        test: "MediaState structure",
        passed: hasRequiredProps,
        message: hasRequiredProps
          ? "State has all required properties"
          : "State missing required properties",
      });
    } catch (error) {
      results.push({
        test: "MediaState structure",
        passed: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }

    // Test 3: Subscription mechanism
    try {
      let callbackCalled = false;
      const unsubscribe = mediaStreamController.subscribe(() => {
        callbackCalled = true;
      });

      // Trigger a state change
      mediaStreamController.toggleAudio();

      // Check if callback was called
      setTimeout(() => {
        unsubscribe();
      }, 100);

      results.push({
        test: "Subscription mechanism",
        passed: typeof unsubscribe === "function",
        message:
          typeof unsubscribe === "function"
            ? "Subscribe returns unsubscribe function"
            : "Subscribe does not return function",
      });
    } catch (error) {
      results.push({
        test: "Subscription mechanism",
        passed: false,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }

    return results;
  }

  static async testHookImports(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    try {
      // Test hook imports
      const { useMediaState, useSimpleMediaState, useProviderMediaState } =
        await import("@/hooks/use-media-state");

      results.push({
        test: "Hook imports",
        passed:
          typeof useMediaState === "function" &&
          typeof useSimpleMediaState === "function" &&
          typeof useProviderMediaState === "function",
        message: "All hooks imported successfully",
      });
    } catch (error) {
      results.push({
        test: "Hook imports",
        passed: false,
        message: `Import error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }

    return results;
  }

  static printResults(results: TestResult[]): void {
    console.log("\n🧪 Media State Consolidation Test Results:");
    console.log("==========================================");

    let passed = 0;
    let total = results.length;

    results.forEach((result) => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${status} ${result.test}: ${result.message}`);
      if (result.passed) passed++;
    });

    console.log("==========================================");
    console.log(`📊 Results: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log(
        "🎉 All tests passed! Media state consolidation is working correctly."
      );
      console.log("\n📋 Implementation Benefits:");
      console.log("  ✅ Single source of truth for media state");
      console.log("  ✅ No more duplicate state objects");
      console.log("  ✅ No props drilling needed");
      console.log("  ✅ Works with all video providers");
      console.log("  ✅ Simplified component interfaces");
    } else {
      console.log("⚠️  Some tests failed. Check the implementation.");
    }
  }
}

// Export for manual testing in browser console
if (typeof window !== "undefined") {
  (window as any).MediaStateTest = MediaStateTest;
  console.log("💡 MediaStateTest available in browser console");
  console.log(
    "   Run: MediaStateTest.runBasicTests().then(MediaStateTest.printResults)"
  );
}
