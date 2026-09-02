import React, { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { auditApi } from "../../api/audit.api";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/ui/Skeleton";
import type { AuditLog } from "../../types";

const AUDIT_ACTIONS = [
  { label: "All Actions", value: "" },
  { label: "User Login", value: "USER_LOGIN" },
  { label: "Request Created", value: "TRAVEL_REQUEST_CREATED" },
  { label: "Request Approved", value: "TRAVEL_REQUEST_APPROVED" },
  { label: "Request Rejected", value: "TRAVEL_REQUEST_REJECTED" },
  { label: "Request Cancelled", value: "TRAVEL_REQUEST_CANCELLED" },
  { label: "Flight Booked", value: "BOOKING_CREATED" },
  { label: "Ticket Uploaded", value: "TICKET_UPLOADED" },
  { label: "Excel Exported", value: "REPORT_EXPORTED_EXCEL" },
];

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadAuditLogs = async (action?: string, targetPage: number = 1) => {
    setIsLoading(true);
    try {
      const res = await auditApi.getAuditLogs({
        action: action || undefined,
        page: targetPage,
        limit: 20,
      });
      setLogs(res.data);
      setPage(res.page);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAuditLogs(actionFilter, 1);
  }, [actionFilter]);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("APPROVED") || action.includes("LOGIN")) return "success";
    if (action.includes("REJECTED") || action.includes("CANCELLED")) return "danger";
    if (action.includes("CREATED") || action.includes("BOOKING")) return "info";
    return "neutral";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security & Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable log stream of administrative decisions, authentication events, and workflow transitions.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          Total Events: <strong>{totalCount}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padding="sm">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide shrink-0">
            Event Filter:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {AUDIT_ACTIONS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActionFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  actionFilter === tab.value
                    ? "bg-slate-900 text-white shadow-sm font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card padding="none">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No audit records matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action Event</th>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Actor ID</th>
                  <th className="py-3 px-6">IP Address</th>
                  <th className="py-3 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6 font-mono text-xs text-slate-700">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge
                        variant={getActionBadgeVariant(log.action)}
                        size="sm"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs text-slate-600">
                      {log.entityType}
                      {log.entityId && (
                        <span className="text-slate-400 block text-[10px]">
                          ID: {log.entityId.substring(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs text-slate-800">
                      {log.actorEmployeeId || log.actorUserId ? (
                        <span>
                          {log.actorEmployeeId || log.actorUserId?.substring(0, 8)}
                        </span>
                      ) : (
                        <span className="text-slate-400">System</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-xs text-slate-500">
                      {log.ipAddress || "—"}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadAuditLogs(actionFilter, page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadAuditLogs(actionFilter, page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Audit Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Inspection"
        subtitle={`Event ID: ${selectedLog?.id}`}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedLog(null)}>
            Close
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase block text-[10px]">
                  Action
                </span>
                <span className="font-bold text-slate-900">
                  {selectedLog.action}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase block text-[10px]">
                  Timestamp
                </span>
                <span className="text-slate-700">
                  {new Date(selectedLog.createdAt).toISOString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase block text-[10px]">
                  Actor (Employee / User ID)
                </span>
                <span className="text-slate-700">
                  {selectedLog.actorEmployeeId || selectedLog.actorUserId || "System"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase block text-[10px]">
                  Entity Type & ID
                </span>
                <span className="text-slate-700">
                  {selectedLog.entityType}: {selectedLog.entityId || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase block text-[10px]">
                  IP Address
                </span>
                <span className="text-slate-700">
                  {selectedLog.ipAddress || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase block text-[10px]">
                  User Agent
                </span>
                <span className="text-slate-700 truncate block max-w-xs">
                  {selectedLog.userAgent || "Unknown"}
                </span>
              </div>
            </div>

            {/* Old vs New Value JSON */}
            {(selectedLog.oldValue || selectedLog.newValue) && (
              <div className="space-y-2">
                <span className="font-semibold text-slate-800 uppercase text-[11px] block">
                  State Mutation Payloads
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedLog.oldValue && (
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-48">
                      <span className="text-amber-400 text-[10px] uppercase font-bold block mb-1">
                        Previous State (Old)
                      </span>
                      <pre className="text-[11px]">
                        {JSON.stringify(selectedLog.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newValue && (
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-48">
                      <span className="text-emerald-400 text-[10px] uppercase font-bold block mb-1">
                        Mutated State (New)
                      </span>
                      <pre className="text-[11px]">
                        {JSON.stringify(selectedLog.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata JSON */}
            {selectedLog.metadata && (
              <div className="space-y-1">
                <span className="font-semibold text-slate-800 uppercase text-[11px] block">
                  Context Metadata
                </span>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto max-h-36">
                  <pre className="text-[11px]">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
