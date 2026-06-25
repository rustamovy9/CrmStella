// pages/mentor/dashboard/MentorDashboard.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Users,
} from "lucide-react";

import { dashboardService } from "../../../api/dashboardService";
import type { MentorDashboardResponse } from "../../../types/mentor";
import GroupStudentCard from "../../../components/ui/group/GroupStudentCard";

const MentorDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [dashboard, setDashboard] =
    useState<MentorDashboardResponse>();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const data =
        await dashboardService.getMentorDashboard();

      setDashboard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}

      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>
            Панель ментора
          </h1>

          <p style={styles.pageSubtitle}>
            Управляйте своими группами и
            отслеживайте занятия.
          </p>
        </div>

        <button
          type="button"
          style={styles.headerButton}
          onClick={() =>
            navigate("/mentor/groups")
          }
        >
          <span>Мои группы</span>

          <ArrowRight size={16} />
        </button>
      </header>

      {/* Статистика */}

      <div style={styles.statsGrid}>
        <div style={styles.metricCard}>
          <div
            style={{
              ...styles.metricIcon,
              background: "#EEF2FF",
              color: "#4F46E5",
            }}
          >
            <BookOpen size={22} />
          </div>

          <div>
            <div style={styles.metricValue}>
              {dashboard?.activeGroups ?? 0}
            </div>

            <div style={styles.metricTitle}>
              Мои группы
            </div>

            <div style={styles.metricSubtitle}>
              Активных групп
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div
            style={{
              ...styles.metricIcon,
              background: "#ECFDF5",
              color: "#059669",
            }}
          >
            <Users size={22} />
          </div>

          <div>
            <div style={styles.metricValue}>
              {dashboard?.totalStudents ?? 0}
            </div>

            <div style={styles.metricTitle}>
              Студенты
            </div>

            <div style={styles.metricSubtitle}>
              Обучаются сейчас
            </div>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div
            style={{
              ...styles.metricIcon,
              background: "#FEF3C7",
              color: "#D97706",
            }}
          >
            <Calendar size={22} />
          </div>

          <div>
            <div style={styles.metricValue}>
              {dashboard?.lessonsToday ?? 0}
            </div>

            <div style={styles.metricTitle}>
              Сегодня
            </div>

            <div style={styles.metricSubtitle}>
              Занятий по расписанию
            </div>
          </div>
        </div>
      </div>

      {/* Маленькие карточки */}

      <div style={styles.summaryStrip}>
        <div style={styles.summaryChip}>
          <Users size={16} />
          <span>
            Всего студентов:{" "}
            {dashboard?.totalStudents ?? 0}
          </span>
        </div>

        <div style={styles.summaryChip}>
          <BookOpen size={16} />
          <span>
            Групп:{" "}
            {dashboard?.activeGroups ?? 0}
          </span>
        </div>

        <div style={styles.summaryChip}>
          <Calendar size={16} />
          <span>
            Сегодня занятий:{" "}
            {dashboard?.lessonsToday ?? 0}
          </span>
        </div>
      </div>

      {/* Группы */}

      <section
        style={styles.groupsSection}
      >
        <div
          style={styles.sectionHeader}
        >
          <div>
            <h2
              style={styles.sectionTitle}
            >
              Мои группы
            </h2>

            <p
              style={
                styles.sectionSubtitle
              }
            >
              Все группы, которыми вы
              управляете
            </p>
          </div>

          <div style={styles.countBadge}>
            {dashboard?.groups.length ?? 0}{" "}
            групп
          </div>
        </div>

        {dashboard?.groups.length ? (
          <div style={styles.grid}>
            {dashboard.groups.map(
              (group) => (
                <GroupStudentCard
                  key={group.id}
                  group={group}
                  onDetails={(id) =>
                    navigate(
                      `/mentor/groups/${id}`
                    )
                  }
                />
              )
            )}
          </div>
        ) : (
          <div style={styles.empty}>
            У вас пока нет групп
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  page: {
    padding: "32px",
    backgroundColor: "#F8FAFC",
    minHeight: "100vh",
    boxSizing: "border-box" as const,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  header: {
    marginBottom: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap" as const,
  },

  pageTitle: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#0F172A",
    margin: 0,
    letterSpacing: "-0.02em",
  },

  pageSubtitle: {
    fontSize: "14px",
    color: "#64748B",
    margin: "6px 0 0 0",
    fontWeight: 500,
  },

  headerButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow:
      "0 10px 20px rgba(37,99,235,0.18)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },

  metricCard: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "24px",
    padding: "24px",
    display: "flex",
    gap: "18px",
    alignItems: "center",
  },

  metricIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  metricValue: {
    fontSize: "32px",
    fontWeight: 800,
    color: "#0F172A",
  },

  metricTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#334155",
  },

  metricSubtitle: {
    fontSize: "13px",
    color: "#64748B",
    marginTop: "4px",
  },

  summaryStrip: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
    marginBottom: "32px",
  },

  summaryChip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "999px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#334155",
    fontWeight: 600,
  },

  groupsSection: {
    marginTop: "8px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: "16px",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#0F172A",
  },

  sectionSubtitle: {
    margin: "6px 0 0",
    color: "#64748B",
    fontSize: "14px",
  },

  countBadge: {
    padding: "8px 14px",
    borderRadius: "999px",
    background: "#EEF2FF",
    color: "#4F46E5",
    fontWeight: 700,
    fontSize: "13px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "24px",
  },

  empty: {
    padding: "48px",
    textAlign: "center" as const,
    background: "#FFFFFF",
    borderRadius: "24px",
    border: "1px dashed #CBD5E1",
    color: "#64748B",
    fontWeight: 600,
  },
};

export default MentorDashboard;