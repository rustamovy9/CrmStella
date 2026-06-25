import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

import MetricCard from "../../../components/ui/MetricCard";
import ScheduleTable from "../../../components/ui/schedule/ScheduleTable";
import scheduleService from "../../../api/scheduleService";

import type { ScheduleResponse } from "../../../types/schedule";

const DAYS = [
  { key: "Monday", label: "Понедельник", short: "Пн" },
  { key: "Tuesday", label: "Вторник", short: "Вт" },
  { key: "Wednesday", label: "Среда", short: "Ср" },
  { key: "Thursday", label: "Четверг", short: "Чт" },
  { key: "Friday", label: "Пятница", short: "Пт" },
  { key: "Saturday", label: "Суббота", short: "Сб" },
  { key: "Sunday", label: "Воскресенье", short: "Вс" },
];

const GROUP_PALETTE = [
  { bg: "#EEF2FF", text: "#4338CA", dot: "#6366F1" },
  { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
  { bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  { bg: "#FDF4FF", text: "#7E22CE", dot: "#A855F7" },
  { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
];

const getGroupColor = (groupId: number) =>
  GROUP_PALETTE[groupId % GROUP_PALETTE.length];

const formatTime = (t: string) => t?.slice(0, 5) ?? "—";

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      })
    : null;

const SchedulesPage: React.FC = () => {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("all");

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // если есть отдельный endpoint для ментора
      // const res = await scheduleService.getMentorSchedules();

      // если нет отдельного endpoint
      const res = await scheduleService.getAll({
        page: 1,
        pageSize: 100,
      });

      if (res.data?.isSuccess) {
        const data = res.data.data;
        setSchedules(data?.items ?? data ?? []);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Не удалось загрузить расписание",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const search =
        !searchTerm ||
        s.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.room?.toLowerCase().includes(searchTerm.toLowerCase());

      const day = dayFilter === "all" || s.dayOfWeek === dayFilter;

      return search && day;
    });
  }, [schedules, searchTerm, dayFilter]);

  const byDay: Record<string, ScheduleResponse[]> = {};

  DAYS.forEach((d) => {
    byDay[d.key] = [];
  });

  filteredSchedules.forEach((s) => {
    if (byDay[s.dayOfWeek]) {
      byDay[s.dayOfWeek].push(s);
    }
  });

  const maxRows = Math.max(...DAYS.map((d) => byDay[d.key].length), 1);

  const todayKey = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][new Date().getDay()];

  const todayCount = filteredSchedules.filter(
    (x) => x.dayOfWeek === todayKey,
  ).length;

  const groupsCount = new Set(filteredSchedules.map((x) => x.groupId)).size;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Моё расписание</h2>

          <p style={s.subtitle}>Ваши занятия по группам</p>
        </div>
      </div>

      <div style={s.metrics}>
        <MetricCard
          isMain
          value={filteredSchedules.length}
          label="МОИ ЗАНЯТИЯ"
        />

        <MetricCard variant="blue" value={groupsCount} label="МОИ ГРУППЫ" />

        <MetricCard variant="green" value={todayCount} label="СЕГОДНЯ" />
      </div>

      <div style={s.toolbar}>
        <div style={s.searchBox}>
          <Search size={16} />

          <input
            placeholder="Поиск по группе..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={s.input}
          />
        </div>

        <div style={s.filterBox}>
          <Filter size={14} />

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            style={s.select}
          >
            <option value="all">Все дни</option>

            {DAYS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={s.center}>Загрузка...</div>
      ) : error ? (
        <div style={s.center}>{error}</div>
      ) : (
        <ScheduleTable
          visibleDays={DAYS}
          byDay={byDay}
          maxRows={maxRows}
          todayKey={todayKey}
          getGroupColor={getGroupColor}
          formatTime={formatTime}
          formatDate={formatDate}
          onNavigate={(groupId) => navigate(`/mentor/groups/${groupId}`)}
          onEdit={() => {}}
          onDelete={() => {}}
          styles={s}
          readOnly={true}
        />
      )}
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px",
    background: "#F8FAFC",
    minHeight: "100vh",
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 700,
    color: "#0F172A",
  },

  subtitle: {
    marginTop: "4px",
    color: "#64748B",
    fontSize: "14px",
  },

  metrics: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },

  toolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "0 12px",
    height: "42px",
    minWidth: "280px",
  },

  input: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "14px",
  },

  filterBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "0 12px",
    height: "42px",
  },

  select: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    cursor: "pointer",
  },

  center: {
    display: "flex",
    justifyContent: "center",
    padding: "80px",
    color: "#64748B",
  },
};

export default SchedulesPage;
