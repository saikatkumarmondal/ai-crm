// src/app/(dashboard)/deals/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api/apiClient";

interface Deal {
  id: string;
  title: string;
  customer: {
    fullName: string;
    companyName?: string;
  };
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
}

interface DealsListResult {
  items: Deal[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface CustomerOption {
  id: string;
  fullName: string;
  companyName?: string;
}

interface CustomersListResult {
  items: CustomerOption[];
}

interface AiInsightResult {
  insight: string;
}

interface DealStageOption {
  value: string;
  label: string;
}

interface DealStagesResult {
  stages: DealStageOption[];
}

const STAGE_COLORS: Record<string, string> = {
  QUALIFICATION: "bg-blue-50 border-blue-200",
  NEEDS_ANALYSIS: "bg-indigo-50 border-indigo-200",
  PROPOSAL: "bg-purple-50 border-purple-200",
  NEGOTIATION: "bg-orange-50 border-orange-200",
  WON: "bg-green-50 border-green-200",
  LOST: "bg-red-50 border-red-200",
};

function getStageColor(stage: string): string {
  return STAGE_COLORS[stage] ?? "bg-slate-50 border-slate-200";
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<DealStageOption[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    title: "",
    value: "",
    currency: "BDT",
  });
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  // ---- AI Insights state ----
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchStages = async () => {
    setStagesLoading(true);
    try {
      const data = await apiFetch<DealStagesResult>("/deals/stages");
      setStages(data?.stages || []);
    } catch (error) {
      console.error("Failed to fetch deal stages", error);
    } finally {
      setStagesLoading(false);
    }
  };

  const fetchDeals = async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append("search", q);
      params.append("limit", "200");
      const data = await apiFetch<DealsListResult>(`/deals?${params}`);
      setDeals(data?.items || []);
    } catch (error) {
      console.error("Failed to fetch deals", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiFetch<CustomersListResult>("/customers?limit=100");
      setCustomers(data?.items || []);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    }
  };

  useEffect(() => {
    fetchStages();
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchDeals(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/deals", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
        }),
      });

      setShowModal(false);
      setFormData({
        customerId: "",
        title: "",
        value: "",
        currency: "BDT",
      });
      fetchDeals(search);
    } catch (error) {
      console.error("Failed to create deal", error);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await apiFetch(`/deals/${id}`, { method: "DELETE" });
        fetchDeals(search);
      } catch (error) {
        console.error("Failed to delete deal", error);
      }
    }
  };

  const handleGenerateInsights = async () => {
    setShowAiPanel(true);
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await apiFetch<AiInsightResult>("/ai/deal-insights", {
        method: "POST",
      });
      setAiInsight(result.insight);
    } catch (error) {
      console.error("Failed to generate AI insights", error);
      setAiError(
        error instanceof Error
          ? error.message
          : "Could not generate insights right now."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const dealsByStage = stages.reduce(
    (acc, stage) => {
      acc[stage.value] = deals.filter((d) => d.stage === stage.value);
      return acc;
    },
    {} as Record<string, Deal[]>
  );

  // "- point one\n- point two" কে array তে ভাঙা হচ্ছে দেখানোর জন্য
  const insightLines =
    aiInsight
      ?.split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-600 mt-1">Track your deals through the sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateInsights}
            disabled={aiLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-violet-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} className={aiLoading ? "animate-pulse" : ""} />
            {aiLoading ? "Analyzing..." : "AI Insights"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} /> New Deal
          </button>
        </div>
      </div>

      {/* AI Insights Panel */}
      {showAiPanel && (
        <div className="relative bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-lg p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            onClick={() => setShowAiPanel(false)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-violet-600" />
            <h3 className="font-semibold text-slate-900">AI Pipeline Insights</h3>
          </div>

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
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Search Deals
        </label>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by title or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Kanban Board — responsive flex layout, columns grow/wrap on smaller screens */}
      {loading || stagesLoading ? (
        <div className="p-8 text-center text-slate-600">Loading deals...</div>
      ) : (
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {stages.map((stage) => (
            <div
              key={stage.value}
              className={`flex-[4_1_260px] min-w-[260px] rounded-lg border-2 p-4 ${getStageColor(
                stage.value
              )}`}
            >
              <div className="mb-4">
                <h3 className="font-semibold text-slate-900">{stage.label}</h3>
                <p className="text-xs text-slate-600">
                  {(dealsByStage[stage.value] || []).length} deal(s)
                </p>
              </div>
              <div className="space-y-3">
                {(dealsByStage[stage.value] || []).map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">
                          {deal.title}
                        </h4>
                        <p className="text-xs text-slate-600 truncate">
                          {deal.customer.fullName}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="text-red-600 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Value:</span>
                        <span className="font-semibold text-slate-900">
                          {deal.currency} {deal.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Probability:</span>
                        <span className="font-semibold text-slate-900">
                          {deal.probability}%
                        </span>
                      </div>
                      {deal.expectedCloseDate && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Close Date:</span>
                          <span className="text-slate-700">
                            {new Date(deal.expectedCloseDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="mt-3 block w-full text-center px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Deal</h2>
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer *
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName} {customer.companyName ? `(${customer.companyName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deal Value *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BDT">BDT</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Deal
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-200 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}