import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, X } from "lucide-react";
import { journalService } from "../../../api/journalService";

import type {
  LessonResponse,
  AttendanceResponse,
  LessonScoreResponse,
  WeekResultResponse,
} from "../../../types/journal";
import JournalChart from "../../../components/ui/journal/JournalChart";
import JournalWeekTable from "../../../components/ui/journal/JournalWeekTable";
import { groupStudentService } from "../../../api/groupStudentService";
import type { GroupStudentResponse } from "../../../types/groupStudent";

const STATUS = { Present: 1, Absent: 2, Late: 3, Excused: 4 } as const;

const EMPTY_COMMENT = {
  open: false,
  lessonId: 0,
  studentId: 0,
  text: "",
  lateMinutes: 0,
  status: STATUS.Present,
};

const JournalPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const gid = Number(groupId);

  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [attMap, setAttMap] = useState<Record<number, AttendanceResponse[]>>(
    {},
  );
  const [scoreMap, setScoreMap] = useState<
    Record<number, LessonScoreResponse[]>
  >({});
  const [weekResults, setWeekResults] = useState<
    Record<number, WeekResultResponse[]>
  >({});
  const [groupStudents, setGroupStudents] = useState<
    { id: number; name: string; isActive?: boolean; leftAt?: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  // comment modal
  const [commentModal, setCommentModal] = useState<{
    open: boolean;
    att?: AttendanceResponse;
    lessonId: number;
    studentId: number;
    text: string;
    lateMinutes: number;
    status: number;
  }>(EMPTY_COMMENT);
  const closeCommentModal = () => setCommentModal(EMPTY_COMMENT);

  const loadAttScores = async (allLessons: LessonResponse[]) => {
    if (allLessons.length === 0) return;
    const [attRes, scoreRes] = await Promise.all([
      Promise.all(
        allLessons.map((l) =>
          journalService
            .getAttendanceByLesson(l.id)
            .then((r) => ({ id: l.id, data: r.data.data ?? [] }))
            .catch(() => ({ id: l.id, data: [] as AttendanceResponse[] })),
        ),
      ),
      Promise.all(
        allLessons.map((l) =>
          journalService
            .getScoresByLesson(l.id)
            .then((r) => ({ id: l.id, data: r.data.data ?? [] }))
            .catch(() => ({ id: l.id, data: [] as LessonScoreResponse[] })),
        ),
      ),
    ]);
    const aMap: Record<number, AttendanceResponse[]> = {};
    const sMap: Record<number, LessonScoreResponse[]> = {};
    attRes.forEach((r) => {
      aMap[r.id] = r.data;
    });
    scoreRes.forEach((r) => {
      sMap[r.id] = r.data;
    });
    setAttMap(aMap);
    setScoreMap(sMap);
  };

  const loadWeekResults = async (weeks: number[], isInitialLoad = false) => {
    if (weeks.length === 0) return;
    const results = await Promise.all(
      weeks.map((wn) =>
        journalService
          .getWeekResults(gid, wn)
          .then((r) => ({ wn, data: r.data.data ?? [] }))
          .catch(() => ({ wn, data: [] as WeekResultResponse[] })),
      ),
    );
    setWeekResults((prev) => {
      const nextMap = isInitialLoad ? {} : { ...prev };
      results.forEach((r) => {
        nextMap[r.wn] = r.data;
      });
      return nextMap;
    });
  };

  const recalcAndReload = async (studentId: number, weekNumbers: number[]) => {
    await Promise.all(
      weekNumbers.map((wn) =>
        journalService
          .recalculateWeekResult({
            studentId,
            groupId: gid,
            weekNumber: wn,
          })
          .catch((err) => console.error("Recalc error:", err)),
      ),
    );
    await loadWeekResults(weekNumbers);
  };

  const loadAll = async () => {
    setLoading(true);

    try {
      const group = await groupStudentService.getMentorGroup(gid);

      const studentList = (group.students ?? [])
        .map((gs: GroupStudentResponse) => ({
          id: gs.studentId,
          name: gs.studentName,
          _isActive: gs.isActive,
          get isActive() {
            return this._isActive;
          },
          set isActive(value) {
            this._isActive = value;
          },
          leftAt: gs.leftAt ?? null,
        }))
        .sort((a, b) => {
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
          }

          return a.name.localeCompare(b.name);
        });

      setGroupStudents(studentList);

      const res = await journalService.getLessonsByGroup(gid);

      const data = res.data.data ?? [];

      setLessons(data);

      const weeks = Array.from(new Set(data.map((l) => l.weekNumber)));

      await Promise.all([loadAttScores(data), loadWeekResults(weeks, true)]);

      if (weeks.length > 0) {
        const last = Math.max(...weeks);

        setOpenWeeks(new Set([last]));
      }
    } catch (err) {
      console.error("Journal load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gid) loadAll();
  }, [gid]);

  const lessonsByWeek = useMemo(() => {
    const map: Record<number, LessonResponse[]> = {};
    lessons.forEach((l) => {
      if (!map[l.weekNumber]) map[l.weekNumber] = [];
      map[l.weekNumber].push(l);
    });
    Object.values(map).forEach((arr) =>
      arr.sort(
        (a, b) =>
          new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime(),
      ),
    );
    return map;
  }, [lessons]);

  const sortedWeeks = useMemo(
    () =>
      Object.keys(lessonsByWeek)
        .map(Number)
        .sort((a, b) => b - a),
    [lessonsByWeek],
  );

  const allWeekNumbers = useMemo(
    () =>
      Object.keys(lessonsByWeek)
        .map(Number)
        .sort((a, b) => a - b),
    [lessonsByWeek],
  );

  const attLookup = useMemo(() => {
    const m: Record<string, AttendanceResponse> = {};
    Object.values(attMap)
      .flat()
      .forEach((a) => {
        m[`${a.lessonId}-${a.studentId}`] = a;
      });
    return m;
  }, [attMap]);

  const scoreLookup = useMemo(() => {
    const m: Record<string, LessonScoreResponse> = {};
    Object.values(scoreMap)
      .flat()
      .forEach((sc) => {
        m[`${sc.lessonId}-${sc.studentId}`] = sc;
      });
    return m;
  }, [scoreMap]);

  const students = useMemo(() => {
    if (groupStudents.length > 0) return groupStudents;
    const map = new Map<number, string>();
    Object.values(attMap)
      .flat()
      .forEach((a) => map.set(a.studentId, a.studentFullName));
    Object.values(scoreMap)
      .flat()
      .forEach((sc) => map.set(sc.studentId, sc.studentName));
    Object.values(weekResults)
      .flat()
      .forEach((wr) => map.set(wr.studentId, wr.studentName));
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [groupStudents, attMap, scoreMap, weekResults]);

  const chartStudentsFormat = useMemo(
    () => students.map((s) => ({ id: s.id, fullName: s.name })),
    [students],
  );

  const handleAttToggle = async (lessonId: number, studentId: number) => {
    const key = `${lessonId}-${studentId}`;
    const existing = attLookup[key];
    setSaving(`att-${key}`);
    try {
      if (!existing) {
        try {
          await journalService.createAttendance({
            lessonId,
            studentId,
            status: STATUS.Present,
          });
        } catch (createErr: any) {
          if (
            createErr?.response?.data?.errorType === 3 ||
            createErr?.response?.status === 409
          ) {
            await loadAttScores(lessons);
            return;
          }
          throw createErr;
        }
      } else {
        const isP = String(existing.status) === "Present";
        const newStatus = isP ? STATUS.Absent : STATUS.Present;
        await journalService.updateAttendance(existing.id, {
          status: newStatus,
          absenceReason: existing.absenceReason,
          mentorNote: existing.mentorNote,
        });
        if (newStatus === STATUS.Absent) {
          const existingScore = scoreLookup[key];
          if (existingScore && existingScore.score > 0) {
            await journalService.updateLessonScore(existingScore.id, {
              score: 0,
              mentorFeedback: existingScore.mentorFeedback,
            });
          }
        }
      }
      await loadAttScores(lessons);
      const lesson = lessons.find((l) => l.id === lessonId);
      if (lesson) await recalcAndReload(studentId, [lesson.weekNumber]);
    } catch (err: any) {
      console.error("Attendance error:", err?.response?.data || err);
    } finally {
      setSaving(null);
    }
  };


  const handleScoreChange = async (
    lessonId: number,
    studentId: number,
    weekNumber: number,
    score: number,
  ) => {
    const key = `${lessonId}-${studentId}`;
    const existing = scoreLookup[key];
    setSaving(`score-${key}`);
    try {
      if (!existing) {
        try {
          await journalService.createLessonScore({
            lessonId,
            studentId,
            score,
          });
        } catch (createErr: any) {
          if (
            createErr?.response?.data?.errorType === 3 ||
            createErr?.response?.status === 409
          ) {
            await loadAttScores(lessons);
            return;
          }
          throw createErr;
        }
      } else {
        await journalService.updateLessonScore(existing.id, {
          score,
          mentorFeedback: existing.mentorFeedback,
        });
      }

      setScoreMap((prev) => {
        const next = { ...prev };

        const lessonScores = [...(next[lessonId] ?? [])];

        const index = lessonScores.findIndex((x) => x.studentId === studentId);

        if (index >= 0) {
          lessonScores[index] = {
            ...lessonScores[index],
            score,
          };
        } else {
          lessonScores.push({
            id: 0,
            lessonId,
            studentId,
            score,
            studentName: "",
            lessonTitle: "",
            scoredAt: "",
          });
        }

        next[lessonId] = lessonScores;

        return next;
      });
      const lesson = lessons.find((l) => l.id === lessonId);
      const wn = lesson?.weekNumber ?? weekNumber;

      console.log("before recalc", score);
      await recalcAndReload(studentId, [wn]);
      await loadAttScores(lessons);
      console.log("after reload", scoreMap);
    } catch (err: any) {
      console.error("Score change error:", err?.response?.data || err);
    } finally {
      setSaving(null);
    }
  };

  const handleWeekFieldUpdate = async (
    studentId: number,
    weekNumber: number,
    field: "bonusScore" | "examScore",
    value: number,
  ) => {
    const savingKey = `wr-${field}-${studentId}-${weekNumber}`;
    setSaving(savingKey);
    try {
      setWeekResults((prev) => ({
        ...prev,
        [weekNumber]: prev[weekNumber].map((x) =>
          x.studentId === studentId
            ? {
                ...x,
                [field]: value,
              }
            : x,
        ),
      }));
      await journalService.updateWeekResult(studentId, gid, weekNumber, {
        [field]: value,
      });
      await loadWeekResults([weekNumber]);
    } catch (err: any) {
      console.error("Update week result error:", err?.response?.data || err);
      await loadWeekResults([weekNumber]);
    } finally {
      setSaving(null);
    }
  };

  const handleCommentOpen = (
    lessonId: number,
    studentId: number,
    att?: AttendanceResponse,
  ) => {
    setCommentModal({
      open: true,
      att,
      lessonId,
      studentId,
      text: att?.absenceReason ?? att?.mentorNote ?? "",
      lateMinutes: att?.lateMinutes ?? 0,
      status:
        att?.status === "Present"
          ? STATUS.Present
          : att?.status === "Absent"
            ? STATUS.Absent
            : att?.status === "Late"
              ? STATUS.Late
              : STATUS.Excused,
    });
  };

  const handleSaveComment = async () => {
    const { att, lessonId, studentId, text, lateMinutes, status } =
      commentModal;
    setSaving("comment");
    try {
      if (!att) {
        await journalService.createAttendance({
          lessonId,
          studentId,
          status,
          absenceReason: text,
          lateMinutes: status === STATUS.Late ? lateMinutes : null,
        });
      } else {
        await journalService.updateAttendance(att.id, {
          status,
          absenceReason: text,
          lateMinutes: status === STATUS.Late ? lateMinutes : null,
        });
      }
      await loadAttScores(lessons);
      const lesson = lessons.find((l) => l.id === lessonId);
      if (lesson) await recalcAndReload(studentId, [lesson.weekNumber]);
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSaving(null);
      closeCommentModal();
    }
  };

  const toggleWeek = (wn: number) =>
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      next.has(wn) ? next.delete(wn) : next.add(wn);
      return next;
    });

  if (loading)
    return (
      <div style={s.center}>
        <style>{`@keyframes jspin { to { transform: rotate(360deg); } } .jspinner { animation: jspin 0.7s linear infinite; }`}</style>
        <div className="jspinner" style={s.spinner} />
        <span style={{ color: "#64748B", fontSize: "14px" }}>
          Загрузка журнала...
        </span>
      </div>
    );

  const isLate = commentModal.status === STATUS.Late;

  return (
    <div style={s.page}>
      <style>{`
                    .jback:hover { color: #0F172A !important; }
                    .jweekhdr:hover { background: #F8FAFC !important; }
                    .jcancelm:hover { background: #F1F5F9 !important; }
                    .jsavem:hover { background: #4338CA !important; }
                `}</style>
      <div style={s.header}>
        <button
          className="jback"
          style={s.backBtn}
          onClick={() => navigate(`/mentor/groups/${gid}`)}
        >
          <ArrowLeft size={16} />

          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#0F172A",
            }}
          >
            Журнал группы
          </span>
        </button>
      </div>
      {lessons.length === 0 ? (
        <div style={s.emptyWrap}>
          <div style={s.emptyIcon}>
            <BookOpen size={48} color="#4F46E5" strokeWidth={1.5} />
          </div>{" "}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: "8px",
            }}
          >
            Журнал пустой
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#64748B",
              marginBottom: "28px",
              maxWidth: "360px",
              lineHeight: 1.6,
            }}
          >
            У этой группы пока нет уроков. Обратитесь к администратору.
          </div>
        </div>
      ) : (
        <>
          <div style={s.chartWrapper}>
            <JournalChart
              weekResults={weekResults}
              weeks={allWeekNumbers}
              students={chartStudentsFormat}
            />
          </div>

          <div style={s.weekList}>
            {sortedWeeks.map((wn) => {
              const weekLessons = lessonsByWeek[wn] ?? [];
              const isOpen = openWeeks.has(wn);
              return (
                <div key={wn} style={s.weekCard}>
                  <button
                    className="jweekhdr"
                    style={s.weekHeader}
                    onClick={() => toggleWeek(wn)}
                  >
                    <span style={s.weekTitle}>Week {wn}</span>
                    {isOpen ? (
                      <ChevronUp size={18} color="#64748B" />
                    ) : (
                      <ChevronDown size={18} color="#64748B" />
                    )}
                  </button>

                  {isOpen && (
                    <JournalWeekTable
                      weekNumber={wn}
                      lessons={weekLessons}
                      students={students}
                      attLookup={attLookup}
                      scoreLookup={scoreLookup}
                      weekResults={weekResults[wn] ?? []}
                      saving={saving}
                      onAttToggle={handleAttToggle}
                      onScoreChange={handleScoreChange}
                      onCommentOpen={handleCommentOpen}
                      onWeekFieldUpdate={handleWeekFieldUpdate}
                      canEdit={true}
                      onLessonEdit={undefined}
                      onLessonDelete={undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      {/* ── COMMENT MODAL ─────────────────────────────── */}
      {commentModal.open && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Управление посещаемостью</span>
              <button style={s.modalClose} onClick={closeCommentModal}>
                <X size={18} />
              </button>
            </div>

            <label style={s.label}>Статус посещаемости</label>
            <select
              style={s.selectInput}
              value={commentModal.status}
              onChange={(e) =>
                setCommentModal((prev) => ({
                  ...prev,
                  status: Number(e.target.value),
                  lateMinutes:
                    Number(e.target.value) === STATUS.Late
                      ? prev.lateMinutes
                      : 0,
                }))
              }
            >
              <option value={STATUS.Present}>Присутствует</option>
              <option value={STATUS.Late}>Опоздал</option>
              <option value={STATUS.Absent}>Отсутствует</option>
              <option value={STATUS.Excused}>Уважительная причина</option>
            </select>

            {isLate && (
              <>
                <label style={s.label}>Минут опоздания</label>
                <input
                  type="number"
                  min={0}
                  style={s.numInput}
                  placeholder="Например: 15"
                  value={commentModal.lateMinutes || ""}
                  onChange={(e) =>
                    setCommentModal((prev) => ({
                      ...prev,
                      lateMinutes: Math.max(0, Number(e.target.value)) || 0,
                    }))
                  }
                />
              </>
            )}

            <label style={s.label}>Комментарий / Причина</label>
            <textarea
              style={s.textarea}
              placeholder="Причина отсутствия или опоздания..."
              value={commentModal.text}
              rows={3}
              onChange={(e) =>
                setCommentModal((prev) => ({ ...prev, text: e.target.value }))
              }
            />

            <div style={s.modalFooter}>
              <button
                className="jcancelm"
                style={s.cancelBtn}
                onClick={closeCommentModal}
              >
                Отмена
              </button>
              <button
                className="jsavem"
                style={s.saveBtn}
                onClick={handleSaveComment}
                disabled={saving === "comment"}
              >
                {saving === "comment" ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const s = {
  page: {
    padding: "24px 32px",
    background: "#F8FAFC",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  } as React.CSSProperties,
  center: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    height: "60vh",
  } as React.CSSProperties,
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #E2E8F0",
    borderTopColor: "#6366F1",
    borderRadius: "50%",
  } as React.CSSProperties,
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  } as React.CSSProperties,
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    color: "#0F172A",
    transition: "color 0.15s",
  } as React.CSSProperties,
  chartWrapper: { marginBottom: "28px" } as React.CSSProperties,
  weekList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  } as React.CSSProperties,
  weekCard: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  } as React.CSSProperties,
  weekHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    background: "none",
    border: "none",
    width: "100%",
    textAlign: "left" as const,
    cursor: "pointer",
    transition: "background 0.15s",
  } as React.CSSProperties,
  weekTitle: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#0F172A",
  } as React.CSSProperties,
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  } as React.CSSProperties,
  modal: {
    background: "#FFFFFF",
    borderRadius: "20px",
    width: "420px",
    padding: "24px",
    boxShadow: "0 20px 40px rgba(15,23,42,0.15)",
  } as React.CSSProperties,
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  } as React.CSSProperties,
  modalTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#0F172A",
  } as React.CSSProperties,
  modalClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94A3B8",
    padding: "4px",
    borderRadius: "6px",
  } as React.CSSProperties,
  selectInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#0F172A",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    marginBottom: "16px",
    outline: "none",
    background: "#FFFFFF",
    cursor: "pointer",
  } as React.CSSProperties,
  textarea: {
    width: "100%",
    padding: "12px",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize: "13px",
    color: "#0F172A",
    resize: "vertical" as const,
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    marginBottom: "16px",
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748B",
    marginBottom: "6px",
  } as React.CSSProperties,
  numInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#0F172A",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    marginBottom: "16px",
    outline: "none",
  } as React.CSSProperties,
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  } as React.CSSProperties,
  emptyWrap: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    background: "#FFFFFF",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
    textAlign: "center" as const,
    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  } as React.CSSProperties,
  emptyIcon: {
    fontSize: "56px",
    marginBottom: "20px",
    lineHeight: 1,
    filter: "grayscale(20%)",
  } as React.CSSProperties,
  addBtnLarge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#4F46E5",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "12px",
    padding: "13px 24px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.15s",
    boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
  } as React.CSSProperties,
  cancelBtn: {
    padding: "9px 18px",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    background: "#FFFFFF",
    color: "#64748B",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
  saveBtn: {
    padding: "9px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#4F46E5",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
};

export default JournalPage;
