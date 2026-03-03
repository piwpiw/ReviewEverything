"use client";

import { type FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Edit, Plus, RefreshCcw, Save, Search, SquareCheckBig, SquareX, Trash2 } from "lucide-react";

type CreatorAuthCredential = {
  id?: number;
  provider: string;
  account_label: string | null;
  profile_name: string | null;
  is_auto_login: boolean;
  connection_state: string;
  last_checked_at: string | null;
  last_error_message: string | null;
};

type CreatorItem = {
  id: number;
  display_name: string;
  handle: string | null;
  notes: string | null;
  status_note: string | null;
  is_active: boolean;
  auto_signin_enabled: boolean;
  auth_healthy_count: number;
  auto_signin_ready_count: number;
  last_connected_at: string | null;
  last_failure_at: string | null;
  last_failure_message: string | null;
  authCredentials: CreatorAuthCredential[];
  updated_at: string;
};

type CreatorsResponse = {
  items: CreatorItem[];
  total: number;
};

type CreatorPayload = {
  display_name: string;
  handle?: string;
  status_note?: string;
  auto_signin_enabled: boolean;
  is_active: boolean;
  authCredentials?: Array<{
    provider: string;
    account_label?: string;
    profile_name?: string;
    is_auto_login?: boolean;
    is_primary?: boolean;
  }>;
  notes?: string;
};

const PROVIDERS = ["naver", "instagram", "youtube", "kakaotalk", "google"];
const STATES = ["all", "connected", "disconnected", "needs_reauth", "error"];
const PROVIDER_PRIORITY = ["naver", "instagram", "youtube", "kakaotalk", "google"];
const AUTO_FILTERS = ["all", "true", "false"];
const AUTOLOGIN_POLICY = [
  "Auto login execution policy: only active creators with is_active=true can be configured for auto_signin_enabled.",
  "Sort/filter priority: auto_login + connection_state (connected > needs_reauth > disconnected > error), provider fallback by precedence.",
  "Failure codebook: map REAUTH_REQUIRED, LOGIN_ERROR, NOT_CONNECTED, CONNECTED consistently to user and ops labels.",
];

const FAILURE_CODE_LABELS: Record<string, string> = {
  REAUTH_REQUIRED: "re-auth required",
  LOGIN_ERROR: "login error",
  NOT_CONNECTED: "disconnected",
  CONNECTED: "connected",
};

const failureCodeFromState = (state: string) => {
  if (state === "connected") return "CONNECTED";
  if (state === "needs_reauth") return "REAUTH_REQUIRED";
  if (state === "error") return "LOGIN_ERROR";
  return "NOT_CONNECTED";
};

const SORT_OPTIONS = [
  { value: "auto_signin", label: "auto sign-in" },
  { value: "updated_desc", label: "recent updated" },
  { value: "updated_asc", label: "oldest updated" },
  { value: "name_asc", label: "name A→Z" },
  { value: "name_desc", label: "name Z→A" },
];

const stateTone = (state: string) => {
  if (state === "connected") return "text-emerald-300 border-emerald-400/40 bg-emerald-500/10";
  if (state === "needs_reauth") return "text-amber-300 border-amber-400/40 bg-amber-500/10";
  if (state === "error") return "text-rose-300 border-rose-500/40 bg-rose-500/10";
  return "text-slate-300 border-slate-500/40 bg-slate-500/10";
};

const connectionLabel = (state: string) => {
  if (state === "connected") return "Healthy";
  if (state === "needs_reauth") return "Re-auth required";
  if (state === "error") return "Error";
  return "Disconnected";
};

const safeDateText = (value: string | null) => (value ? new Date(value).toLocaleString() : "-");

const toArray = (value: Set<number>) => Array.from(value.values());

export default function ReviewerManager() {
  const [items, setItems] = useState<CreatorItem[]>([]);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");
  const [state, setState] = useState("all");
  const [autoFilter, setAutoFilter] = useState("all");
  const [sort, setSort] = useState("auto_signin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    displayName: "",
    handle: "",
    statusNote: "",
    notes: "",
    autoSignIn: true,
    isActive: true,
    provider: "naver",
    accountLabel: "",
    profileName: "",
  });

  const [editForm, setEditForm] = useState({
    displayName: "",
    handle: "",
    statusNote: "",
    notes: "",
    autoSignIn: true,
    isActive: true,
  });

  const selectedCount = selected.size;
  const isAllSelected = items.length > 0 && selectedCount === items.length;

  const loadCreators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (provider !== "all") params.set("provider", provider);
      if (state !== "all") params.set("state", state);
      if (autoFilter !== "all") params.set("auto", autoFilter);
      params.set("sort", sort);

      const res = await fetch(`/api/admin/creators?${params.toString()}`);
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error || `Load creators failed (${res.status})`);
      }
      const data = (await res.json()) as CreatorsResponse;
      setItems(Array.isArray(data.items) ? data.items : []);
      setSelected(new Set());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Cannot load creators list");
    } finally {
      setLoading(false);
    }
  }, [search, provider, state, autoFilter, sort]);

  useEffect(() => {
    void loadCreators();
  }, [loadCreators]);

  const statusText = useMemo(() => {
    const failed = items.filter((item) => item.auto_signin_ready_count < 1 && item.authCredentials.length > 0).length;
    const active = items.filter((item) => item.is_active).length;
    return `Total creators: ${items.length}, active: ${active}, auto-login readiness issues: ${failed}`;
  }, [items]);

  const toCredentialSummary = useCallback((item: CreatorItem) => {
    const credentials = item.authCredentials
      .slice()
      .sort((a, b) => PROVIDER_PRIORITY.indexOf(a.provider) - PROVIDER_PRIORITY.indexOf(b.provider));

    return credentials.map((credential) => {
      const isAuto = credential.is_auto_login ? "ON" : "OFF";
      const failureCode = failureCodeFromState(credential.connection_state);
      return (
        <span
          key={`${item.id}-${credential.provider}`}
          className={`px-2 py-1 text-[11px] rounded-md border ${stateTone(credential.connection_state)}`}
          title={`channel: ${credential.account_label || "-"} | profile: ${credential.profile_name || "-"} | error code: ${failureCode}`}
        >
          {credential.provider.toUpperCase()}[{isAuto}] {connectionLabel(credential.connection_state)}
          <span className="ml-1 text-[10px] opacity-80">({FAILURE_CODE_LABELS[failureCode]})</span>
        </span>
      );
    });
  }, []);

  const latestFailure = useCallback((item: CreatorItem) => {
    const failure = item.authCredentials
      .filter((credential) => credential.last_error_message)
      .sort((a, b) => {
        const aAt = a.last_checked_at ? new Date(a.last_checked_at).getTime() : 0;
        const bAt = b.last_checked_at ? new Date(b.last_checked_at).getTime() : 0;
        return bAt - aAt;
      })[0];

    if (!failure) {
      const first = item.authCredentials[0];
      if (!first) return "No failure history";
      const code = failureCodeFromState(first.connection_state);
      return `${first.provider.toUpperCase()} ${FAILURE_CODE_LABELS[code]}`;
    }
    const code = failureCodeFromState(failure.connection_state);
    return `${failure.provider.toUpperCase()} (${FAILURE_CODE_LABELS[code]}): ${failure.last_error_message || "-"}`;
  }, []);

  const resetCreateForm = () => {
    setForm({
      displayName: "",
      handle: "",
      statusNote: "",
      notes: "",
      autoSignIn: true,
      isActive: true,
      provider: "naver",
      accountLabel: "",
      profileName: "",
    });
  };

  const resetEdit = () => {
    setEditingId(null);
    setEditForm({
      displayName: "",
      handle: "",
      statusNote: "",
      notes: "",
      autoSignIn: true,
      isActive: true,
    });
  };

  const startEdit = (item: CreatorItem) => {
    setEditingId(item.id);
    setEditForm({
      displayName: item.display_name,
      handle: item.handle || "",
      statusNote: item.status_note || "",
      notes: item.notes || "",
      autoSignIn: item.auto_signin_enabled,
      isActive: item.is_active,
    });
  };

  const toggleSelectedAll = () => {
    if (isAllSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(items.map((item) => item.id)));
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const patchCreator = async (id: number, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/creators/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error || `Update failed (${res.status})`);
    }
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextName = form.displayName.trim();
    if (!nextName) {
      setStatusMessage("Display name is required");
      return;
    }
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const payload: CreatorPayload = {
        display_name: nextName,
        handle: form.handle.trim() || undefined,
        status_note: form.statusNote.trim() || undefined,
        notes: form.notes.trim() || undefined,
        auto_signin_enabled: form.autoSignIn,
        is_active: form.isActive,
      };
      if (form.provider) {
        payload.authCredentials = [
          {
            provider: form.provider,
            account_label: form.accountLabel.trim() || undefined,
            profile_name: form.profileName.trim() || undefined,
            is_auto_login: true,
            is_primary: true,
          },
        ];
      }

      const res = await fetch("/api/admin/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || `Create failed (${res.status})`);
      }

      resetCreateForm();
      setStatusMessage("Creator added successfully.");
      await loadCreators();
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "Creator add failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSave = async (id: number, e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      display_name: editForm.displayName.trim(),
      handle: editForm.handle.trim() || null,
      status_note: editForm.statusNote.trim() || null,
      notes: editForm.notes.trim() || null,
      auto_signin_enabled: editForm.autoSignIn,
      is_active: editForm.isActive,
    };

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await patchCreator(id, payload);
      resetEdit();
      setStatusMessage("Creator updated successfully.");
      await loadCreators();
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: CreatorItem) => {
    if (!window.confirm(`Delete ${item.display_name}?`)) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/creators/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || `Delete failed (${res.status})`);
      }
      await loadCreators();
      setStatusMessage("Creator deleted.");
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAuto = async (nextAuto: boolean) => {
    if (selectedCount === 0) return;
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      await Promise.all(toArray(selected).map((id) => patchCreator(id, { auto_signin_enabled: nextAuto })));
      setSelected(new Set());
      setStatusMessage(`Bulk update: auto login set to ${nextAuto ? "ON" : "OFF"} for ${selectedCount} creators.`);
      await loadCreators();
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "Bulk auto login update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CreatorItem) => {
    setStatusMessage(null);
    try {
      await patchCreator(item.id, { is_active: !item.is_active });
      await loadCreators();
      setStatusMessage(`"${item.display_name}" status updated`);
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "Status toggle failed");
    }
  };

  const handleToggleAuto = async (item: CreatorItem) => {
    setStatusMessage(null);
    try {
      await patchCreator(item.id, { auto_signin_enabled: !item.auto_signin_enabled });
      await loadCreators();
      setStatusMessage(`"${item.display_name}" auto login updated`);
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "Auto login toggle failed");
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid md:grid-cols-3 gap-3">
        <p className="text-[11px] text-slate-400 col-span-3">Auto login policy: {AUTOLOGIN_POLICY[0]}</p>
        <p className="text-[11px] text-slate-400 col-span-3">Sort policy: {AUTOLOGIN_POLICY[1]}</p>
        <p className="text-[11px] text-slate-400 col-span-3">Failure policy: {AUTOLOGIN_POLICY[2]}</p>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <label className="flex items-center gap-2 border border-slate-800 rounded-xl px-3 py-2 bg-slate-950/40">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creators by name or handle"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
        >
          <option value="all">All providers</option>
          {PROVIDERS.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
        >
          {STATES.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <select
          value={autoFilter}
          onChange={(e) => setAutoFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
        >
          {AUTO_FILTERS.map((item) => (
            <option value={item} key={item}>
              {item === "all" ? "All" : item === "true" ? "ON" : "OFF"}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
        >
          {SORT_OPTIONS.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => void loadCreators()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 text-slate-100 px-3 py-2 text-xs font-black"
        >
          <RefreshCcw className="w-4 h-4" />
          Reload
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="text-sm text-slate-300 mb-3">{statusText}</div>
        <form onSubmit={handleCreate} className="grid md:grid-cols-7 gap-3">
          <input
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="Display name*"
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={form.handle}
            onChange={(e) => setForm((prev) => ({ ...prev, handle: e.target.value }))}
            placeholder="handle"
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          />
          <select
            value={form.provider}
            onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          >
            {PROVIDERS.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={form.accountLabel}
            onChange={(e) => setForm((prev) => ({ ...prev, accountLabel: e.target.value }))}
            placeholder="Account label"
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={form.profileName}
            onChange={(e) => setForm((prev) => ({ ...prev, profileName: e.target.value }))}
            placeholder="Profile name"
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          />
          <label className="flex items-center gap-2 text-sm text-slate-200 border border-slate-700 rounded-xl px-3 py-2 bg-slate-950/40">
            <input
              type="checkbox"
              checked={form.autoSignIn}
              onChange={(e) => setForm((prev) => ({ ...prev, autoSignIn: e.target.checked }))}
            />
            Auto login
          </label>
          <button
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 text-slate-900 font-black px-3 py-2 text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex justify-between gap-2 items-center mb-3">
          <h3 className="text-sm font-black text-slate-200">Creators</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAuto(true)}
              className="px-3 py-2 text-xs rounded-xl border border-emerald-500/40 text-emerald-200"
            >
              Auto login ON
            </button>
            <button
              onClick={() => handleBulkAuto(false)}
              className="px-3 py-2 text-xs rounded-xl border border-amber-500/40 text-amber-200"
            >
              Auto login OFF
            </button>
          </div>
        </div>

        {loading ? <div className="text-slate-400 text-sm">Loading…</div> : null}
        {error ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 px-3 py-2 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : null}
        {statusMessage ? (
          <div className="text-xs border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 px-3 py-2 rounded-lg">{statusMessage}</div>
        ) : null}

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-800">
                <th className="py-2 pr-3">
                  <button onClick={toggleSelectedAll} className="text-xs">
                    {isAllSelected ? <SquareCheckBig className="w-4 h-4" /> : <SquareX className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-2 pr-3">Creator</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Auto login</th>
                <th className="py-2 pr-3">Connection</th>
                <th className="py-2 pr-3">Failure</th>
                <th className="py-2 pr-3">Connected at</th>
                <th className="py-2 pr-3">Failure at</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-5 text-center text-slate-400">
                    No creator found.
                  </td>
                </tr>
              ) : null}
              {items.map((item) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 pr-3">
                      <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} />
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <div className="font-black text-slate-100">{item.display_name}</div>
                      <div className="text-[11px] text-slate-400">{item.handle || "-"}</div>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <button
                        onClick={() => void handleToggleActive(item)}
                        className={`px-2 py-1 rounded-md text-[11px] border ${
                          item.is_active
                            ? "text-emerald-300 border-emerald-500/50 bg-emerald-500/10"
                            : "text-rose-300 border-rose-500/50 bg-rose-500/10"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <button
                        onClick={() => void handleToggleAuto(item)}
                        className={`px-2 py-1 rounded-md text-[11px] border ${
                          item.auto_signin_enabled
                            ? "text-blue-300 border-blue-500/50 bg-blue-500/10"
                            : "text-slate-300 border-slate-500/50 bg-slate-500/10"
                        }`}
                      >
                        {item.auto_signin_enabled ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <div className="flex flex-wrap gap-1">{toCredentialSummary(item)}</div>
                    </td>
                    <td className="py-3 pr-3 align-top text-xs text-slate-300">
                      {safeDateText(item.last_connected_at)}
                    </td>
                    <td className="py-3 pr-3 align-top text-xs text-slate-300 max-w-[220px] break-words">
                      {latestFailure(item)}
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-2 py-1 rounded-md border border-slate-600 text-slate-200 text-xs"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1 inline-block" />
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(item)}
                          className="px-2 py-1 rounded-md border border-rose-600/40 text-rose-200 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1 inline-block" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === item.id ? (
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                      <td colSpan={9} className="p-3">
                        <form onSubmit={(e) => void handleEditSave(item.id, e)} className="grid md:grid-cols-6 gap-2">
                          <input
                            value={editForm.displayName}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"
                            placeholder="Display name"
                          />
                          <input
                            value={editForm.handle}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, handle: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"
                            placeholder="handle"
                          />
                          <input
                            value={editForm.statusNote}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, statusNote: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"
                            placeholder="Status note"
                          />
                          <input
                            value={editForm.notes}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"
                            placeholder="Notes"
                          />
                          <label className="flex items-center text-xs gap-2 text-slate-200 border border-slate-700 rounded-lg px-3">
                            <input
                              type="checkbox"
                              checked={editForm.autoSignIn}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, autoSignIn: e.target.checked }))}
                            />
                            Auto login
                          </label>
                          <label className="flex items-center text-xs gap-2 text-slate-200 border border-slate-700 rounded-lg px-3">
                            <input
                              type="checkbox"
                              checked={editForm.isActive}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                            />
                            Active
                          </label>
                          <div className="flex gap-2 col-span-6">
                            <button
                              type="submit"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200 text-slate-900 text-xs font-black"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={resetEdit}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-200 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
