import React from "react";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  ChevronRight,
  Clock,
} from "lucide-react";

interface GroupDto {
  id: number;
  name: string;
  courseName?: string;
  mentorName?: string;
  mentorUserId: number;
  scheduleSummary?: string | null;
}

interface TodaySchedule {
  startTime: string;
  endTime: string;
  room?: string;
}

interface Props {
  group: GroupDto;
  todaySchedule?: TodaySchedule | null;
  onNavigate: (path: string) => void;
}

const Card = ({
  icon,
  title,
  subtitle,
  onClick,
  iconBg,
  iconColor,
  clickable = true,
}: any) => (
  <div
    onClick={clickable ? onClick : undefined}
    style={{
      background: "#fff",
      border: "1px solid #E2E8F0",
      borderRadius: "16px",
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      cursor: clickable ? "pointer" : "default",
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: iconBg,
        color: iconColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </div>

    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#0F172A",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "#64748B",
          marginTop: 3,
        }}
      >
        {subtitle}
      </div>
    </div>
    {clickable && <ChevronRight size={16} color="#CBD5E1" />}
  </div>
);

export const MentorActionCards: React.FC<Props> = ({
  group,
  todaySchedule,
  onNavigate,
}) => {
  const scheduleSubtitle = todaySchedule ? (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: "#0F172A",
        fontWeight: 700,
      }}
    >
      <Clock size={11} />
      {todaySchedule.startTime} - {todaySchedule.endTime}
    </span>
  ) : (
    group.scheduleSummary || "Расписание не указано"
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: "14px",
        margin: "20px 0",
      }}
    >
      <Card
        icon={<BookOpen size={20} />}
        iconBg="#ECFDF5"
        iconColor="#10B981"
        title="Журнал группы"
        subtitle={group.courseName || "Посещаемость и оценки"}
        onClick={() => onNavigate(`/mentor/groups/${group.id}/journal`)}
      />

      <Card
        icon={<Calendar size={20} />}
        iconBg="#FFF7ED"
        iconColor="#F59E0B"
        title="Расписание занятий"
        subtitle={scheduleSubtitle}
        onClick={
          () => onNavigate("")
          //( `/mentor/groups/${group.id}/schedule`)
        }
      />

      <Card
        icon={<GraduationCap size={20} />}
        iconBg="#F5F3FF"
        iconColor="#8B5CF6"
        title="Преподаватель"
        subtitle={group.mentorName || "Ne naznachen"}
      />
    </div>
  );
};
