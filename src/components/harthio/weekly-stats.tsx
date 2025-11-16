'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Clock, Award } from 'lucide-react';
import { type DailyCheckIn } from '@/lib/checkin-service';
import { startOfWeek, endOfWeek, format, isWithinInterval, differenceInMinutes } from 'date-fns';

interface WeeklyStatsProps {
  checkIns: DailyCheckIn[];
  sessionsJoined: number;
  sessionHistory: any[];
}

const moodToValue = {
  struggling: 1,
  okay: 2,
  good: 3,
  great: 4,
};

const moodColors = {
  struggling: '#ef4444',
  okay: '#f59e0b',
  good: '#10b981',
  great: '#8b5cf6',
};

export function WeeklyStats({ checkIns, sessionsJoined, sessionHistory }: WeeklyStatsProps) {
  // Get this week's data
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  const thisWeekCheckIns = checkIns.filter(checkIn => 
    isWithinInterval(new Date(checkIn.created_at), { start: weekStart, end: weekEnd })
  );

  const thisWeekSessions = sessionHistory.filter(session =>
    isWithinInterval(new Date(session.end_time), { start: weekStart, end: weekEnd })
  );

  // Calculate mood distribution
  const moodDistribution = thisWeekCheckIns.reduce((acc, checkIn) => {
    const mood = checkIn.mood;
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodData = Object.entries(moodDistribution).map(([mood, count]) => ({
    name: mood.charAt(0).toUpperCase() + mood.slice(1),
    value: count,
    color: moodColors[mood as keyof typeof moodColors],
  }));

  // Calculate average mood this week
  const avgMood = thisWeekCheckIns.length > 0
    ? thisWeekCheckIns.reduce((sum, c) => sum + moodToValue[c.mood as keyof typeof moodToValue], 0) / thisWeekCheckIns.length
    : 0;

  // Calculate total session time (estimate 30 min per session)
  const totalSessionMinutes = thisWeekSessions.length * 30;
  const sessionHours = Math.floor(totalSessionMinutes / 60);
  const sessionMinutes = totalSessionMinutes % 60;

  // Check-in consistency (days checked in this week)
  const daysCheckedIn = thisWeekCheckIns.length;
  const consistencyPercent = Math.round((daysCheckedIn / 7) * 100);

  // Day-by-day check-ins for bar chart
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyData = dayNames.map((day, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);
    const dayStr = format(dayDate, 'yyyy-MM-dd');
    
    const checkIn = thisWeekCheckIns.find(c => 
      format(new Date(c.created_at), 'yyyy-MM-dd') === dayStr
    );
    
    return {
      day,
      value: checkIn ? moodToValue[checkIn.mood as keyof typeof moodToValue] : 0,
      mood: checkIn?.mood || null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Week Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{daysCheckedIn}/7</p>
                <p className="text-sm text-muted-foreground">Days Checked In</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${consistencyPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{consistencyPercent}% consistency</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgMood > 0 ? avgMood.toFixed(1) : 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Avg Mood</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {avgMood >= 3 ? '😊 Great week!' : avgMood >= 2 ? '😐 Steady progress' : avgMood > 0 ? '💪 Keep going!' : 'Start checking in'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{thisWeekSessions.length}</p>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {thisWeekSessions.length > 0 ? 'Active participation! 🎉' : 'Join a session this week'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sessionHours > 0 ? `${sessionHours}h` : `${sessionMinutes}m`}
                </p>
                <p className="text-sm text-muted-foreground">Session Time</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {totalSessionMinutes > 0 ? 'Time invested in recovery' : 'Start connecting'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Check-ins Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {thisWeekCheckIns.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No Check-ins This Week</p>
              <p className="text-muted-foreground">
                Start checking in daily to see your weekly patterns
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
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
                          <p className="font-semibold">{data.day}</p>
                          <p className="text-sm capitalize">{data.mood}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Mood Distribution Pie Chart */}
      {moodData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mood Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={moodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Weekly Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {daysCheckedIn >= 7 && (
                  <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                    <div className="text-2xl">🏆</div>
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">Perfect Week!</p>
                      <p className="text-sm text-muted-foreground">Checked in every day this week</p>
                    </div>
                  </div>
                )}
                
                {daysCheckedIn >= 5 && daysCheckedIn < 7 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
                    <div className="text-2xl">⭐</div>
                    <div>
                      <p className="font-semibold text-blue-700 dark:text-blue-400">Consistent!</p>
                      <p className="text-sm text-muted-foreground">Checked in {daysCheckedIn} days this week</p>
                    </div>
                  </div>
                )}

                {thisWeekSessions.length >= 3 && (
                  <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg">
                    <div className="text-2xl">🤝</div>
                    <div>
                      <p className="font-semibold text-purple-700 dark:text-purple-400">Community Champion!</p>
                      <p className="text-sm text-muted-foreground">Joined {thisWeekSessions.length} sessions</p>
                    </div>
                  </div>
                )}

                {avgMood >= 3.5 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg">
                    <div className="text-2xl">😊</div>
                    <div>
                      <p className="font-semibold text-yellow-700 dark:text-yellow-400">Positive Vibes!</p>
                      <p className="text-sm text-muted-foreground">Average mood: {avgMood.toFixed(1)}/4</p>
                    </div>
                  </div>
                )}

                {daysCheckedIn === 0 && thisWeekSessions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Complete check-ins and join sessions to earn achievements!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
