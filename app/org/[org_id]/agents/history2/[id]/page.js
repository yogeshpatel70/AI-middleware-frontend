"use client";

import React, { use, useState, useRef, useCallback, useEffect } from "react";
import Protected from "@/components/Protected";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCustomSelector } from "@/customHooks/customSelector";
import { getHistoryAction } from "@/store/action/historyAction";
import ChatDetails from "@/components/historyPageComponents/ChatDetails";
import BatchSubthreadPanel from "@/components/historyPageComponents/BatchSubthreadPanel";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Settings,
  X,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Sidebar from "@/components/historyPageComponents/Sidebar";
import ThreadContainer from "@/components/historyPageComponents/ThreadContainer";

const timeSeriesData = [
  { time: "00:00", success: 22, failed: 2 },
  { time: "04:00", success: 17, failed: 1 },
  { time: "08:00", success: 42, failed: 3 },
  { time: "12:00", success: 84, failed: 5 },
  { time: "16:00", success: 70, failed: 6 },
  { time: "20:00", success: 49, failed: 3 },
];

const latencyData = [
  { time: "00:00", typical: 234, slow: 456, worst: 1024 },
  { time: "04:00", typical: 198, slow: 423, worst: 987 },
  { time: "08:00", typical: 267, slow: 512, worst: 1156 },
  { time: "12:00", typical: 312, slow: 678, worst: 1423 },
  { time: "16:00", typical: 289, slow: 589, worst: 1289 },
  { time: "20:00", typical: 245, slow: 498, worst: 1098 },
];

const CHART_STYLE = {
  tooltip: {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#0a0a0a",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  grid: "#f0f0f0",
  axis: "#a3a3a3",
};

const stats = [
  {
    label: "Total Requests",
    value: "2,341",
    change: "+12.5%",
    up: true,
    icon: Activity,
  },
  { label: "Success Rate", value: "94.2%", change: "+2.1%", up: true, icon: CheckCircle2 },
  { label: "Avg Response", value: "342ms", change: "−8.3%", up: true, icon: Clock },
  { label: "Failed Runs", value: "136", change: "+4", up: false, icon: XCircle },
];

const faqs = [
  {
    id: 1,
    question: "What is latency and how is it measured?",
    answer:
      "Latency is the time taken for an agent to process and respond to a request. It's measured in milliseconds from when the request is sent to when the response is received.",
  },
  {
    id: 2,
    question: "What does the execution history show?",
    answer:
      "The execution history displays all past agent runs with details about success/failure status, response times, tools used, and timestamps for debugging and analysis.",
  },
  {
    id: 3,
    question: "What is a Reviewer Agent failure?",
    answer:
      "A Reviewer Agent failure occurs when the review process flags an execution as problematic, typically due to quality issues, policy violations, or unexpected outputs.",
  },
  {
    id: 4,
    question: "Why do some executions show a high latency?",
    answer:
      "High latency can be caused by complex processing, external API calls, large data handling, or system bottlenecks. Check the execution details for more information.",
  },
  {
    id: 5,
    question: "How is the success rate calculated?",
    answer:
      "Success rate is calculated as (Total Successful Executions / Total Executions) × 100. It shows the percentage of executions that completed without errors.",
  },
];

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-muted/30 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

function History2Page({ params }) {
  const resolvedParams = use(params);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef(null);
  const activeFilterByRef = useRef(undefined);

  const { historyData, thread, selectedVersion } = useCustomSelector((state) => ({
    historyData: state?.historyReducer?.history || [],
    thread: state?.historyReducer?.thread || [],
    selectedVersion: state?.historyReducer?.selectedVersion || "all",
  }));

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Start with sidebar visible
  const [timeRange, setTimeRange] = useState("24h");
  const [openFAQId, setOpenFAQId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchMessageId, setSearchMessageId] = useState(null);
  const [filterOption, setFilterOption] = useState("all");
  const [threadPage, setThreadPage] = useState(1);
  const [isErrorTrue, setIsErrorTrue] = useState(false);
  const [showThreadDetail, setShowThreadDetail] = useState(false);
  const [hasMoreThreadData, setHasMoreThreadData] = useState(true);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBatchMessageId, setSelectedBatchMessageId] = useState(null);

  // Reset batch selection when thread changes
  useEffect(() => {
    setSelectedBatchMessageId(null);
  }, [searchParams.get("thread_id")]);

  // Auto-pick first batch for batched threads
  useEffect(() => {
    if (selectedBatchMessageId !== null) return;
    if (!Array.isArray(thread) || thread.length === 0) return;
    const currentThreadId = searchParams.get("thread_id");
    if (currentThreadId && thread[0]?.thread_id && thread[0].thread_id !== currentThreadId) return;
    const firstBatch = thread.find((msg) => msg?.batch_data?.batch_id);
    if (firstBatch) setSelectedBatchMessageId(firstBatch.message_id);
  }, [thread, selectedBatchMessageId, searchParams]);

  const displayThread = selectedBatchMessageId
    ? thread.filter((msg) => msg?.message_id === selectedBatchMessageId)
    : thread;

  // Initialize history on component mount
  useEffect(() => {
    const fetchHistoryData = async () => {
      setLoading(true);
      try {
        await dispatch(getHistoryAction(resolvedParams?.id, 1, "all", false, selectedVersion));
        setPage(1);
        setHasMore(true);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams?.id) {
      fetchHistoryData();
    }
  }, [resolvedParams?.id, dispatch, selectedVersion]);

  const fetchMoreData = useCallback(async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      await dispatch(getHistoryAction(resolvedParams?.id, page + 1, filterOption, isErrorTrue, selectedVersion));
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to fetch more history:", error);
    } finally {
      setIsFetchingMore(false);
    }
  }, [page, dispatch, resolvedParams?.id, filterOption, isErrorTrue, selectedVersion, hasMore, isFetchingMore]);

  const searchParamsObj = Object.fromEntries(searchParams.entries());

  // Open the slider whenever Sidebar pushes a thread_id into the URL.
  useEffect(() => {
    if (searchParamsObj?.thread_id) {
      setShowThreadDetail(true);
    }
  }, [searchParamsObj?.thread_id, searchParamsObj?.subThread_id]);

  const threadHandler = useCallback(
    async (thread_id, item, value) => {
      // If a specific message item is provided (clicked from ThreadContainer rows)
      // open the ChatDetails side panel instead of navigating.
      if (item && typeof item === "object") {
        const getItemRole = () => {
          if (item?.tools_call_data?.length > 0) return "tools_call";
          if (item?.error) return "error";
          if (item?.user || item?.user_urls?.length > 0) return "user";
          if (item?.llm_message || item?.chatbot_message || item?.updated_llm_message) return "assistant";
          return "unknown";
        };
        const currentRole = getItemRole();
        if (currentRole === "assistant") return;
        if (currentRole === "user" || currentRole === "tools_call" || currentRole === "error") {
          setSelectedItem({ variables: item.variables, ...item, value });
          const shouldOpenSidebar = value === "more" || item?.[value] === null;
          setIsSliderOpen(shouldOpenSidebar);
          return;
        }
      }

      // Default: a sidebar thread row was clicked. Navigate URL and open slider.
      const start = searchParams.get("start");
      const end = searchParams.get("end");
      const messageId = searchParams.get("message_id");
      const encodedThreadId = encodeURIComponent(String(thread_id).replace(/&/g, "%26"));
      router.push(
        `${pathName}?version=${searchParams.get("version") || selectedVersion}&thread_id=${encodedThreadId}&subThread_id=${encodedThreadId}&start=${start || ""}&end=${end || ""}${messageId ? `&message_id=${messageId}` : ""}&type=${searchParams.get("type") || ""}`,
        undefined,
        { shallow: true }
      );
      setThreadPage(1);
      setShowThreadDetail(true);
    },
    [pathName, router, searchParams, selectedVersion]
  );

  // Debug logs
  useEffect(() => {
    console.log("History2Page Debug:", {
      historyDataLength: historyData?.length,
      loading,
      sidebarCollapsed,
      resolvedParamsId: resolvedParams?.id,
      selectedVersion,
    });
  }, [historyData, loading, sidebarCollapsed, resolvedParams?.id, selectedVersion]);

  console.log("Rendering History2Page - sidebarCollapsed:", sidebarCollapsed);

  return (
    <div className="history2-page drawer drawer-open drawer-end h-screen bg-[#f4f6f9] text-foreground overflow-hidden">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" defaultChecked />
      {/* Main Dashboard */}
      <div className="drawer-content overflow-y-auto relative flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-border sticky top-0 bg-white/95 backdrop-blur-sm z-20 shrink-0 shadow-[0_1px_0_0_#e5e5e5]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-base-200 rounded-md transition-colors text-muted-foreground hover:text-foreground"
            >
              {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-sm font-semibold">Agent Analytics</h1>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-semibold rounded-full">
              Live
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground shadow-sm"
            >
              <option value="1h">Last hour</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>

            <button className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs font-medium hover:bg-[#f4f6f9] transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground shadow-sm">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm">
              <Settings className="w-3.5 h-3.5" />
              Configure
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-3">
              {stats.map(({ label, value, change, up, icon: Icon }) => (
                <div key={label} className="bg-white border border-border rounded-xl px-4 py-3.5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        up ? "bg-emerald-50" : "bg-red-50"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${up ? "text-emerald-500" : "text-red-400"}`} />
                    </div>
                    <span
                      className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${
                        up ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"
                      }`}
                    >
                      {change}
                    </span>
                  </div>
                  <div className="text-[22px] font-bold tracking-tight leading-none">{value}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-4">
              {/* Requests Over Time */}
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold">Requests Over Time</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Success vs failures</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-[10px] text-muted-foreground">Success</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                      <span className="text-[10px] text-muted-foreground">Failed</span>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={timeSeriesData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                    <XAxis dataKey="time" stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={CHART_STYLE.tooltip} cursor={{ stroke: "#d4d4d4", strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="success"
                      stroke="#10b981"
                      fill="url(#gSuccess)"
                      strokeWidth={2}
                      dot={false}
                      name="Success"
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      fill="url(#gFailed)"
                      strokeWidth={2}
                      dot={false}
                      name="Failed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Response Time */}
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold">Response Time</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">How fast agents are responding</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                      <span className="text-[10px] text-muted-foreground">Typical</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      <span className="text-[10px] text-muted-foreground">Slow</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                      <span className="text-[10px] text-muted-foreground">Worst</span>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={latencyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.grid} />
                    <XAxis dataKey="time" stroke={CHART_STYLE.axis} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke={CHART_STYLE.axis}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}ms`}
                    />
                    <Tooltip
                      contentStyle={CHART_STYLE.tooltip}
                      cursor={{ stroke: "#d4d4d4", strokeWidth: 1 }}
                      formatter={(v, n) => [`${v}ms`, n.charAt(0).toUpperCase() + n.slice(1)]}
                    />
                    <Line
                      type="monotone"
                      dataKey="typical"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={false}
                      name="Typical"
                    />
                    <Line type="monotone" dataKey="slow" stroke="#fbbf24" strokeWidth={2} dot={false} name="Slow" />
                    <Line
                      type="monotone"
                      dataKey="worst"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={false}
                      name="Worst case"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Frequently Asked Questions</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">About history, latency & agents</p>
              </div>
              <div className="space-y-2">
                {faqs.map((faq) => (
                  <FAQItem
                    key={faq.id}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFAQId === faq.id}
                    onToggle={() => setOpenFAQId(openFAQId === faq.id ? null : faq.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - original History Sidebar (themed for dashboard) */}
      <style jsx global>{`
        .history2-page .drawer-side {
          background-color: #ffffff !important;
          border-left: 1px solid #e5e7eb !important;
          border-right: 0 !important;
        }
        .history2-page .drawer-side .menu li > * {
          justify-content: flex-start !important;
          text-align: left !important;
        }
        .history2-page .drawer-side .menu a {
          justify-content: flex-start !important;
        }
        .history2-page .drawer-side .menu .truncate {
          text-align: left !important;
        }
        .history2-page .drawer-side .drawer-overlay {
          display: none !important;
        }
      `}</style>
      {!sidebarCollapsed && (
        <Sidebar
          historyData={historyData}
          threadHandler={threadHandler}
          fetchMoreData={fetchMoreData}
          hasMore={hasMore}
          loading={loading}
          params={resolvedParams}
          searchParams={searchParamsObj}
          setSearchMessageId={setSearchMessageId}
          setPage={setPage}
          setHasMore={setHasMore}
          filterOption={filterOption}
          setFilterOption={setFilterOption}
          searchRef={searchRef}
          setIsFetchingMore={setIsFetchingMore}
          setThreadPage={setThreadPage}
          threadPage={threadPage}
          hasMoreThreadData={hasMoreThreadData}
          setHasMoreThreadData={setHasMoreThreadData}
          selectedVersion={selectedVersion}
          setIsErrorTrue={setIsErrorTrue}
          isErrorTrue={isErrorTrue}
          activeFilterByRef={activeFilterByRef}
        />
      )}

      {/* Thread Detail Slider - opens to the LEFT of the right sidebar so sidebar stays visible */}
      {showThreadDetail && (
        <>
          <div
            className={`fixed inset-y-0 left-0 ${sidebarCollapsed ? "right-0" : "right-[220px]"} bg-black/20 z-40`}
            onClick={() => setShowThreadDetail(false)}
          />
          <div
            className={`fixed top-0 h-full ${sidebarCollapsed ? "right-0" : "right-[220px]"} w-[min(900px,calc(100vw-240px))] bg-white border-l border-border z-50 flex flex-col shadow-[-8px_0_24px_rgba(0,0,0,0.12)] overflow-hidden`}
          >
            <div className="h-14 flex items-center justify-between px-5 border-b border-border shrink-0">
              <h2 className="text-sm font-semibold">Thread Details</h2>
              <button
                onClick={() => setShowThreadDetail(false)}
                className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex min-h-0">
              {/* Batch / Sub-thread side panel (mirrors history page) */}
              <BatchSubthreadPanel
                thread={thread}
                subThreadIdFromURL={searchParamsObj?.subThread_id}
                selectedBatchMessageId={selectedBatchMessageId}
                onSelectBatch={(messageId) =>
                  setSelectedBatchMessageId((prev) => (prev === messageId ? null : messageId))
                }
                onSelectSubThread={(subThreadId) => {
                  setSelectedBatchMessageId(null);
                  const p = new URLSearchParams(searchParams.toString());
                  p.set("subThread_id", encodeURIComponent(subThreadId.replace(/&/g, "%26")));
                  router.push(`${pathName}?${p.toString()}`);
                }}
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <ThreadContainer
                  key={`thread-container-${resolvedParams.id}-${searchParamsObj?.thread_id}-${searchParamsObj?.subThread_id}`}
                  thread={displayThread}
                  filterOption={filterOption}
                  setFilterOption={setFilterOption}
                  isFetchingMore={isFetchingMore}
                  setIsFetchingMore={setIsFetchingMore}
                  setLoading={setLoading}
                  searchMessageId={searchMessageId}
                  setSearchMessageId={setSearchMessageId}
                  params={resolvedParams}
                  pathName={pathName}
                  search={searchParamsObj}
                  historyData={historyData}
                  threadHandler={threadHandler}
                  threadPage={threadPage}
                  setThreadPage={setThreadPage}
                  hasMoreThreadData={hasMoreThreadData}
                  setHasMoreThreadData={setHasMoreThreadData}
                  selectedVersion={selectedVersion}
                  setIsErrorTrue={setIsErrorTrue}
                  isErrorTrue={isErrorTrue}
                />
              </div>
            </div>
          </div>
          <ChatDetails selectedItem={selectedItem} setIsSliderOpen={setIsSliderOpen} isSliderOpen={isSliderOpen} />
        </>
      )}
    </div>
  );
}

export default Protected(History2Page);
