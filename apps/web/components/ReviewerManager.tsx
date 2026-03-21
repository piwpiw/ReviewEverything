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
  "활성 리뷰어만 자동 로그인 운영 대상에 포함합니다.",
  "정렬 우선순위는 auto-login 상태, 연결 상태, provider 우선순위입니다.",
  "실패 코드는 UI와 API에서 동일한 기준으로 표시합니다.",
];

const FAILURE_CODE_LABELS: Record<string, string> = {
  REAUTH_REQUIRED: "재인증 필요",
  LOGIN_ERROR: "로그인 오류",
  NOT_CONNECTED: "미연결",
  CONNECTED: "정상 연결",
};

const failureCodeFromState = (state: string) => {
  if (state === "connected") return "CONNECTED";
  if (state === "needs_reauth") return "REAUTH_REQUIRED";
  if (state === "error") return "LOGIN_ERROR";
  return "NOT_CONNECTED";
};

const SORT_OPTIONS = [
  { value: "auto_signin", label: "자동 로그인 우선" },
  { value: "updated_desc", label: "최근 수정순" },
  { value: "updated_asc", label: "오래된 수정순" },
  { value: "name_asc", label: "이름 오름차순" },
  { value: "name_desc", label: "이름 내림차순" },
];

const stateTone = (state: string) => {
  if (state === "connected") return "text-emerald-300 border-emerald-400/40 bg-emerald-500/10";
  if (state === "needs_reauth") return "text-amber-300 border-amber-400/40 bg-amber-500/10";
  if (state === "error") return "text-rose-300 border-rose-500/40 bg-rose-500/10";
  return "text-slate-300 border-slate-500/40 bg-slate-500/10";
};

const connectionLabel = (state: string) => {
  if (state === "connected") return "정상";
  if (state === "needs_reauth") return "재인증 필요";
  if (state === "error") return "오류";
  return "미연결";
};

const safeDateText = (value: string | null) => (value ? new Date(value).toLocaleString() : "-");
const toArray = (value: Set<number>) => Array.from(value.values());

export default function ReviewerManager({ adminPassword = "" }: { adminPassword?: string }) {
  const getAdminHeader = () => ({
    "x-admin-password": adminPassword || (typeof window !== "undefined" ? window.sessionStorage.getItem("re_admin_pwd") || "" : ""),
  });
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

      const res = await fetch(`/api/admin/creators?${params.toString()}`, { headers: getAdminHeader() });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error || `리뷰어 목록을 불러오지 못했습니다. (${res.status})`);
      }

      const data = (await res.json()) as CreatorsResponse;
      setItems(Array.isArray(data.items) ? data.items : []);
      setSelected(new Set());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "리뷰어 목록을 불러오지 못했습니다.");
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
    return `전체 리뷰어 ${items.length}명, 활성 ${active}명, 자동 로그인 미준비 ${failed}명`;
  }, [items]);

  const toCredentialSummary = useCallback((item: CreatorItem) => {
    const credentials = item.authCredentials
      .slice()
      .sort((a, b) => PROVIDER_PRIORITY.indexOf(a.provider) - PROVIDER_PRIORITY.indexOf(b.provider));

    return credentials.map((credential) => {
      const autoLabel = credential.is_auto_login ? "자동" : "수동";
      const failureCode = failureCodeFromState(credential.connection_state);
      return (
        <span
          key={`${item.id}-${credential.provider}`}
          className={`rounded-md border px-2 py-1 text-[11px] ${stateTone(credential.connection_state)}`}
          title={`채널: ${credential.account_label || "-"} | 프로필: ${credential.profile_name || "-"} | 실패 코드: ${failureCode}`}
        >
          {credential.provider.toUpperCase()}[{autoLabel}] {connectionLabel(credential.connection_state)}
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
      if (!first) return "실패 이력이 없습니다.";
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
      headers: { "Content-Type": "application/json", ...getAdminHeader() },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      throw new Error(body.error || `수정에 실패했습니다. (${res.status})`);
    }
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextName = form.displayName.trim();
    if (!nextName) {
      setStatusMessage("리뷰어 이름은 필수입니다.");
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
        headers: { "Content-Type": "application/json", ...getAdminHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || `생성에 실패했습니다. (${res.status})`);
      }

      resetCreateForm();
      setStatusMessage("리뷰어를 등록했습니다.");
      await loadCreators();
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "리뷰어 등록에 실패했습니다.");
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
      setStatusMessage("리뷰어 정보를 수정했습니다.");
      await loadCreators();
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: CreatorItem) => {
    if (!window.confirm(`"${item.display_name}" 리뷰어를 삭제하시겠습니까?`)) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/creators/${item.id}`, { method: "DELETE", headers: getAdminHeader() });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || `삭제에 실패했습니다. (${res.status})`);
      }

      await loadCreators();
      setStatusMessage("리뷰어를 삭제했습니다.");
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "삭제에 실패했습니다.");
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
      setStatusMessage(`선택한 ${selectedCount}건의 자동 로그인을 ${nextAuto ? "활성화" : "비활성화"}했습니다.`);
      await loadCreators();
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "일괄 변경에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CreatorItem) => {
    setStatusMessage(null);
    try {
      await patchCreator(item.id, { is_active: !item.is_active });
      await loadCreators();
      setStatusMessage(`"${item.display_name}" 상태를 변경했습니다.`);
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
    }
  };

  const handleToggleAuto = async (item: CreatorItem) => {
    setStatusMessage(null);
    try {
      await patchCreator(item.id, { auto_signin_enabled: !item.auto_signin_enabled });
      await loadCreators();
      setStatusMessage(`"${item.display_name}" 자동 로그인 설정을 변경했습니다.`);
    } catch (e: unknown) {
      setStatusMessage(e instanceof Error ? e.message : "자동 로그인 변경에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-3">
        <p className="col-span-3 text-[11px] text-slate-400">정책: {AUTOLOGIN_POLICY[0]}</p>
        <p className="col-span-3 text-[11px] text-slate-400">정렬: {AUTOLOGIN_POLICY[1]}</p>
        <p className="col-span-3 text-[11px] text-slate-400">실패 코드: {AUTOLOGIN_POLICY[2]}</p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 계정명으로 검색"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </label>

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
        >
          <option value="all">전체 provider</option>
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
              {item === "all"
                ? "전체 상태"
                : item === "connected"
                  ? "연결됨"
                  : item === "disconnected"
                    ? "미연결"
                    : item === "needs_reauth"
                      ? "재인증 필요"
                      : item === "error"
                        ? "오류"
                        : item}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <select
          value={autoFilter}
          onChange={(e) => setAutoFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
        >
          {AUTO_FILTERS.map((item) => (
            <option value={item} key={item}>
              {item === "all" ? "전체" : item === "true" ? "자동 로그인 사용" : "자동 로그인 미사용"}
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
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-black text-slate-100"
        >
          <RefreshCcw className="h-4 w-4" />
          새로고침
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-3 text-sm text-slate-300">{statusText}</div>
        <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-7">
          <input
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="리뷰어 이름*"
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={form.handle}
            onChange={(e) => setForm((prev) => ({ ...prev, handle: e.target.value }))}
            placeholder="핸들 또는 계정명"
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
            placeholder="계정 라벨"
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={form.profileName}
            onChange={(e) => setForm((prev) => ({ ...prev, profileName: e.target.value }))}
            placeholder="프로필 이름"
            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
          />
          <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={form.autoSignIn}
              onChange={(e) => setForm((prev) => ({ ...prev, autoSignIn: e.target.checked }))}
            />
            자동 로그인
          </label>
          <button
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-3 py-2 text-sm font-black text-slate-900 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            등록
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-black text-slate-200">리뷰어 목록</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAuto(true)}
              className="rounded-xl border border-emerald-500/40 px-3 py-2 text-xs text-emerald-200"
            >
              자동 로그인 사용
            </button>
            <button
              onClick={() => handleBulkAuto(false)}
              className="rounded-xl border border-amber-500/40 px-3 py-2 text-xs text-amber-200"
            >
              자동 로그인 중지
            </button>
          </div>
        </div>

        {loading ? <div className="text-sm text-slate-400">불러오는 중...</div> : null}
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}
        {statusMessage ? (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{statusMessage}</div>
        ) : null}

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="py-2 pr-3">
                  <button onClick={toggleSelectedAll} className="text-xs">
                    {isAllSelected ? <SquareCheckBig className="h-4 w-4" /> : <SquareX className="h-4 w-4" />}
                  </button>
                </th>
                <th className="py-2 pr-3">리뷰어</th>
                <th className="py-2 pr-3">상태</th>
                <th className="py-2 pr-3">자동 로그인</th>
                <th className="py-2 pr-3">연결</th>
                <th className="py-2 pr-3">최근 연결</th>
                <th className="py-2 pr-3">최근 실패</th>
                <th className="py-2 pr-3">작업</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-5 text-center text-slate-400">
                    등록된 리뷰어가 없습니다.
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
                        className={`rounded-md border px-2 py-1 text-[11px] ${
                          item.is_active
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                            : "border-rose-500/50 bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {item.is_active ? "활성" : "비활성"}
                      </button>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <button
                        onClick={() => void handleToggleAuto(item)}
                        className={`rounded-md border px-2 py-1 text-[11px] ${
                          item.auto_signin_enabled
                            ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                            : "border-slate-500/50 bg-slate-500/10 text-slate-300"
                        }`}
                      >
                        {item.auto_signin_enabled ? "사용" : "중지"}
                      </button>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <div className="flex flex-wrap gap-1">{toCredentialSummary(item)}</div>
                    </td>
                    <td className="py-3 pr-3 align-top text-xs text-slate-300">{safeDateText(item.last_connected_at)}</td>
                    <td className="max-w-[220px] break-words py-3 pr-3 align-top text-xs text-slate-300">{latestFailure(item)}</td>
                    <td className="py-3 pr-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => startEdit(item)} className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200">
                          <Edit className="mr-1 inline-block h-3.5 w-3.5" />
                          수정
                        </button>
                        <button onClick={() => void handleDelete(item)} className="rounded-md border border-rose-600/40 px-2 py-1 text-xs text-rose-200">
                          <Trash2 className="mr-1 inline-block h-3.5 w-3.5" />
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === item.id ? (
                    <tr className="border-b border-slate-800 bg-slate-900/60">
                      <td colSpan={8} className="p-3">
                        <form onSubmit={(e) => void handleEditSave(item.id, e)} className="grid gap-2 md:grid-cols-6">
                          <input
                            value={editForm.displayName}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"
                            placeholder="리뷰어 이름"
                          />
                          <input
                            value={editForm.handle}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, handle: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"
                            placeholder="핸들 또는 계정명"
                          />
                          <input
                            value={editForm.statusNote}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, statusNote: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"
                            placeholder="상태 메모"
                          />
                          <input
                            value={editForm.notes}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                            className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"
                            placeholder="메모"
                          />
                          <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs text-slate-200">
                            <input
                              type="checkbox"
                              checked={editForm.autoSignIn}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, autoSignIn: e.target.checked }))}
                            />
                            자동 로그인
                          </label>
                          <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 text-xs text-slate-200">
                            <input
                              type="checkbox"
                              checked={editForm.isActive}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                            />
                            활성
                          </label>
                          <div className="col-span-6 flex gap-2">
                            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-xs font-black text-slate-900">
                              <Save className="h-4 w-4" />
                              저장
                            </button>
                            <button type="button" onClick={resetEdit} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200">
                              취소
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
