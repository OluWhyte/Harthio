/**
 * TURN Server Diagnostic Tool
 * Detailed testing and debugging for TURN server connectivity
 */

export interface TURNServerConfig {
  urls: string;
  username: string;
  credential: string;
  name?: string;
}

export interface TURNTestResult {
  server: string;
  success: boolean;
  relayFound: boolean;
  candidatesFound: number;
  relayCandidates: string[];
  srflxCandidates: string[];
  hostCandidates: string[];
  error?: string;
  duration: number;
  iceGatheringState: string;
}

export class TURNServerDiagnostic {
  /**
   * Test a single TURN server with detailed logging
   */
  async testTURNServer(config: TURNServerConfig): Promise<TURNTestResult> {
    const startTime = Date.now();
    const result: TURNTestResult = {
      server: config.urls,
      success: false,
      relayFound: false,
      candidatesFound: 0,
      relayCandidates: [],
      srflxCandidates: [],
      hostCandidates: [],
      duration: 0,
      iceGatheringState: 'new'
    };

    console.log(`\n🧪 Testing TURN Server: ${config.name || config.urls}`);
    console.log(`   URL: ${config.urls}`);
    console.log(`   Username: ${config.username}`);
    console.log(`   Credential: ${config.credential ? '***' + config.credential.slice(-4) : 'none'}`);

    return new Promise((resolve) => {
      let pc: RTCPeerConnection | null = null;
      
      try {
        pc = new RTCPeerConnection({
          iceServers: [{
            urls: config.urls,
            username: config.username,
            credential: config.credential
          }],
          iceCandidatePoolSize: 10
        });

        const timeout = setTimeout(() => {
          result.duration = Date.now() - startTime;
          result.iceGatheringState = pc?.iceGatheringState || 'unknown';
          
          console.log(`\n⏱️ Timeout reached for ${config.urls}`);
          console.log(`   Candidates found: ${result.candidatesFound}`);
          console.log(`   Relay candidates: ${result.relayCandidates.length}`);
          console.log(`   SRFLX candidates: ${result.srflxCandidates.length}`);
          console.log(`   Host candidates: ${result.hostCandidates.length}`);
          console.log(`   ICE gathering state: ${result.iceGatheringState}`);
          
          if (pc) {
            pc.close();
          }
          resolve(result);
        }, 12000);

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            result.candidatesFound++;
            const candidate = event.candidate.candidate;
            
            console.log(`   📡 Candidate #${result.candidatesFound}:`, candidate.substring(0, 80));
            
            if (candidate.includes('typ relay')) {
              result.relayCandidates.push(candidate);
              result.relayFound = true;
              result.success = true;
              console.log(`   ✅ RELAY candidate found!`);
            } else if (candidate.includes('typ srflx')) {
              result.srflxCandidates.push(candidate);
              console.log(`   📍 SRFLX candidate (server reflexive)`);
            } else if (candidate.includes('typ host')) {
              result.hostCandidates.push(candidate);
              console.log(`   🏠 HOST candidate (local)`);
            }
          } else {
            // ICE gathering complete
            result.duration = Date.now() - startTime;
            result.iceGatheringState = pc?.iceGatheringState || 'complete';
            
            console.log(`\n✅ ICE gathering complete for ${config.urls}`);
            console.log(`   Total candidates: ${result.candidatesFound}`);
            console.log(`   Relay: ${result.relayCandidates.length}`);
            console.log(`   SRFLX: ${result.srflxCandidates.length}`);
            console.log(`   Host: ${result.hostCandidates.length}`);
            console.log(`   Duration: ${result.duration}ms`);
            
            clearTimeout(timeout);
            if (pc) {
              pc.close();
            }
            resolve(result);
          }
        };

        pc.onicegatheringstatechange = () => {
          const state = pc?.iceGatheringState || 'unknown';
          console.log(`   🔄 ICE gathering state: ${state}`);
          result.iceGatheringState = state;
        };

        pc.oniceconnectionstatechange = () => {
          console.log(`   🔗 ICE connection state: ${pc?.iceConnectionState}`);
        };

        // Create offer to start ICE gathering
        pc.createDataChannel('test');
        pc.createOffer()
          .then(offer => {
            console.log(`   📤 Offer created, starting ICE gathering...`);
            return pc!.setLocalDescription(offer);
          })
          .catch(error => {
            result.error = error.message;
            result.duration = Date.now() - startTime;
            console.error(`   ❌ Failed to create offer:`, error);
            clearTimeout(timeout);
            if (pc) {
              pc.close();
            }
            resolve(result);
          });

      } catch (error: any) {
        result.error = error.message;
        result.duration = Date.now() - startTime;
        console.error(`   ❌ Exception:`, error);
        if (pc) {
          pc.close();
        }
        resolve(result);
      }
    });
  }

  /**
   * Test all configured TURN servers
   */
  async testAllTURNServers(): Promise<TURNTestResult[]> {
    const servers: TURNServerConfig[] = [];

    // ExpressTURN
    if (process.env.NEXT_PUBLIC_EXPRESSTURN_URL) {
      const url = process.env.NEXT_PUBLIC_EXPRESSTURN_URL;
      servers.push({
        name: 'ExpressTURN (Premium)',
        urls: url.startsWith('turn:') || url.startsWith('turns:') ? url : `turn:${url}`,
        username: process.env.NEXT_PUBLIC_EXPRESSTURN_USERNAME || '',
        credential: process.env.NEXT_PUBLIC_EXPRESSTURN_PASSWORD || ''
      });
    }

    // Free TURN servers
    servers.push(
      {
        name: 'OpenRelay (Free)',
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        name: 'OpenRelay TCP (Free)',
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        name: 'Relay Backups (Free)',
        urls: 'turn:relay.backups.cz:3478',
        username: 'webrtc',
        credential: 'webrtc'
      }
    );

    console.log(`\n🔬 TURN Server Diagnostic Test`);
    console.log(`   Testing ${servers.length} servers...`);
    console.log(`   This may take up to ${servers.length * 12} seconds\n`);

    const results: TURNTestResult[] = [];
    
    // Test servers sequentially for clearer logging
    for (const server of servers) {
      const result = await this.testTURNServer(server);
      results.push(result);
    }

    // Summary
    console.log(`\n📊 TURN Server Test Summary`);
    console.log(`   Total servers tested: ${results.length}`);
    console.log(`   Successful: ${results.filter(r => r.success).length}`);
    console.log(`   Failed: ${results.filter(r => !r.success).length}`);
    console.log(`\n   Details:`);
    
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${servers[index].name}`);
      console.log(`      Relay candidates: ${result.relayCandidates.length}`);
      console.log(`      Total candidates: ${result.candidatesFound}`);
      console.log(`      Duration: ${result.duration}ms`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    return results;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(results: TURNTestResult[]): string[] {
    const recommendations: string[] = [];
    const successfulServers = results.filter(r => r.success);

    if (successfulServers.length === 0) {
      recommendations.push('❌ No TURN servers are reachable. Video calls may fail on restrictive networks.');
      recommendations.push('🔧 Check your firewall settings - TURN requires UDP ports 3478, 5349 and TCP port 443.');
      recommendations.push('🔧 Verify TURN server credentials are correct.');
      recommendations.push('🔧 Test from a different network to rule out local firewall issues.');
    } else if (successfulServers.length < results.length / 2) {
      recommendations.push('⚠️ Only some TURN servers are reachable. Consider adding more fallback servers.');
      recommendations.push('🔧 Check credentials for failed servers.');
    } else {
      recommendations.push('✅ TURN servers are working! Video calls should work on restrictive networks.');
    }

    // Check for specific issues
    const noRelayCandidates = results.filter(r => r.candidatesFound > 0 && r.relayCandidates.length === 0);
    if (noRelayCandidates.length > 0) {
      recommendations.push('⚠️ Some servers found candidates but no relay candidates. This may indicate authentication issues.');
    }

    const timeouts = results.filter(r => r.duration >= 11000);
    if (timeouts.length > 0) {
      recommendations.push('⚠️ Some tests timed out. This may indicate network connectivity issues or server problems.');
    }

    return recommendations;
  }
}

// Export singleton instance
export const turnDiagnostic = new TURNServerDiagnostic();