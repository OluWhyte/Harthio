# AI Analytics Guide

**Last Updated**: November 29, 2025  
**Status**: Active  

---

## Overview

Comprehensive analytics system for monitoring AI companion usage, effectiveness, and user engagement.

## Features

### 1. Usage Analytics
- Total messages sent
- Messages by user tier
- Peak usage times
- Response times
- Error rates

### 2. Effectiveness Metrics
- User satisfaction ratings
- Crisis detection accuracy
- Intervention success rates
- Conversation completion rates

### 3. User Engagement
- Daily active users
- Average messages per user
- Retention rates
- Feature adoption

## Dashboard

### Location
`/dashboard/ai-analytics` (Admin only)

### Key Metrics
- **Total Conversations**: All-time AI chat sessions
- **Crisis Interventions**: Number of crisis detections
- **Average Rating**: User satisfaction (1-5 stars)
- **Response Time**: Average AI response time

### Charts
- Usage over time (line chart)
- Messages by tier (pie chart)
- Satisfaction trends (area chart)
- Crisis detection rate (bar chart)

## Database Views

### ai_analytics_summary
```sql
CREATE VIEW ai_analytics_summary AS
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_messages,
  AVG(CASE WHEN f.rating IS NOT NULL THEN f.rating END) as avg_rating,
  COUNT(CASE WHEN is_crisis THEN 1 END) as crisis_count
FROM ai_chat_history h
LEFT JOIN ai_feedback f ON h.id = f.chat_id;
```

## API Endpoints

### Get Analytics Summary
```typescript
GET /api/admin/ai-analytics/summary
Response: {
  totalUsers: number,
  totalMessages: number,
  avgRating: number,
  crisisCount: number
}
```

### Get Usage Trends
```typescript
GET /api/admin/ai-analytics/trends?days=30
Response: {
  dates: string[],
  messages: number[],
  users: number[]
}
```

## Monitoring

### Real-time Alerts
- Crisis detection spike
- Error rate increase
- Low satisfaction ratings
- API quota warnings

### Performance Tracking
- Response time monitoring
- API call success rate
- Database query performance
- Cache hit rates

## Reporting

### Daily Reports
- Usage summary
- Crisis interventions
- User feedback
- System health

### Weekly Reports
- Trend analysis
- Feature adoption
- User retention
- Performance metrics

### Monthly Reports
- Comprehensive analytics
- ROI analysis
- User satisfaction
- Strategic insights

## Best Practices

1. **Monitor daily** for anomalies
2. **Review feedback** regularly
3. **Track trends** over time
4. **Set up alerts** for critical metrics
5. **Export data** for deeper analysis

## Troubleshooting

### Common Issues

**Issue**: Missing data in charts
**Solution**: Check database views are up to date

**Issue**: Slow dashboard loading
**Solution**: Add indexes to analytics tables

**Issue**: Incorrect metrics
**Solution**: Verify date range filters

## Future Enhancements

- Predictive analytics
- A/B testing framework
- Custom report builder
- Export to CSV/PDF
- Integration with BI tools

---

For AI companion features, see [AI Companion Guide](./AI_COMPANION_GUIDE.md)
