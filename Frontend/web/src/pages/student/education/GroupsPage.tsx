import {
  ArrowRight,
  BookOpen,
  Search,
} from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';
import { groupStudentService } from '../../../api/groupStudentService';
import type { GroupListItemResponse } from '../../../types/group';
import { useNavigate } from 'react-router-dom';
import GroupStudentCard from '../../../components/ui/group/GroupStudentCard';


// type FilterTab = 'Все' | 'Активные' | 'Завершенные';

// const getStatusStyle = (status: StudentGroup['status']) => {
//   if (status === 'Активная') {
//     return { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
//   }

//   return { backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' };
// };

// const getProgressGradient = (progress: number) => {
//   if (progress >= 90) return 'linear-gradient(90deg, #10B981 0%, #34D399 100%)';
//   if (progress >= 60) return 'linear-gradient(90deg, #3B82F6 0%, #4F46E5 100%)';
//   return 'linear-gradient(90deg, #F59E0B 0%, #F97316 100%)';
// };

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] =
    useState<GroupListItemResponse[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState('');


  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);

      const res =
        await groupStudentService.getMyGroups();

      setGroups(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    return groups.filter(group => {
      if (!query) {
        return true;
      }

      return (
        group.name
          .toLowerCase()
          .includes(query) ||
        group.courseName
          .toLowerCase()
          .includes(query) ||
        group.mentorName
          .toLowerCase()
          .includes(query)
      );
    });
  }, [groups, searchTerm]);


  if (loading) {
    return (
      <div style={styles.pageContainer}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>Учебные группы</div>
          <h1 style={styles.pageTitle}>Мои группы</h1>
          <p style={styles.pageSubtitle}>
            Здесь собраны группы, в которых ты учишься или уже учился.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          style={styles.headerButton}
        >
          <span>Назад к панели</span>
          <ArrowRight size={16} />
        </button>
      </header>

      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по названию, курсу или ментору..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>


      {filteredGroups.length > 0 ? (
        <div style={styles.gridContainer}>
          {filteredGroups.map((group) => (
            <GroupStudentCard
              key={group.id}
              group={group}
              onDetails={(id: number) =>
                navigate(`/student/groups/${id}`)
              }
            />
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <BookOpen size={20} color="#94A3B8" />
          <div style={styles.emptyTitle}>Группы не найдены</div>
          <div style={styles.emptyText}>
            Попробуй другой поиск или переключи фильтр.
          </div>
        </div>
      )}

      <style>{`
        .student-group-card {
          transition: all 0.25s ease;
        }
        .student-group-card:hover {
          transform: translateY(-4px);
          border-color: #C7D2FE !important;
          box-shadow: 0 16px 24px -8px rgba(79, 70, 229, 0.10), 0 6px 12px -8px rgba(79, 70, 229, 0.06) !important;
        }
      `}</style>
    </div>
  );
};

const styles = {
  pageContainer: {
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
  kicker: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#2563EB',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '6px',
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
    backgroundColor: '#0F172A',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  toolbar: {
    marginBottom: '18px',
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  searchWrapper: {
    position: 'relative' as const,
    flex: 1,
    minWidth: '280px',
    maxWidth: '420px',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94A3B8',
  },
  searchInput: {
    width: '100%',
    height: '44px',
    padding: '0 16px 0 44px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    background: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    color: '#334155',
    boxSizing: 'border-box' as const,
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  groupCard: {
    width: '100%',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '20px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  topSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '999px',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
  },
  idBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#94A3B8',
  },
  mainContentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  groupAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    flexShrink: 0,
  },
  metaContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    flex: 1,
  },
  groupTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    lineHeight: '1.3',
  },
  courseName: {
    margin: 0,
    fontSize: '13px',
    color: '#64748B',
    fontWeight: 500,
  },
  groupStatusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  },
  infoSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoText: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748B',
  },
  datesBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    padding: '10px 12px',
    border: '1px solid #F1F5F9',
  },
  dateItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  dateDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#E2E8F0',
  },
  dateLabel: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#94A3B8',
    letterSpacing: '0.5px',
  },
  dateValue: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155',
    marginTop: '2px',
  },
  bottomSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    paddingTop: '14px',
    borderTop: '1px solid #F1F5F9',
  },
  periodText: {
    fontSize: '12px',
    color: '#64748B',
    fontWeight: 600,
  },
  manageButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#2563EB',
    fontWeight: 700,
  },
  emptyState: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px',
    backgroundColor: '#FFFFFF',
    border: '1px dashed #CBD5E1',
    borderRadius: '18px',
    color: '#64748B',
    textAlign: 'center' as const,
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0F172A',
    marginTop: '10px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '4px',
    fontWeight: 500,
  },
};

export default GroupsPage;