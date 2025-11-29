'use client';

import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export function LineChartComponent({ data, dataKey, title }: { data: ChartData[], dataKey: string, title?: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          labelStyle={{ color: '#374151', fontWeight: 600 }}
        />
        <Line type="monotone" dataKey={dataKey} stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaChartComponent({ data, dataKey, title, color = '#3b82f6' }: { data: ChartData[], dataKey: string, title?: string, color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          labelStyle={{ color: '#374151', fontWeight: 600 }}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarChartComponent({ data, dataKey, title }: { data: ChartData[], dataKey: string, title?: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          labelStyle={{ color: '#374151', fontWeight: 600 }}
        />
        <Bar dataKey={dataKey} fill="#3b82f6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieChartComponent({ data, title }: { data: ChartData[], title?: string }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MultiLineChart({ data, dataKeys, colors }: { data: ChartData[], dataKeys: string[], colors: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
        <YAxis stroke="#6b7280" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          labelStyle={{ color: '#374151', fontWeight: 600 }}
        />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line 
            key={key}
            type="monotone" 
            dataKey={key} 
            stroke={colors[index] || COLORS[index]} 
            strokeWidth={2} 
            dot={{ fill: colors[index] || COLORS[index], r: 4 }} 
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
