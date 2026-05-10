/**
 * WHIP (WebRTC-HTTP Ingest Protocol) Client
 *
 * Enables browser-based live streaming via WebRTC to a MediaMTX server.
 * MediaMTX receives the WebRTC stream and converts it to HLS for viewers.
 *
 * Flow:
 * 1. Browser captures camera/mic via getUserMedia
 * 2. Creates RTCPeerConnection and adds media tracks
 * 3. Generates SDP offer and waits for ICE gathering
 * 4. POSTs SDP offer to WHIP endpoint
 * 5. Receives SDP answer from server
 * 6. WebRTC connection established - video flows to server
 * 7. Server (MediaMTX) generates HLS for viewers
 */

export class WHIPClient {
  private pc: RTCPeerConnection | null = null
  private resourceUrl: string | null = null
  private iceGatheringTimeout: ReturnType<typeof setTimeout> | null = null
  private onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null

  constructor(options?: { onConnectionStateChange?: (state: RTCPeerConnectionState) => void }) {
    this.onConnectionStateChange = options?.onConnectionStateChange || null
  }

  /**
   * Publish a MediaStream to a WHIP endpoint
   * @param stream - The MediaStream from getUserMedia
   * @param whipEndpoint - The WHIP URL (e.g., /whip/main)
   * @param iceServers - Optional ICE servers for NAT traversal
   */
  async publish(
    stream: MediaStream,
    whipEndpoint: string,
    iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
  ): Promise<void> {
    // Clean up any existing connection
    await this.stop()

    // Create RTCPeerConnection
    this.pc = new RTCPeerConnection({
      iceServers,
      bundlePolicy: 'max-bundle',
      iceCandidatePolicy: 'all',
    })

    // Monitor connection state
    this.pc.onconnectionstatechange = () => {
      if (this.pc && this.onConnectionStateChange) {
        this.onConnectionStateChange(this.pc.connectionState)
      }
    }

    // Add all tracks from the stream
    stream.getTracks().forEach((track) => {
      if (this.pc) {
        this.pc.addTrack(track, stream)
      }
    })

    // Create SDP offer
    const offer = await this.pc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false,
    })

    await this.pc.setLocalDescription(offer)

    // Wait for ICE gathering to complete (with timeout)
    await this.waitForIceGathering(5000)

    // Get the full SDP with ICE candidates
    const fullOffer = this.pc.localDescription
    if (!fullOffer) {
      throw new Error('Failed to create SDP offer')
    }

    // POST to WHIP endpoint
    const response = await fetch(whipEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
      },
      body: fullOffer.sdp,
    })

    if (response.status !== 201) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`WHIP publish failed (${response.status}): ${errorText}`)
    }

    // Store resource URL for later DELETE (to cleanly stop the stream)
    const location = response.headers.get('Location')
    if (location) {
      // Handle relative URLs
      if (location.startsWith('/')) {
        const baseUrl = new URL(whipEndpoint, window.location.origin)
        this.resourceUrl = `${baseUrl.origin}${location}`
      } else {
        this.resourceUrl = location
      }
    }

    // Parse SDP answer
    const answerSdp = await response.text()
    await this.pc.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp,
    })
  }

  /**
   * Stop publishing and clean up resources
   */
  async stop(): Promise<void> {
    // Send DELETE to WHIP resource to cleanly stop
    if (this.resourceUrl) {
      try {
        await fetch(this.resourceUrl, { method: 'DELETE' })
      } catch {
        // Ignore errors on cleanup
      }
      this.resourceUrl = null
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close()
      this.pc = null
    }

    // Clear timeout
    if (this.iceGatheringTimeout) {
      clearTimeout(this.iceGatheringTimeout)
      this.iceGatheringTimeout = null
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): RTCPeerConnectionState | null {
    return this.pc?.connectionState || null
  }

  /**
   * Check if currently publishing
   */
  isPublishing(): boolean {
    return this.pc !== null && this.pc.connectionState === 'connected'
  }

  /**
   * Wait for ICE gathering to complete with a timeout
   */
  private waitForIceGathering(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.pc) {
        resolve()
        return
      }

      // Already complete
      if (this.pc.iceGatheringState === 'complete') {
        resolve()
        return
      }

      const onStateChange = () => {
        if (this.pc?.iceGatheringState === 'complete') {
          if (this.iceGatheringTimeout) {
            clearTimeout(this.iceGatheringTimeout)
            this.iceGatheringTimeout = null
          }
          this.pc.removeEventListener('icegatheringstatechange', onStateChange)
          resolve()
        }
      }

      this.pc.addEventListener('icegatheringstatechange', onStateChange)

      // Timeout fallback - use whatever candidates we have
      this.iceGatheringTimeout = setTimeout(() => {
        if (this.pc) {
          this.pc.removeEventListener('icegatheringstatechange', onStateChange)
        }
        resolve()
      }, timeoutMs)
    })
  }
}
