'use client'

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData } from '@/app/actions/get-chart-data';

interface ChartsWidgetProps {
  data: ChartData;
}

const COLORS = {
  primary: '#F59E0B', // amber-500
  secondary: '#3B82F6', // blue-500
  success: '#10B981', // green-500
  danger: '#EF4444', // red-500
  warning: '#F97316', // orange-500
};

export function ChartsWidget({ data }: ChartsWidgetProps) {
  const hasData = data.inspectionsOverTime.length > 0 || 
                  data.colonyStrengthTrend.length > 0 || 
                  data.temperatureTrend.length > 0 ||
                  data.inspectionsByMood.length > 0;

  if (!hasData) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10 dark:border-white/5">
        <h3 className="text-lg font-bold mb-4 text-amber-950 dark:text-white">Wykresy i Statystyki</h3>
        <div className="flex items-center justify-center h-64 text-amber-900/60 dark:text-white/40">
          <p className="text-sm">Brak danych do wyświetlenia. Dodaj przeglądy, aby zobaczyć statystyki.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/10 dark:border-white/5">
      <h3 className="text-lg font-bold mb-4 md:mb-6 text-amber-950 dark:text-white">Wykresy i Statystyki</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Inspections Over Time */}
        {data.inspectionsOverTime.length > 0 && (
          <div className="bg-white/5 dark:bg-black/30 rounded-xl p-4 border border-white/5">
            <h4 className="text-sm font-bold mb-3 text-amber-900 dark:text-amber-400">Przeglądy w Czasie</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.inspectionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Colony Strength Trend */}
        {data.colonyStrengthTrend.length > 0 && (
          <div className="bg-white/5 dark:bg-black/30 rounded-xl p-4 border border-white/5">
            <h4 className="text-sm font-bold mb-3 text-amber-900 dark:text-amber-400">Trend Siły Kolonii</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.colonyStrengthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  iconType="line"
                />
                <Line type="monotone" dataKey="strong" stroke={COLORS.success} strokeWidth={2} name="Silna" />
                <Line type="monotone" dataKey="medium" stroke={COLORS.warning} strokeWidth={2} name="Średnia" />
                <Line type="monotone" dataKey="weak" stroke={COLORS.danger} strokeWidth={2} name="Słaba" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Temperature Trend */}
        {data.temperatureTrend.length > 0 && (
          <div className="bg-white/5 dark:bg-black/30 rounded-xl p-4 border border-white/5">
            <h4 className="text-sm font-bold mb-3 text-amber-900 dark:text-amber-400">Temperatura</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.temperatureTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  iconType="line"
                />
                <Line type="monotone" dataKey="avgTemp" stroke={COLORS.primary} strokeWidth={2} name="Średnia" />
                <Line type="monotone" dataKey="minTemp" stroke={COLORS.secondary} strokeWidth={1} strokeDasharray="5 5" name="Min" />
                <Line type="monotone" dataKey="maxTemp" stroke={COLORS.warning} strokeWidth={1} strokeDasharray="5 5" name="Max" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Inspections By Mood */}
        {data.inspectionsByMood.length > 0 && (
          <div className="bg-white/5 dark:bg-black/30 rounded-xl p-4 border border-white/5">
            <h4 className="text-sm font-bold mb-3 text-amber-900 dark:text-amber-400">Nastrój Kolonii</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.inspectionsByMood}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ mood, percent }) => `${mood} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.inspectionsByMood.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger][index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}



