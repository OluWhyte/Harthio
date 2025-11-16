'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { type DailyCheckIn } from '@/lib/checkin-service';
import { format, subDays, startOfDay } from 'date-fns';

interface RecoveryTrackerProps {
  checkIns: DailyCheckIn[];
  streak: number;
}

// Mood to numeric value for charting
const moodToValue = {
  struggling: 1,
  okay: 2,
  good: 3,
  great: 4,
};

const moodToColor = {
  struggling: '#ef4444',
  okay: '#f59e0b',
  good: '#10b981',
  great: '#8b5cf6',
};

const moodToEmoji = {
  struggling: '😢',
  okay: '😐',
  good: '😊',
  great: '🚀',
};

export function RecoveryTracker({ checkIns, streak }: RecoveryTrackerProps) {
  // Prepare data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dateStr = format(date, 'yyyy-MM-dd');
    const checkIn = checkIns.find(c => 
      format(new Date(c.created_at), 'yyyy-MM-dd') === dateStr
    );
    
    return {
      date: format(date, 'EEE'),
      fullDate: dateStr,
      mood: checkIn?.mood || null,
      value: checkIn ? moodToValue[checkIn.mood as keyof typeof moodToValue] : 0,
    };
  });

  // Calculate insights
  const recentCheckIns = checkIns.slice(0, 7);
  const avgMood = recentCheckIns.length > 0
    ? recentCheckIns.reduce((sum, c) => sum + moodToValue[c.mood as keyof typeof moodToValue], 0) / recentCheckIns.length
    : 0;
  
  const lastWeekCheckIns = checkIns.slice(7, 14);
  const lastWeekAvg = lastWeekCheckIns.length > 0
    ? lastWeekCheckIns.reduce((sum, c) => sum + moodToValue[c.mood as keyof typeof moodToValue], 0) / lastWeekCheckIns.length
    : 0;
  
  const trend = avgMood > lastWeekAvg ? 'up' : avgMood < lastWeekAvg ? 'down' : 'stable';
  const trendPercent = lastWeekAvg > 0 ? Math.abs(((avgMood - lastWeekAvg) / lastWeekAvg) * 100).toFixed(0) : 0;

  // Find best and worst days
  const bestDay = recentCheckIns.reduce((best, current) => {
    const currentValue = moodToValue[current.mood as keyof typeof moodToValue];
    const bestValue = best ? moodToValue[best.mood as keyof typeof moodToValue] : 0;
    return currentValue > bestValue ? current : best;
  }, null as DailyCheckIn | null);

  const toughestDay = recentCheckIns.reduce((worst, current) => {
    const currentValue = moodToValue[current.mood as keyof typeof moodToValue];
    const worstValue = worst ? moodToValue[worst.mood as keyof typeof moodToValue] : 5;
    return currentValue < worstValue ? current : worst;
  }, null as DailyCheckIn | null);

  return (
    <div className="space-y-6">
      {/* Mood Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            7-Day Mood Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={[0, 4.5]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={(value) => {
                  const labels = ['', 'Struggling', 'Okay', 'Good', 'Great'];
                  return labels[value] || '';
                }}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    if (!data.mood) return null;
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.fullDate}</p>
                        <p className="text-sm flex items-center gap-2">
                          <span className="text-2xl">{moodToEmoji[data.mood as keyof typeof moodToEmoji]}</span>
                          <span className="capitalize">{data.mood}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trend Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Week</p>
                <p className="text-2xl font-bold">
                  {avgMood > 0 ? avgMood.toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">Average Mood</p>
              </div>
              <div className={`p-3 rounded-full ${
                trend === 'up' ? 'bg-green-500/10' : 
                trend === 'down' ? 'bg-red-500/10' : 
                'bg-gray-500/10'
              }`}>
                {trend === 'up' && <TrendingUp className="h-6 w-6 text-green-500" />}
                {trend === 'down' && <TrendingDown className="h-6 w-6 text-red-500" />}
                {trend === 'stable' && <Minus className="h-6 w-6 text-gray-500" />}
              </div>
            </div>
            {lastWeekAvg > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {trend === 'up' && `↑ ${trendPercent}% from last week`}
                {trend === 'down' && `↓ ${trendPercent}% from last week`}
                {trend === 'stable' && 'Stable from last week'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Best Day */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Best Day</p>
                {bestDay ? (
                  <>
                    <p className="text-2xl mb-1">
                      {moodToEmoji[bestDay.mood as keyof typeof moodToEmoji]}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {format(new Date(bestDay.created_at), 'EEE, MMM d')}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toughest Day */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Toughest Day</p>
                {toughestDay ? (
                  <>
                    <p className="text-2xl mb-1">
                      {moodToEmoji[toughestDay.mood as keyof typeof moodToEmoji]}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {format(new Date(toughestDay.created_at), 'EEE, MMM d')}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Motivational Insight */}
      {recentCheckIns.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-2">Your Progress</p>
                <p className="text-sm text-muted-foreground">
                  {streak > 0 && `You're on a ${streak}-day streak! `}
                  {trend === 'up' && `Your mood has improved ${trendPercent}% this week. Keep up the great work! 💪`}
                  {trend === 'down' && `This week has been tough, but you're still showing up. That takes courage. 🌟`}
                  {trend === 'stable' && `You're maintaining consistency. Every day you check in is a win! ✨`}
                  {recentCheckIns.length < 7 && ` Check in daily to see more insights about your journey.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
