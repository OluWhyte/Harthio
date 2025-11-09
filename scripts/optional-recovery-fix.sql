-- OPTIONAL: Fix false positive recovery alerts
-- Only run this if you want to reduce unnecessary recovery recommendations
-- Your system works perfectly without this fix

-- Update the predict_recovery_need function to be more accurate
CREATE OR REPLACE FUNCTION predict_recovery_need(
  p_session_id UUID,
  p_user_id UUID,
  p_quality_metrics JSONB,
  p_failure_patterns TEXT[]
) RETURNS JSONB AS $$
DECLARE
  latency_ms INTEGER;
  packet_loss DECIMAL;
  should_recover BOOLEAN := false;
  recommendation TEXT := 'none';
BEGIN
  -- Extract metrics safely
  latency_ms := COALESCE((p_quality_metrics->>'latency')::integer, 0);
  packet_loss := COALESCE((p_quality_metrics->>'packetLoss')::decimal, 0);
  
  -- Only recommend recovery for genuinely poor conditions
  IF latency_ms > 800 OR packet_loss > 10 THEN
    should_recover := true;
    recommendation := 'high_latency_detected';
  ELSIF latency_ms > 1200 OR packet_loss > 20 THEN
    should_recover := true;
    recommendation := 'critical_quality_degradation';
  END IF;
  
  RETURN jsonb_build_object(
    'should_recover', should_recover,
    'recommendation', recommendation,
    'confidence', CASE WHEN should_recover THEN 0.8 ELSE 0.2 END,
    'metrics', jsonb_build_object(
      'latency', latency_ms,
      'packet_loss', packet_loss
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Recovery function updated - false positive alerts should be reduced' as result;