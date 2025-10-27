# LiveKit Server Dockerfile for Railway
FROM livekit/livekit-server:latest

# Copy configuration
COPY livekit.yaml /etc/livekit.yaml

# Expose ports
EXPOSE 7880 7881 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start LiveKit server
CMD ["livekit-server", "--config", "/etc/livekit.yaml"]