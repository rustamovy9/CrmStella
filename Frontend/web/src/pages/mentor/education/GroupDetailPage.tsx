import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Loader2, AlertCircle, Info } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { groupStudentService } from "../../../api/groupStudentService";
import { StudentTable } from "../../../components/ui/group/StudentTable";

import type { GroupStudentResponse } from "../../../types/groupStudent";

import type { MentorGroupDetailsResponse } from "../../../types/groupStudent";
import { MentorActionCards } from "../../../components/ui/group/MentorActionCard";

type FilterTab = "all" | "active" | "left" | "transferred";

const MentorGroupDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const groupId = Number(id);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [group, setGroup] = useState<MentorGroupDetailsResponse | null>(null);

  const [students, setStudents] = useState<GroupStudentResponse[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [filterTab, setFilterTab] = useState<FilterTab>("active");

  const loadData = useCallback(async () => {
    if (isNaN(groupId)) {
      navigate("/mentor/groups");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await groupStudentService.getMentorGroup(groupId);

      setGroup(res);
      setStudents(res.students ?? []);
    } catch (e: any) {
      console.error(e);

      setError(e?.response?.data?.message ?? "Не удалось загрузить группу");
    } finally {
      setLoading(false);
    }
  }, [groupId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    return {
      active: students.filter((x) => x.isActive).length,

      transferred: students.filter((x) => !x.isActive && x.isTransferred)
        .length,

      removed: students.filter((x) => !x.isActive && !x.isTransferred).length,

      total: students.length,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return students.filter((s) => {
      const matches =
        !query ||
        s.studentName?.toLowerCase().includes(query) ||
        s.studentEmail?.toLowerCase().includes(query) ||
        s.studentPhone?.toLowerCase().includes(query);

      if (!matches) return false;

      switch (filterTab) {
        case "active":
          return s.isActive;

        case "transferred":
          return !s.isActive && s.isTransferred;

        case "left":
          return !s.isActive && !s.isTransferred;

        default:
          return true;
      }
    });
  }, [students, searchTerm, filterTab]);

  if (loading) {
    return (
      <div style={styles.center}>
        <Loader2 size={36} className="spin" />

        <p>Загрузка группы...</p>

        <style>{`
          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <AlertCircle size={48} color="#EF4444" />

        <h3>{error}</h3>

        <button
          style={styles.backButton}
          onClick={() => navigate("/mentor/groups")}
        >
          Назад
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div style={styles.center}>
        <Info size={48} color="#64748B" />

        <h3>Группа не найдена</h3>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button
          style={styles.backButton}
          onClick={() => navigate("/mentor/groups")}
        >
          <ArrowLeft size={16} />
          Назад
        </button>
      </div>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{group.name}</h1>

          <p style={styles.subtitle}>Информация о группе и список студентов</p>
        </div>
      </div>

      <MentorActionCards group={group} onNavigate={navigate} />

      <div style={styles.studentsSection}>
        <div style={styles.studentsHeader}>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 700,
              color: "#0F172A",
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            Студенты
          </h2>

          <div style={styles.searchWrapper}>
            <Search size={18} />

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск студента..."
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            style={filterTab === "active" ? styles.activeTab : styles.tab}
            onClick={() => setFilterTab("active")}
          >
            Активные ({stats.active})
          </button>

          <button
            style={filterTab === "transferred" ? styles.activeTab : styles.tab}
            onClick={() => setFilterTab("transferred")}
          >
            Переведённые ({stats.transferred})
          </button>

          <button
            style={filterTab === "left" ? styles.activeTab : styles.tab}
            onClick={() => setFilterTab("left")}
          >
            Исключённые ({stats.removed})
          </button>

          <button
            style={filterTab === "all" ? styles.activeTab : styles.tab}
            onClick={() => setFilterTab("all")}
          >
            Все ({stats.total})
          </button>
        </div>

        {filteredStudents.length > 0 ? (
          <StudentTable
            students={filteredStudents}
            groupId={groupId}
            groupStatus={group.status}
            // readOnly
            onRemove={() => {}}
            onTransfer={() => {}}
            onCharged={() => {}}
          />
        ) : (
          <div style={styles.emptyState}>
            <Info size={28} />

            <p>Студенты не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "32px",
    background: "#F8FAFC",
    minHeight: "100vh",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
  },

  topBar: {
    marginBottom: "24px",
  },

  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#0F172A",
    color: "#fff",
    cursor: "pointer",
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: "8px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#64748B",
  },

  studentsSection: {
    marginTop: "32px",
  },

  studentsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap" as const,
    marginBottom: "20px",
  },

  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "10px 14px",
  },

  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    fontWeight: 500,
    color: "#334155",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  tabs: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
    marginBottom: "20px",
  },

  tab: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
    background: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  activeTab: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #2563EB",
    background: "#DBEAFE",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 700,
    color: "#2563EB",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "12px",
    padding: "48px",
    background: "#fff",
    borderRadius: "18px",
    border: "1px dashed #CBD5E1",
    color: "#64748B",
  },
};

export default MentorGroupDetailPage;
