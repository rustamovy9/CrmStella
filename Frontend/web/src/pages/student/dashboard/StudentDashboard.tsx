import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import MetricCard from '../../../components/ui/MetricCard';
import { profileService, type ProfileResponse } from '../../../api/profileService';
import { dashboardService } from '../../../api/dashboardService';
import type { StudentDashboardResponse } from '../../../types/studentDashboard';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return { fullName: '' };

    const parsed = JSON.parse(raw);
    return {
      fullName: typeof parsed?.fullName === 'string' ? parsed.fullName : '',
    };
  } catch {
    return { fullName: '' };
  }
};

const getScoreBadgeStyle = (score: number) => {
  if (score >= 90) {
    return { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
  }

  if (score >= 75) {
    return { backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' };
  }

  return { backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' };
};

const getGroupStatusStyle = (status: string) => {
  if (status === 'Активная') {
    return { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
  }

  return { backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' };
};

// const getProgressGradient = (progress: number) => {
//   if (progress >= 90) return 'linear-gradient(90deg, #10B981 0%, #34D399 100%)';
//   if (progress >= 60) return 'linear-gradient(90deg, #3B82F6 0%, #4F46E5 100%)';
//   return 'linear-gradient(90deg, #F59E0B 0%, #F97316 100%)';
// };

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const data =
        await dashboardService.getStudentDashboard();

      setDashboard(data);
    } finally {
      setLoading(false);
    }
  };

  const storedUser = getStoredUser();
  const displayName = profile?.fullName || storedUser.fullName || 'Студент';
  const firstName = displayName.trim().split(/\s+/)[0] || 'Студент';

  if (loading) {
    return <div style={styles.centeredState}>Загрузка студенческой панели...</div>;
  }

  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Привет, {firstName}!</h1>
          <p style={styles.pageSubtitle}>
            Здесь ты видишь успеваемость, посещаемость и свои группы.
          </p>
        </div>

        <button
          onClick={() => navigate('/student/groups')}
          style={styles.headerButton}
          type="button"
        >
          <span>Мои группы</span>
          <ArrowRight size={16} />
        </button>
      </header>

      <div style={styles.statsGrid}>
        <MetricCard
          value={`${dashboard?.averageScore}/5`}
          label="Средняя оценка"
          subLabel="По последним результатам"
          // isMain={true}
          variant="blue"
        />
        <MetricCard
          value={`${dashboard?.attendancePercent}%`}
          label="Посещаемость"
          subLabel={`${dashboard?.absences} пропуск(а/ов)`}
          variant="green"
        />
        <MetricCard
          value={dashboard?.activeGroups ?? 0}
          label="Активные группы"
          subLabel="Где ты сейчас учишься"
          variant="blue"
        />
        <MetricCard
          value={dashboard?.completedGroups ?? 0}
          label="Завершенные группы"
          subLabel="Где курс уже закрыт"
          variant="amber"
        />
      </div>

      <div style={styles.summaryStrip}>
        <div style={styles.summaryChip}>
          <Clock size={16} />
          <span>Опоздания: {dashboard?.lateMinutes} мин</span>
        </div>
        <div style={styles.summaryChip}>
          <CheckCircle2 size={16} />
          <span>Пропуски: {dashboard?.absences}</span>
        </div>
        <div style={styles.summaryChip}>
          <Users size={16} />
          <span>Всего групп: {dashboard?.totalGroups ?? 0}</span>
        </div>
      </div>

      <div style={styles.contentLayout}>
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div style={styles.titleWithIcon}>
              <div style={{ ...styles.iconBadge, backgroundColor: '#ECFDF5', color: '#10B981' }}>
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 style={styles.sectionTitle}>Успеваемость</h3>
                <p style={styles.sectionSubtitle}>Последние оценки и комментарии</p>
              </div>
            </div>
            <span style={styles.countBadge}>{dashboard?.recentScores.length ?? 0} результата</span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Урок</th>
                  <th style={styles.th}>Оценка</th>
                  <th style={styles.th}>Комментарий</th>
                  <th style={styles.th}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.recentScores.map(score => (
                  <tr key={`${score.lessonName}-${score.date}`} style={styles.tr}>
                    <td style={styles.lessonTd}>{score.lessonName}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.scoreBadge, ...getScoreBadgeStyle(score.score) }}>
                        {score.score}/5
                      </span>
                    </td>
                    <td style={styles.td}>{score.comment}</td>
                    <td style={styles.td}>{score.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div style={styles.titleWithIcon}>
              <div style={{ ...styles.iconBadge, backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                <BookOpen size={18} />
              </div>
              <div>
                <h3 style={styles.sectionTitle}>Мои группы</h3>
                <p style={styles.sectionSubtitle}>Активные и завершенные группы</p>
              </div>
            </div>
            <span style={{ ...styles.countBadge, backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              {dashboard?.totalGroups ?? 0} группы
            </span>
          </div>

          <div style={styles.groupsList}>
            {dashboard?.groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => navigate(`/student/groups/${group.id}`)}
                style={styles.groupCard}
              >
                <div style={styles.groupTopRow}>
                  <div>
                    <div style={styles.groupName}>{group.name}</div>
                    <div style={styles.groupMeta}>{group.courseName}</div>
                  </div>

                  <span style={{ ...styles.groupStatusBadge, ...getGroupStatusStyle(group.status) }}>
                    {group.status}
                  </span>
                </div>

                <div style={styles.groupInfoGrid}>
                  <div style={styles.groupInfoItem}>
                    <span style={styles.groupInfoLabel}>Преподаватель</span>
                    <strong style={styles.groupInfoValue}>{group.mentorName}</strong>
                  </div>
                  <div style={styles.groupInfoItem}>
                    <span style={styles.groupInfoLabel}>Расписание</span>
                    <strong style={styles.groupInfoValue}>Не указано</strong>
                  </div>
                  <div style={styles.groupInfoItem}>
                    <span style={styles.groupInfoLabel}>Уроков</span>
                    <strong style={styles.groupInfoValue}>-</strong>
                  </div>
                  <div style={styles.groupInfoItem}>
                    <span style={styles.groupInfoLabel}>Прогресс</span>
                    <strong style={styles.groupInfoValue}>-%</strong>
                  </div>
                </div>

                <div style={styles.progressBlock}>
                  <div style={styles.progressTrack}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `-%`,
                        // background: getProgressGradient(group.progressPercent),
                      }}
                    />
                  </div>
                </div>

                <div style={styles.groupFooter}>
                  <span style={styles.groupPeriod}>
                    {new Date(group.startDate).toLocaleDateString('ru-RU')}
                    {' — '}
                    {new Date(group.endDate).toLocaleDateString('ru-RU')}
                  </span>
                  <span style={styles.openText}>
                    Подробнее <ArrowRight size={14} />
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/student/groups')}
            style={styles.secondaryButton}
          >
            <span>Открыть все группы</span>
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    padding: '32px',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    boxSizing: 'border-box' as const,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    marginBottom: '28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: '6px 0 0 0',
    fontWeight: 500,
  },
  headerButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 16px',
    backgroundColor: '#2563EB',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(37, 99, 235, 0.18)',
  },
  statsGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '20px',
    marginBottom: '18px',
    width: '100%',
  },
  summaryStrip: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    marginBottom: '22px',
  },
  summaryChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #E2E8F0',
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.03)',
  },
  contentLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.04)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  titleWithIcon: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: '12px',
    color: '#64748B',
    margin: '3px 0 0 0',
    fontWeight: 400,
  },
  countBadge: {
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#F1F5F9',
    color: '#475569',
    padding: '5px 10px',
    borderRadius: '999px',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto' as const,
    border: '1px solid #F1F5F9',
    borderRadius: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #F1F5F9',
  },
  th: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    whiteSpace: 'nowrap' as const,
  },
  tr: {
    borderBottom: '1px solid #F8FAFC',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#334155',
    verticalAlign: 'middle',
  },
  lessonTd: {
    padding: '14px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
    maxWidth: '240px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  scoreBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  },
  groupsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    marginBottom: '18px',
  },
  groupCard: {
    width: '100%',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: '18px',
    padding: '18px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  },
  groupTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  groupName: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0F172A',
    letterSpacing: '-0.01em',
  },
  groupMeta: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '4px',
    fontWeight: 500,
  },
  groupStatusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  },
  groupInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginBottom: '14px',
  },
  groupInfoItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  groupInfoLabel: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 600,
  },
  groupInfoValue: {
    fontSize: '13px',
    color: '#0F172A',
    fontWeight: 700,
  },
  progressBlock: {
    marginBottom: '14px',
  },
  progressTrack: {
    width: '100%',
    height: '9px',
    borderRadius: '999px',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
  },
  groupFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  groupPeriod: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 600,
  },
  openText: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#2563EB',
    fontWeight: 700,
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: '1px solid #C7D2FE',
    borderRadius: '14px',
    padding: '12px 16px',
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  centeredState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#64748B',
  },
};

export default StudentDashboard;