import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowRight,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    Users,
} from 'lucide-react';
import { groupStudentService } from '../../../api/groupStudentService';
import type { StudentGroupDetailsResponse } from '../../../types/groupStudent';

type MemberTab = 'all' | 'active';

const getGroupStatusStyle = (status: StudentGroupDetailsResponse['status']) => {
    if (status === 'Активная') {
        return { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
    }

    return { backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' };
};

const GroupDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState<MemberTab>('active');
    const [loading, setLoading] = useState(true);
    const [group, setGroup] = useState<StudentGroupDetailsResponse | null>(null);
    const [journalHover, setJournalHover] = useState(false);


    const filteredMembers = useMemo(() => {
        if (!group) return [];

        if (activeTab === 'active') {
            return group.students.filter(
                student => student.isActive
            );
        }
        return group.students;
    }, [group, activeTab]);

    useEffect(() => {
        loadGroup();
    }, [id]);

    const loadGroup = async () => {
        if (!id) return;

        try {
            setLoading(true);

            const data =
                await groupStudentService.getMyGroup(
                    Number(id)
                );

            setGroup(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!group) {
        return (
            <div style={styles.pageContainer}>
                <div style={styles.emptyStateBox}>
                    <h1 style={styles.pageTitle}>Группа не найдена</h1>
                    <p style={styles.pageSubtitle}>
                        Проверь ссылку или вернись к списку групп.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/student/groups')}
                        style={styles.backButton}
                    >
                        <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                        <span>Назад к группам</span>
                    </button>
                </div>
            </div>
        );
    }

    const activeStudentsCount =
        group.students.filter(
            student => student.isActive
        ).length;

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <button
                    type="button"
                    onClick={() => navigate('/student/groups')}
                    style={styles.backButton}
                >
                    <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                    <span>Назад к списку групп</span>
                </button>

            </header>

            <section style={styles.heroCard}>
                <div style={styles.heroTopRow}>
                    <div style={styles.heroTitleBlock}>


                        <div>
                            <div style={styles.kicker}>Группа</div>
                            <h1 style={styles.pageTitle}>{group.name}</h1>
                        </div>
                    </div>

                    <div style={styles.heroRightBlock}>
                        <span style={{ ...styles.statusBadge, ...getGroupStatusStyle(group.status) }}>
                            {group.status}
                        </span>
                    </div>
                </div>

                <div style={styles.heroMetaRow}>

                    <div
                        style={{
                            ...styles.quickCard, cursor: 'pointer',
                            borderColor: journalHover ? '#6366F1' : '#E2E8F0',
                            boxShadow: journalHover
                                ? '0 6px 20px rgba(99, 102, 241, 0.08)'
                                : 'none',
                            transform: journalHover
                                ? 'translateY(-2px)'
                                : 'translateY(0)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={() => setJournalHover(true)}
                        onMouseLeave={() => setJournalHover(false)}
                        onClick={() => navigate(`/student/groups/${group.id}/journal`)}
                    >
                        <div
                            style={{
                                ...styles.quickIcon,
                                backgroundColor: '#ECFDF5',
                                color: '#10B981',
                            }}
                        >
                            <ClipboardList size={18} />
                        </div>

                        <div style={styles.quickTextBlock}>
                            <div style={styles.quickLabel}>Журнал</div>
                            <div style={styles.quickValue}>
                                <strong style={styles.metaValue}>
                                    {new Date(group.startDate).toLocaleDateString('ru-RU')} -{' '}
                                    {new Date(group.endDate).toLocaleDateString('ru-RU')}
                                </strong>
                            </div>
                        </div>
                        <ChevronRight
                            size={20}
                            color="#94A3B8"
                            style={{ marginLeft: 'auto' }}
                        />
                    </div>

                    <div
                        style={styles.quickCard}
                    >
                        <div
                            style={{
                                ...styles.quickIcon,
                                backgroundColor: '#FFF7ED',
                                color: '#F59E0B',
                            }}
                        >
                            <CalendarDays size={18} />
                        </div>

                        <div style={styles.quickTextBlock}>
                            <div style={styles.quickLabel}>
                                Расписание группы
                            </div>

                            <div style={styles.quickValue}>
                                {group.scheduleSummary}
                            </div>
                        </div>
                    </div>

                    <div style={styles.quickCard}>
                        <div
                            style={{
                                ...styles.quickIcon,
                                backgroundColor: '#F5F3FF',
                                color: '#8B5CF6',
                            }}
                        >
                            <Users size={18} />
                        </div>

                        <div style={styles.quickTextBlock}>
                            <div style={styles.quickLabel}>
                                Преподаватель
                            </div>

                            <div style={styles.quickValue}>
                                {group.mentorName}
                            </div>
                        </div>
                    </div>
                </div>
            </section >
            <section style={styles.studentsCard}>


                <div style={styles.toolbar}>

                    <div style={styles.tabBar}>
                        {([
                            ['active', `Активные (${activeStudentsCount})`],
                            ['all', `Все (${group.students.length})`],
                        ] as const).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTab(key)}
                                style={{
                                    ...styles.tabButton,
                                    ...(activeTab === key
                                        ? styles.tabButtonActive
                                        : {}),
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.studentTableWrapper}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.thRow}>
                                <th style={styles.th}>Студент</th>
                                <th style={styles.th}>Номер телефона</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredMembers.map((student) => (
                                <tr key={student.id} style={styles.tr}>
                                    <td style={styles.studentCell}>
                                        <div style={styles.studentMeta}>
                                            <div style={styles.studentAvatar}>
                                                {student.studentName.charAt(0).toUpperCase()}
                                            </div>

                                            <div>
                                                <div style={styles.studentName}>
                                                    {student.studentName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td style={styles.td}>
                                        {student.studentPhone}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredMembers.length === 0 && (
                    <div style={styles.emptyStateInline}>
                        <Users size={18} />
                        <span>По этому фильтру студенты не найдены.</span>
                    </div>
                )}
            </section>



        </div >
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap' as const,
        marginBottom: '24px',
    },
    backButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '10px 14px',
        cursor: 'pointer',
        color: '#334155',
        fontSize: '14px',
        fontWeight: 700,
    },
    breadcrumbs: {
        fontSize: '13px',
        color: '#94A3B8',
        fontWeight: 600,
    },
    heroCard: {
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04)',
        padding: '24px',
        marginBottom: '18px',
    },
    heroTopRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap' as const,
    },
    heroTitleBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    heroIcon: {
        width: '52px',
        height: '52px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 12px 24px rgba(79, 70, 229, 0.18)',
    },
    heroRightBlock: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap' as const,
        justifyContent: 'flex-end',
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
        fontSize: '28px',
        fontWeight: 800,
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
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        whiteSpace: 'nowrap' as const,
    },
    journalButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 14px',
        backgroundColor: '#0F172A',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
    },
    heroMetaRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
    },
    metaItem: {
        padding: '14px',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    metaLabel: {
        display: 'block',
        fontSize: '12px',
        color: '#64748B',
        fontWeight: 600,
        marginBottom: '6px',
    },
    metaValue: {
        fontSize: '14px',
        color: '#0F172A',
        fontWeight: 700,
    },
    progressBlock: {
        marginTop: '2px',
    },
    progressHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
    },
    progressLabel: {
        fontSize: '13px',
        color: '#475569',
        fontWeight: 600,
    },
    progressValue: {
        fontSize: '13px',
        color: '#0F172A',
        fontWeight: 700,
    },
    progressTrack: {
        width: '100%',
        height: '10px',
        borderRadius: '999px',
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: '999px',
    },
    quickGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '18px',
    },
    quickCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
    },
    quickIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    quickTextBlock: {
        minWidth: 0,
    },
    quickLabel: {
        fontSize: '12px',
        color: '#64748B',
        fontWeight: 600,
        marginBottom: '4px',
    },
    quickValue: {
        fontSize: '14px',
        color: '#0F172A',
        fontWeight: 800,
        lineHeight: 1.3,
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
    },
    detailCard: {
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04)',
    },
    studentsCard: {
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04)',
        marginBottom: '24px',
    },
    scoresCard: {
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04)',
        marginBottom: '24px',
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
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '18px',
    },
    infoItem: {
        padding: '14px',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    infoLabel: {
        display: 'block',
        fontSize: '12px',
        color: '#64748B',
        fontWeight: 600,
        marginBottom: '6px',
    },
    infoValueText: {
        fontSize: '14px',
        color: '#0F172A',
        fontWeight: 700,
    },
    disabledValue: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: '999px',
        backgroundColor: '#EEF2F7',
        color: '#475569',
    },
    statusInline: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        whiteSpace: 'nowrap' as const,
    },
    noteBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '14px 16px',
        borderRadius: '14px',
        backgroundColor: '#FFFBEB',
        border: '1px solid #FDE68A',
        color: '#92400E',
        fontSize: '13px',
        fontWeight: 600,
    },
    toolbar: {
        display: 'flex',
        gap: '14px',
        flexWrap: 'wrap' as const,
        alignItems: 'center',
        marginBottom: '18px',
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
    tabBar: {
        display: 'inline-flex',
        gap: '8px',
        padding: '6px',
        backgroundColor: '#E2E8F0',
        borderRadius: '16px',
        flexWrap: 'wrap' as const,
    },
    tabButton: {
        border: 'none',
        backgroundColor: 'transparent',
        color: '#475569',
        fontSize: '13px',
        fontWeight: 700,
        borderRadius: '12px',
        padding: '10px 14px',
        cursor: 'pointer',
    },
    tabButtonActive: {
        backgroundColor: '#ffffff',
        color: '#0F172A',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
    },
    tableWrapper: {
        width: '100%',
        overflowX: 'auto' as const,
        border: '1px solid #F1F5F9',
        borderRadius: '14px',
    },
    studentTableWrapper: {
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
    tdDay: {
        padding: '14px 16px',
        fontSize: '13px',
        color: '#0F172A',
        fontWeight: 700,
    },
    tdLesson: {
        padding: '14px 16px',
        fontSize: '13px',
        color: '#0F172A',
        fontWeight: 600,
        maxWidth: '220px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    timeCell: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 600,
        color: '#0F172A',
    },
    lessonText: {
        fontWeight: 600,
        color: '#0F172A',
    },
    noLesson: {
        fontWeight: 800,
        color: '#DC2626',
        textDecoration: 'underline',
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
    studentCell: {
        padding: '14px 16px',
        verticalAlign: 'middle',
    },
    studentMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    studentAvatar: {
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '13px',
        flexShrink: 0,
    },
    studentName: {
        fontSize: '13px',
        fontWeight: 700,
        color: '#0F172A',
    },
    studentId: {
        fontSize: '11px',
        color: '#64748B',
        marginTop: '2px',
        fontWeight: 500,
    },
    statusPill: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        whiteSpace: 'nowrap' as const,
    },
    reasonText: {
        fontSize: '13px',
        color: '#334155',
        fontWeight: 500,
    },
    emptyReason: {
        fontSize: '13px',
        color: '#94A3B8',
        fontWeight: 500,
    },
    emptyStateInline: {
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#64748B',
        fontSize: '14px',
        fontWeight: 600,
    },
    smallLinkButton: {
        border: '1px solid #C7D2FE',
        backgroundColor: '#EEF2FF',
        color: '#4338CA',
        borderRadius: '12px',
        padding: '10px 14px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 700,
    },
    bottomCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 20px',
        borderRadius: '18px',
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04)',
        flexWrap: 'wrap' as const,
    },
    bottomLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    bottomTitle: {
        fontSize: '14px',
        fontWeight: 700,
        color: '#0F172A',
    },
    bottomText: {
        fontSize: '13px',
        color: '#64748B',
        marginTop: '3px',
        fontWeight: 500,
    },
    secondaryButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: 'none',
        borderRadius: '14px',
        padding: '12px 16px',
        backgroundColor: '#0F172A',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 700,
        cursor: 'pointer',
    },
    emptyStateBox: {
        maxWidth: '560px',
        margin: '80px auto',
        padding: '32px',
        borderRadius: '24px',
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px -4px rgba(15, 23, 42, 0.04)',
        textAlign: 'center' as const,
    },
};

export default GroupDetailPage;