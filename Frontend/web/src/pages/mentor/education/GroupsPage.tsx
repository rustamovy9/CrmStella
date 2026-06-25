import {
  ArrowRight,
  BookOpen,
  Search,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { groupStudentService } from '../../../api/groupStudentService';
import type { GroupListItemResponse } from '../../../types/group';
import GroupCard from '../../../components/ui/group/GroupCard';

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
        await groupStudentService
          .getMentorGroups();

      setGroups(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const query =
      searchTerm
        .trim()
        .toLowerCase();

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
          <div style={styles.kicker}>
            Учебные группы
          </div>

          <h1 style={styles.pageTitle}>
            Мои группы
          </h1>

          <p style={styles.pageSubtitle}>
            Здесь отображаются все
            группы, закреплённые за вами.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate('/mentor/dashboard')
          }
          style={styles.headerButton}
        >
          <span>Назад к панели</span>

          <ArrowRight size={16} />
        </button>
      </header>

      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search
            size={18}
            style={styles.searchIcon}
          />

          <input
            type="text"
            placeholder="Поиск по названию группы или курсу..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            style={styles.searchInput}
          />
        </div>
      </div>

      {filteredGroups.length > 0 ? (
        <div style={styles.gridContainer}>
          {filteredGroups.map(group => (
            <GroupCard
                  key={group.id}
                  group={group}
                  onDetails={(id) => navigate(
                      `/mentor/groups/${id}`
                  )} onStatusToggle={function (id: number, currentStatus: string): void {
                      throw new Error('Function not implemented.');
                  } }            />
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <BookOpen
            size={20}
            color="#94A3B8"
          />

          <div style={styles.emptyTitle}>
            Группы не найдены
          </div>

          <div style={styles.emptyText}>
            За вами пока не закреплено
            ни одной группы.
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    padding: '32px',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    boxSizing: 'border-box' as const,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
    gridTemplateColumns:
      'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
    width: '100%',
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