import {
    BookOpen,
    Calendar,
    GraduationCap,
    ChevronRight,
    Clock
} from 'lucide-react';

interface StudentActionCardsProps {
    group: {
        id: number;
        courseName?: string;
        mentorName?: string;
        schedule?: string | null;
    };

    todaySchedule?: {
        startTime: string;
        endTime: string;
        room?: string;
    } | null;

    onNavigate: (path: string) => void;
}

const Card = ({
    icon,
    iconBg,
    iconColor,
    title,
    subtitle,
    onClick,
    clickable = true,
}: any) => (
    <div
        onClick={clickable ? onClick : undefined}
        style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: clickable ? 'pointer' : 'default',
        }}
    >
        <div
            style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: iconBg,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {icon}
        </div>

        <div style={{ flex: 1 }}>
            <div
                style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: 4,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize: 12,
                    color: '#64748B',
                }}
            >
                {subtitle}
            </div>
        </div>

        {clickable && (
            <ChevronRight
                size={16}
                color="#CBD5E1"
            />
        )}
    </div>
);

export const StudentActionCards = ({
    group,
    todaySchedule,
    onNavigate,
}: StudentActionCardsProps) => {

    const scheduleSubtitle = todaySchedule ? (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#0F172A',
                fontWeight: 700,
            }}
        >
            <Clock size={11} />
            {todaySchedule.startTime} - {todaySchedule.endTime}
        </span>
    ) : (
        group.schedule || 'Расписание не указано'
    );

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns:
                    'repeat(auto-fit,minmax(220px,1fr))',
                gap: 14,
                margin: '20px 0',
            }}
        >
            <Card
                icon={<BookOpen size={20} />}
                iconBg="#ECFDF5"
                iconColor="#10B981"
                title="Журнал группы"
                subtitle={group.courseName}
                onClick={() =>
                    onNavigate(`/student/groups/${group.id}/journal`)
                }
            />

            <Card
                icon={<Calendar size={20} />}
                iconBg="#FFF7ED"
                iconColor="#F59E0B"
                title="Расписание группы"
                subtitle={scheduleSubtitle}
                onClick={() =>
                    onNavigate('/student/schedule')
                }
            />

            <Card
                icon={<GraduationCap size={20} />}
                iconBg="#F5F3FF"
                iconColor="#8B5CF6"
                title="Преподаватель"
                subtitle={group.mentorName || 'Не назначен'}
                clickable={false}
            />
        </div>
    );
};