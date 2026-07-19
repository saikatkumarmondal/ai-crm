// src/app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Briefcase,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api/apiClient";

interface DealItem {
  id: string;
  stage: string;
  value: string | number;
  createdAt: string;
}

interface LeadItem {
  id: string;
  status: string;
  createdAt: string;
}

interface CustomerItem {
  id: string;
  createdAt: string;
}

interface ListResponse<T> {
  items: T[];
  meta: { total: number };
}

interface DashboardStats {
  totalLeads: number;
  convertedLeads: number;
  totalCustomers: number;
  totalDeals: number;
  dealValue: number;
  leadsChange: number;
  convertedChange: number;
  customersChange: number;
  dealsChange: number;
  winRate: number;
}

interface PipelineStage {
  stage: string;
  label: string;
  count: number;
  totalValue: number;
}

interface PipelineResult {
  pipeline: PipelineStage[];
}

interface AiPipelineInsightResult {
  insight: string;
}

function calculatePeriodChange(items: { createdAt: string }[]): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const currentWindow = items.filter(
    (item) => now - new Date(item.createdAt).getTime() <= 30 * day
  ).length;

  const previousWindow = items.filter((item) => {
    const age = now - new Date(item.createdAt).getTime();
    return age > 30 * day && age <= 60 * day;
  }).length;

  if (previousWindow === 0) {
    return currentWindow > 0 ? 100 : 0;
  }

  return Math.round(((currentWindow - previousWindow) / previousWindow) * 100);
}

// ---------- Skeleton building blocks ----------

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-slate-200/80 rounded-md ${className}`}>
      <div className="shimmer-sweep absolute inset-0" />
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="skeleton-card bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <Shimmer className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg" />
        <Shimmer className="w-12 h-5 rounded-full" />
      </div>
      <Shimmer className="w-24 h-3 rounded" />
      <Shimmer className="w-16 h-7 rounded mt-3" />
    </div>
  );
}

function PipelineFlowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Shimmer key={i} className="flex-1 h-24 rounded-lg" />
      ))}
    </div>
  );
}

function MetricRowSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <Shimmer className="w-28 sm:w-32 h-4 rounded" />
      <Shimmer className="w-14 h-7 rounded" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <Shimmer className="w-56 sm:w-72 h-7 sm:h-8 rounded" />
        <Shimmer className="w-72 sm:w-96 h-4 rounded mt-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>

      <div className="skeleton-card bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
        <Shimmer className="w-40 h-5 rounded mb-5" />
        <PipelineFlowSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="skeleton-card bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <Shimmer className="w-44 h-5 rounded mb-5" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <MetricRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-sweep {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.75) 50%,
            transparent 100%
          );
          animation: shimmerSweep 1.6s ease-in-out infinite;
        }
        @keyframes cardFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          }
          50% {
            transform: translateY(-2px) scale(1.005);
            box-shadow: 0 12px 24px -8px rgba(15, 23, 42, 0.12);
          }
        }
        .skeleton-card {
          animation: cardFloat 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ---------- Page ----------

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(true);

  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);

        const [leadsRes, customersRes, dealsRes] = await Promise.all([
          apiFetch<ListResponse<LeadItem>>("/leads"),
          apiFetch<ListResponse<CustomerItem>>("/customers"),
          apiFetch<ListResponse<DealItem>>("/deals"),
        ]);

        const leadItems = leadsRes.items || [];
        const customerItems = customersRes.items || [];
        const dealItems = dealsRes.items || [];

        const convertedLeadsItems = leadItems.filter(
          (l) => l.status === "CONVERTED"
        );

        const totalValue = dealItems.reduce(
          (sum, d) => sum + parseFloat(String(d.value || 0)),
          0
        );

        const wonDeals = dealItems.filter((d) => d.stage === "WON").length;
        const winRate =
          dealItems.length > 0
            ? Math.round((wonDeals / dealItems.length) * 100)
            : 0;

        setStats({
          totalLeads: leadsRes.meta?.total || 0,
          convertedLeads: convertedLeadsItems.length,
          totalCustomers: customersRes.meta?.total || 0,
          totalDeals: dealsRes.meta?.total || 0,
          dealValue: totalValue,
          leadsChange: calculatePeriodChange(leadItems),
          convertedChange: calculatePeriodChange(convertedLeadsItems),
          customersChange: calculatePeriodChange(customerItems),
          dealsChange: calculatePeriodChange(dealItems),
          winRate,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchPipeline = async () => {
      try {
        const res = await apiFetch<PipelineResult>("/deals/pipeline");
        setPipeline(res.pipeline || []);
      } catch (err) {
        console.error("Failed to fetch pipeline", err);
      } finally {
        setPipelineLoading(false);
      }
    };

    fetchStats();
    fetchPipeline();
  }, []);

  const handleAnalyzePipeline = async () => {
    setShowAiPanel(true);
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await apiFetch<AiPipelineInsightResult>(
        "/ai/pipeline-insights",
        { method: "POST" }
      );
      setAiInsight(result.insight);
    } catch (err) {
      console.error("Failed to generate pipeline insights", err);
      setAiError(
        err instanceof Error
          ? err.message
          : "Could not generate insights right now."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const insightLines =
    aiInsight
      ?.split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean) ?? [];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 px-4">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  const cards = stats
    ? [
        {
          title: "Total Leads",
          value: stats.totalLeads,
          change: stats.leadsChange,
          icon: TrendingUp,
          color: "blue",
        },
        {
          title: "Converted Leads",
          value: stats.convertedLeads,
          change: stats.convertedChange,
          icon: Activity,
          color: "green",
        },
        {
          title: "Customers",
          value: stats.totalCustomers,
          change: stats.customersChange,
          icon: Users,
          color: "purple",
        },
        {
          title: "Open Deals",
          value: stats.totalDeals,
          change: stats.dealsChange,
          icon: Briefcase,
          color: "orange",
        },
      ]
    : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome to AI CRM
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1.5 sm:mt-2">
          Track your sales pipeline and manage customer relationships effectively
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.change >= 0;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
            green: "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white",
            purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
            orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
          };
          const ringClasses = {
            blue: "hover:ring-blue-100",
            green: "hover:ring-green-100",
            purple: "hover:ring-purple-100",
            orange: "hover:ring-orange-100",
          };

          return (
            <div
              key={card.title}
              className={`group relative bg-white rounded-lg border border-slate-200 p-4 sm:p-6 cursor-default
                transition-all duration-300 ease-out
                hover:-translate-y-1 hover:shadow-xl hover:ring-4
                ${ringClasses[card.color as keyof typeof ringClasses]}`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div
                  className={`p-2.5 sm:p-3 rounded-lg transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 ${
                    colorClasses[card.color as keyof typeof colorClasses]
                  }`}
                >
                  <Icon size={20} className="sm:hidden" />
                  <Icon size={24} className="hidden sm:block" />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs sm:text-sm font-medium transition-transform duration-300 group-hover:scale-105 ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositive ? (
                    <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                  ) : (
                    <ArrowDownRight size={14} className="sm:w-4 sm:h-4" />
                  )}
                  {Math.abs(card.change)}%
                </div>
              </div>
              <h3 className="text-xs sm:text-sm text-slate-600 font-medium">
                {card.title}
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 sm:mt-2 transition-colors duration-300">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Visual Pipeline — Qualify → Analyze → Propose → Negotiate → Won */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Visual Pipeline
          </h3>
          <button
            onClick={handleAnalyzePipeline}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-violet-600 hover:text-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Sparkles size={14} className={aiLoading ? "animate-pulse" : ""} />
            {aiLoading ? "Analyzing..." : "Analyze with AI"}
          </button>
        </div>

        {/* AI insight panel */}
        {showAiPanel && (
          <div className="relative bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-lg p-4 mb-5">
            {aiLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-3 bg-violet-200/60 rounded animate-pulse"
                    style={{ width: `${90 - i * 10}%` }}
                  />
                ))}
              </div>
            )}
            {!aiLoading && aiError && (
              <p className="text-sm text-red-600">{aiError}</p>
            )}
            {!aiLoading && !aiError && insightLines.length > 0 && (
              <ul className="space-y-1.5">
                {insightLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Arrow-flow diagram — responsive: column on mobile, row on desktop */}
        {pipelineLoading ? (
          <PipelineFlowSkeleton />
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
            {pipeline.map((stage, index) => (
              <div
                key={stage.stage}
                className="flex flex-col sm:flex-row items-stretch flex-1 min-w-0"
              >
                <div className="flex-1 min-w-0 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg p-3 sm:p-4 text-center transition-colors duration-200">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    {stage.label}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                    {stage.count}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                    ${stage.totalValue.toLocaleString()}
                  </p>
                </div>
                {index < pipeline.length - 1 && (
                  <div className="flex items-center justify-center py-1 sm:py-0 sm:px-1.5 shrink-0">
                    <ArrowRight
                      size={18}
                      className="text-slate-300 rotate-90 sm:rotate-0"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            Conversion Metrics
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="group flex items-center justify-between rounded-md px-2 -mx-2 py-1.5 transition-colors duration-200 hover:bg-slate-50">
              <span className="text-sm sm:text-base text-slate-600 transition-colors duration-200 group-hover:text-slate-900">
                Lead to Customer
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 transition-transform duration-200 group-hover:scale-110 origin-right">
                {stats && stats.totalLeads > 0
                  ? Math.round((stats.convertedLeads / stats.totalLeads) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="group flex items-center justify-between rounded-md px-2 -mx-2 py-1.5 transition-colors duration-200 hover:bg-slate-50">
              <span className="text-sm sm:text-base text-slate-600 transition-colors duration-200 group-hover:text-slate-900">
                Deal Win Rate
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 transition-transform duration-200 group-hover:scale-110 origin-right">
                {stats?.winRate ?? 0}%
              </span>
            </div>
            <div className="group flex items-center justify-between rounded-md px-2 -mx-2 py-1.5 transition-colors duration-200 hover:bg-slate-50">
              <span className="text-sm sm:text-base text-slate-600 transition-colors duration-200 group-hover:text-slate-900">
                Average Deal Value
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-900 transition-transform duration-200 group-hover:scale-110 origin-right">
                $
                {stats && stats.totalDeals > 0
                  ? (stats.dealValue / stats.totalDeals).toFixed(2)
                  : "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}