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
  pipeline: { stage: string; count: number; percent: number }[];
}

const PIPELINE_STAGES = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON"];

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

function PipelineRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Shimmer className="w-20 sm:w-24 h-4 rounded shrink-0" />
      <div className="flex items-center gap-3 flex-1 justify-end">
        <Shimmer className="w-full max-w-[8rem] h-2 rounded-full" />
        <Shimmer className="w-5 h-3 rounded shrink-0" />
      </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="skeleton-card bg-white rounded-lg border border-slate-200 p-4 sm:p-6">
          <Shimmer className="w-40 h-5 rounded mb-5" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PipelineRowSkeleton key={i} />
            ))}
          </div>
        </div>

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

        const stageCounts = PIPELINE_STAGES.map((stage) => ({
          stage,
          count: dealItems.filter((d) => d.stage === stage).length,
        }));
        const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);
        const pipeline = stageCounts.map((s) => ({
          ...s,
          percent: Math.round((s.count / maxCount) * 100),
        }));

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
          pipeline,
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

    fetchStats();
  }, []);

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pipeline Overview */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            Pipeline Overview
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {stats?.pipeline.map((s) => (
              <div
                key={s.stage}
                className="group flex items-center justify-between gap-3 rounded-md px-2 -mx-2 py-1.5 transition-colors duration-200 hover:bg-slate-50"
              >
                <span className="text-sm sm:text-base text-slate-600 capitalize shrink-0 transition-colors duration-200 group-hover:text-slate-900">
                  {s.stage.charAt(0) + s.stage.slice(1).toLowerCase()}
                </span>
                <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
                  <div className="w-full max-w-[5rem] sm:max-w-[8rem] h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out group-hover:from-blue-600 group-hover:to-blue-700"
                      style={{ width: `${s.percent}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-500 w-5 sm:w-6 text-right shrink-0 transition-colors duration-200 group-hover:text-slate-900 group-hover:font-semibold">
                    {s.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Metrics */}
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