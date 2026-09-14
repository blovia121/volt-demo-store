import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Package,
  HelpCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      setError('Could not load metrics. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to store
            </a>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-xl font-medium text-gray-800">
              Chat Analytics
            </h1>
          </div>
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-6xl flex-1">
        {loading && !metrics && (
          <div className="text-center py-20 text-gray-500">Loading metrics...</div>
        )}

        {error && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}

        {metrics && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard
                icon={MessageSquare}
                label="Total Interactions"
                value={metrics.total}
                color="text-blue-500"
                bg="bg-blue-50"
              />
              <KpiCard
                icon={Package}
                label="Order Queries"
                value={metrics.orderQueries}
                color="text-orange-500"
                bg="bg-orange-50"
              />
              <KpiCard
                icon={HelpCircle}
                label="Policy Questions"
                value={metrics.policyQueries}
                color="text-purple-500"
                bg="bg-purple-50"
              />
              <KpiCard
                icon={CheckCircle}
                label="Resolved"
                value={metrics.resolved}
                color="text-green-500"
                bg="bg-green-50"
              />
            </div>

            {/* Business impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h3 className="text-sm text-gray-500 uppercase tracking-wide">
                    Estimated Time Saved
                  </h3>
                </div>
                <div className="text-4xl font-light text-gray-800">
                  {metrics.minutesSaved}{' '}
                  <span className="text-lg text-gray-400">minutes</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Based on 3 min saved per resolved interaction.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="text-sm text-gray-500 uppercase tracking-wide">
                    Automation Rate
                  </h3>
                </div>
                <div className="text-4xl font-light text-gray-800">
                  {metrics.automationRate}
                  <span className="text-lg text-gray-400">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Percentage of interactions fully handled by AI.
                </p>
              </div>
            </div>

            {/* Recent interactions table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-medium text-gray-800">Recent Interactions</h3>
                <p className="text-sm text-gray-500">
                  Last {metrics.recent.length} messages handled by the AI.
                </p>
              </div>

              {metrics.recent.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  No interactions yet. Try asking the chat a question.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="text-left px-6 py-3 font-medium">Time</th>
                        <th className="text-left px-6 py-3 font-medium">Type</th>
                        <th className="text-left px-6 py-3 font-medium">Question</th>
                        <th className="text-left px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recent.map((log, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                            {formatTime(log.timestamp)}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                log.intent === 'order_status'
                                  ? 'bg-orange-100 text-orange-700'
                                  : log.intent === 'human_handoff'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {log.intent === 'order_status'
                                ? 'Order'
                                : log.intent === 'human_handoff'
                                ? 'Handoff'
                                : 'Policy'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-700 max-w-md truncate">
                            {log.question}
                          </td>
                          <td className="px-6 py-3">
                            {log.resolved ? (
                              <span className="text-green-600">✓ Resolved</span>
                            ) : (
                              <span className="text-red-500">✗ Not resolved</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Attribution footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 bg-white">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <p className="text-sm text-gray-600">
            Built by{' '}
            <span className="font-medium text-gray-800">Volt AI</span> — AI support agents for small e-commerce brands
          </p>
          <p className="text-sm text-gray-500 mt-1">
            DM{' '}
            <a
              href="https://instagram.com/voltai.build"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600"
            >
              @voltai.build
            </a>{' '}
            · Email{' '}
            <a
              href="mailto:aymanemekouar13@gmail.com"
              className="text-orange-500 hover:text-orange-600"
            >
              aymanemekouar13@gmail.com
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Want this for your store? Free setup + $150/month. Cancel anytime.
          </p>
        </div>
      </footer>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, color, bg }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-200 p-6"
  >
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center mb-4`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div className="text-sm text-gray-500 mb-1">{label}</div>
    <div className="text-3xl font-light text-gray-800">{value}</div>
  </motion.div>
);

export default Dashboard;