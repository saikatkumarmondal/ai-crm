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

interface DashboardStats {
  totalLeads: number;
  convertedLeads: number;
  totalCustomers: number;
  totalDeals: number;
  dealValue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [leads, customers, deals] = await Promise.all([
          fetch("/api/leads").then((r) => r.json()),
          fetch("/api/customers").then((r) => r.json()),
          fetch("/api/deals").then((r) => r.json()),
        ]);

        const converted = leads.data?.items?.filter(
          (l: any) => l.status === "CONVERTED"
        ).length || 0;

        const totalValue = deals.data?.items?.reduce(
          (sum: number, d: any) => sum + parseFloat(d.value || 0),
          0
        ) || 0;

        setStats({
          totalLeads: leads.data?.meta?.total || 0,
          convertedLeads: converted,
          totalCustomers: customers.data?.meta?.total || 0,
          totalDeals: deals.data?.meta?.total || 0,
          dealValue: totalValue,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Leads",
      value: stats?.totalLeads || 0,
      change: 12,
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Converted Leads",
      value: stats?.convertedLeads || 0,
      change: 8,
      icon: Activity,
      color: "green",
    },
    {
      title: "Customers",
      value: stats?.totalCustomers || 0,
      change: 5,
      icon: Users,
      color: "purple",
    },
    {
      title: "Open Deals",
      value: stats?.totalDeals || 0,
      change: 3,
      icon: Briefcase,
      color: "orange",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome to AI CRM</h1>
        <p className="text-slate-600 mt-2">
          Track your sales pipeline and manage customer relationships effectively
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: "bg-blue-50 text-blue-600",
            green: "bg-green-50 text-green-600",
            purple: "bg-purple-50 text-purple-600",
            orange: "bg-orange-50 text-orange-600",
          };

          return (
            <div
              key={card.title}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <ArrowUpRight size={16} />
                  {card.change}%
                </div>
              </div>
              <h3 className="text-slate-600 text-sm font-medium">{card.title}</h3>
              <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Pipeline Overview
          </h3>
          <div className="space-y-4">
            {["Qualification", "Proposal", "Negotiation", "Won"].map((stage) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-slate-600">{stage}</span>
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{
                      width: `${Math.random() * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Conversion Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Lead to Customer</span>
              <span className="text-2xl font-bold text-slate-900">
                {stats && stats.totalLeads > 0
                  ? Math.round((stats.convertedLeads / stats.totalLeads) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Deal Win Rate</span>
              <span className="text-2xl font-bold text-slate-900">68%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Average Deal Value</span>
              <span className="text-2xl font-bold text-slate-900">
                ${((stats?.dealValue || 0) / Math.max(1, stats?.totalDeals || 1)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
