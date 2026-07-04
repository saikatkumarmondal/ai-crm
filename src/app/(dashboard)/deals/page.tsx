// src/app/(dashboard)/deals/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";

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

const DEAL_STAGES = [
  "QUALIFICATION",
  "NEEDS_ANALYSIS",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    title: "",
    value: "",
    currency: "BDT",
  });
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchDeals = async (q?: string) => {
    try {
      const params = new URLSearchParams();
      if (q) params.append("search", q);
      const res = await fetch(`/api/deals?${params}`);
      const data = await res.json();
      setDeals(data.data?.items || []);
    } catch (error) {
      console.error("Failed to fetch deals", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers?limit=100");
      const data = await res.json();
      setCustomers(data.data?.items || []);
    } catch (error) {
      console.error("Failed to fetch customers", error);
    }
  };

  useEffect(() => {
    fetchDeals(search);
    if (customers.length === 0) {
      fetchCustomers();
    }
  }, [search]);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          customerId: "",
          title: "",
          value: "",
          currency: "BDT",
        });
        fetchDeals(search);
      }
    } catch (error) {
      console.error("Failed to create deal", error);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await fetch(`/api/deals/${id}`, { method: "DELETE" });
        fetchDeals(search);
      } catch (error) {
        console.error("Failed to delete deal", error);
      }
    }
  };

  const dealsByStage = DEAL_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage);
      return acc;
    },
    {} as Record<string, Deal[]>
  );

  const stageColors = {
    QUALIFICATION: "bg-blue-50 border-blue-200",
    NEEDS_ANALYSIS: "bg-indigo-50 border-indigo-200",
    PROPOSAL: "bg-purple-50 border-purple-200",
    NEGOTIATION: "bg-orange-50 border-orange-200",
    WON: "bg-green-50 border-green-200",
    LOST: "bg-red-50 border-red-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Pipeline</h1>
          <p className="text-slate-600 mt-1">Track your deals through the sales pipeline</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> New Deal
        </button>
      </div>

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

      {/* Kanban Board */}
      {loading ? (
        <div className="p-8 text-center text-slate-600">Loading deals...</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4" style={{ minWidth: "100%" }}>
            {DEAL_STAGES.map((stage) => (
              <div
                key={stage}
                className={`flex-shrink-0 w-80 rounded-lg border-2 p-4 ${
                  stageColors[stage as keyof typeof stageColors]
                }`}
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900">{stage}</h3>
                  <p className="text-xs text-slate-600">
                    {dealsByStage[stage].length} deal(s)
                  </p>
                </div>
                <div className="space-y-3">
                  {dealsByStage[stage].map((deal) => (
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
