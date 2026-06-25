import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type {
  UserDetailResponse,
  UpdateUserRequest,
  UpdateStudentRequest,
  UpdateMentorRequest,
} from "../../../types/admin";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Wallet,
  Edit3,
  Trash2,
  X,
  Check,
  BookOpen,
  Star,
  Clock,
  Calendar,
  User,
  Shield,
  AlertTriangle,
} from "lucide-react";
import adminService from "../../../api/adminService";
import StudentPaymentModal from "../../../components/modals/StudentPaymentModal";

type ModalType = "editUser" | "editBusiness" | "confirmDelete" | null;
const BACKEND_URL = "http://localhost:5046";

const UserInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);

  const [user, setUser] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [userForm, setUserForm] = useState<UpdateUserRequest>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });
  const [studentForm, setStudentForm] = useState<UpdateStudentRequest>({
    balance: 0,
  });
  const [mentorForm, setMentorForm] = useState<UpdateMentorRequest>({
    specialization: "",
    experienceYears: 0,
  });

  const isEmailValid =
    !userForm.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email);

  const canSave =
    userForm.firstName.trim() &&
    userForm.lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email!);

  const fetchFullData = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const res = await adminService.getUserById(userId);
      if (res.data.isSuccess && res.data.data) {
        const u = res.data.data;
        setUser(u);
        setUserForm({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phoneNumber: u.phoneNumber || "",
          email: u.email || "",
        });
        if (u.role?.toLowerCase() === "student")
          setStudentForm({ balance: u.balance ?? 0 });
        else if (u.role?.toLowerCase() === "mentor")
          setMentorForm({
            specialization: u.specialization || "",
            experienceYears: u.experienceYears ?? 0,
          });
      } else {
        setPageError("Не удалось загрузить данные.");
      }
    } catch (err: any) {
      setPageError(err.response?.data?.message || "Системная ошибка.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchFullData();
  }, [userId]);

  const showSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleActive = async () => {
    if (!user) return;
    try {
      const next = !user.isActive;
      const res = await adminService.setUserActiveStatus(user.id, next);
      if (res.data.isSuccess) setUser({ ...user, isActive: next });
    } catch {
      alert("Не удалось изменить статус.");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError("");
      setSubmitting(true);
      const res = await adminService.updateUser(userId, userForm);
      if (res.data.isSuccess) {
        setModal(null);
        showSuccess();
        await fetchFullData();
      }
    } catch (error: any) {
      setFormError(error.response?.data?.error || "Ошибка при сохранении");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBusinessData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const role = user.role?.toLowerCase();
    try {
      setSubmitting(true);
      if (role === "student") {
        if (!user.studentId) {
          alert("studentId не найден!");
          return;
        }
        await adminService.updateStudentBusinessData(
          user.studentId,
          studentForm,
        );
      } else if (role === "mentor") {
        if (!user.mentorId) {
          alert("mentorId не найден!");
          return;
        }
        await adminService.updateMentorBusinessData(user.mentorId, mentorForm);
      }
      setModal(null);
      showSuccess();
      await fetchFullData();
    } catch {
      alert("Ошибка при обновлении.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      setSubmitting(true);
      const res = await adminService.deleteUser(user.id);
      if (res.data.isSuccess) navigate(-1);
    } catch {
      alert("Ошибка удаления.");
    } finally {
      setModal(null);
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={s.loaderText}>Загрузка профиля...</p>
      </div>
    );

  if (pageError || !user)
    return (
      <div style={s.center}>
        <div style={s.errorBox}>
          <X size={24} color="#EF4444" />
        </div>
        <p style={s.errorText}>{pageError || "Пользователь не найден"}</p>
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={15} /> Назад
        </button>
      </div>
    );

  const role = user.role?.toLowerCase();
  const isStudent = role === "student";
  const isMentor = role === "mentor";
  const displayName =
    user.fullName || `${user.firstName} ${user.lastName}`.trim();
  const firstLetter = displayName.charAt(0).toUpperCase();
  const avatarSrc = user.avatarUrl ? `${BACKEND_URL}${user.avatarUrl}` : null;
  const accent = isStudent ? "#10B981" : "#3B82F6";
  const accentBg = isStudent ? "#F0FDF4" : "#EFF6FF";
  const accentBorder = isStudent ? "#BBF7D0" : "#BFDBFE";

  return (
    <div style={s.page}>
      {/* Toast */}
      {saveSuccess && (
        <div style={s.toast}>
          <Check size={14} color="#10B981" />
          <span>Изменения сохранены</span>
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={16} />
          <span>Назад</span>
        </button>
        <div style={s.headerRight}>
          <button onClick={() => setModal("editUser")} style={s.btnEdit}>
            <Edit3 size={14} />
            <span>Редактировать</span>
          </button>
          <button onClick={() => setModal("confirmDelete")} style={s.btnDelete}>
            <Trash2 size={14} />
            <span>Удалить</span>
          </button>
        </div>
      </div>

      {/* Layout */}
      <div style={s.layout}>
        {/* LEFT */}
        <div style={s.left}>
          {/* Avatar Card */}
          <div style={s.card}>
            <div style={s.avatarSection}>
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} style={s.avatar} />
              ) : (
                <div
                  style={{
                    ...s.avatarFallback,
                    background: accentBg,
                    border: `3px solid ${accentBorder}`,
                  }}
                >
                  <span
                    style={{ fontSize: "42px", fontWeight: 700, color: accent }}
                  >
                    {firstLetter}
                  </span>
                </div>
              )}
              <h2 style={s.name}>{displayName}</h2>
              <span style={s.uidText}>UID #{user.id}</span>
              <div
                style={{
                  ...s.roleBadge,
                  background: accentBg,
                  color: accent,
                  border: `1px solid ${accentBorder}`,
                }}
              >
                {isStudent ? <BookOpen size={12} /> : <Star size={12} />}
                <span>
                  {isStudent ? "Студент" : isMentor ? "Ментор" : user.role}
                </span>
              </div>
            </div>

            <div style={s.divider} />

            <button
              onClick={handleToggleActive}
              style={{
                ...s.statusBtn,
                background: user.isActive ? "#F0FDF4" : "#FFF1F2",
                border: `1px solid ${user.isActive ? "#BBF7D0" : "#FECACA"}`,
                color: user.isActive ? "#10B981" : "#F43F5E",
              }}
            >
              <div
                style={{
                  ...s.dot,
                  background: user.isActive ? "#10B981" : "#F43F5E",
                }}
              />
              <span>
                {user.isActive
                  ? "Активен — нажать для блокировки"
                  : "Заблокирован — разблокировать"}
              </span>
              <Shield size={13} style={{ marginLeft: "auto" }} />
            </button>
          </div>

          {/* Contacts */}
          <div style={s.card}>
            <p style={s.sectionTitle}>Контакты</p>
            <div style={s.contactList}>
              <ContactRow
                icon={<Mail size={14} color="#94A3B8" />}
                value={user.email}
              />
              <ContactRow
                icon={<Phone size={14} color="#94A3B8" />}
                value={user.phoneNumber || "—"}
                muted={!user.phoneNumber}
              />
              <ContactRow
                icon={<User size={14} color="#94A3B8" />}
                value={`User ID: #${user.id}`}
                muted
              />
              {isStudent && user.studentId && (
                <ContactRow
                  icon={<BookOpen size={14} color="#94A3B8" />}
                  value={`Student ID: #${user.studentId}`}
                  muted
                />
              )}
              {isMentor && user.mentorId && (
                <ContactRow
                  icon={<Briefcase size={14} color="#94A3B8" />}
                  value={`Mentor ID: #${user.mentorId}`}
                  muted
                />
              )}
            </div>
          </div>

          {/* Dates */}
          <div style={s.card}>
            <p style={s.sectionTitle}>Временные метки</p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "14px",
              }}
            >
              <DateRow
                icon={<Calendar size={13} color="#94A3B8" />}
                label="Регистрация"
                value={
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"
                }
              />
              <DateRow
                icon={<Clock size={13} color="#94A3B8" />}
                label="Обновление"
                value={
                  user.updatedAt
                    ? new Date(user.updatedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Не обновлялся"
                }
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={s.right}>
          {isStudent ? (
            <div style={{ ...s.card, borderLeft: "4px solid #10B981" }}>
              <div style={s.bizHeader}>
                <div style={{ ...s.bizIcon, background: "#F0FDF4" }}>
                  <Wallet size={18} color="#10B981" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={s.sectionTitle}>Финансы студента</p>
                  <p style={s.bizSub}>Баланс учётного счёта</p>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  style={{
                    ...s.chipBtn,
                    color: "#10B981",
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <Edit3 size={11} /> Пополнить
                </button>
              </div>
              <div style={s.balanceRow}>
                <span style={{ ...s.bigNumber, color: "#10B981" }}>
                  {(user.balance ?? 0).toLocaleString("ru-RU")}
                </span>
                <span style={s.currency}>TJS</span>
              </div>
              {user.enrolledAt && (
                <p style={s.subText}>
                  Зачислен:{" "}
                  {new Date(user.enrolledAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          ) : isMentor ? (
            <div style={{ ...s.card, borderLeft: "4px solid #3B82F6" }}>
              <div style={s.bizHeader}>
                <div style={{ ...s.bizIcon, background: "#EFF6FF" }}>
                  <Briefcase size={18} color="#3B82F6" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={s.sectionTitle}>Профиль ментора</p>
                  <p style={s.bizSub}>Профессиональные данные</p>
                </div>
                <button
                  onClick={() => setModal("editBusiness")}
                  style={{
                    ...s.chipBtn,
                    color: "#3B82F6",
                    background: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                  }}
                >
                  <Edit3 size={11} /> Изменить
                </button>
              </div>
              <div style={s.mentorGrid}>
                <div style={s.metricBox}>
                  <p style={s.metricLabel}>Специализация</p>
                  <p style={s.metricValue}>
                    {user.specialization || "Не указана"}
                  </p>
                </div>
                <div
                  style={{
                    ...s.metricBox,
                    background: "#EFF6FF",
                    border: "1px solid #BFDBFE",
                  }}
                >
                  <p style={s.metricLabel}>Опыт</p>
                  <p style={{ ...s.metricValue, color: "#3B82F6" }}>
                    {user.experienceYears ?? 0}{" "}
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#64748B",
                        fontWeight: 500,
                      }}
                    >
                      лет
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* About */}
          <div style={s.card}>
            <p style={s.sectionTitle}>О пользователе</p>
            <p style={s.aboutText}>
              {user.aboutMe || "Пользователь не добавил информацию о себе."}
            </p>
          </div>

          {/* System info */}
          <div style={s.card}>
            <p style={s.sectionTitle}>Системная информация</p>
            <div style={s.sysGrid}>
              <SysItem label="User ID" value={`#${user.id}`} />
              <SysItem label="Роль" value={user.role || "—"} />
              {isStudent && (
                <SysItem
                  label="Student ID"
                  value={user.studentId ? `#${user.studentId}` : "—"}
                  warn={!user.studentId}
                />
              )}
              {isMentor && (
                <SysItem
                  label="Mentor ID"
                  value={user.mentorId ? `#${user.mentorId}` : "—"}
                  warn={!user.mentorId}
                />
              )}
              <SysItem
                label="Пароль"
                value={user.isPasswordSet ? "Установлен" : "Не установлен"}
                warn={!user.isPasswordSet}
              />
              <SysItem
                label="Статус"
                value={user.isActive ? "Активен" : "Заблокирован"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════════════ */}

      <StudentPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        studentId={user?.studentId ?? 0}
        studentName={displayName}
        onSuccess={async () => {
          showSuccess();
          await fetchFullData();
        }}
      />
      {/* Edit User */}
      {modal === "editUser" && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>Редактировать профиль</h3>
              <button style={s.closeBtn} onClick={() => setModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} style={s.form}>
              <div style={s.formRow}>
                <Field label="Имя">
                  <input
                    required
                    style={s.input}
                    value={userForm.firstName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, firstName: e.target.value })
                    }
                    placeholder="Имя"
                  />
                </Field>
                <Field label="Фамилия">
                  <input
                    required
                    style={s.input}
                    value={userForm.lastName}
                    onChange={(e) =>
                      setUserForm({ ...userForm, lastName: e.target.value })
                    }
                    placeholder="Фамилия"
                  />
                </Field>
              </div>
              <Field label="Телефон">
                <input
                  style={s.input}
                  value={userForm.phoneNumber || ""}
                  onChange={(e) =>
                    setUserForm({ ...userForm, phoneNumber: e.target.value })
                  }
                  placeholder="+992 ..."
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  style={{
                    ...s.input,
                    borderColor: !isEmailValid ? "#EF4444" : undefined,
                  }}
                  value={userForm.email || ""}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  placeholder="example@gmail.com"
                />
                {!isEmailValid && (
                  <div
                    style={{
                      color: "#EF4444",
                      fontSize: "12px",
                      marginTop: "4px",
                    }}
                  >
                    Введите корректный email
                  </div>
                )}
                {formError && (
                  <div
                    style={{
                      color: "#EF4444",
                      fontSize: "12px",
                      marginTop: "6px",
                    }}
                  >
                    {formError}
                  </div>
                )}
              </Field>
              <ModalActions
                onCancel={() => setModal(null)}
                submitting={submitting}
                disabled={!canSave}
                label="Сохранить"
              />
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Edit Business */}
      {modal === "editBusiness" && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>
                {isStudent ? "Изменить баланс" : "Изменить данные ментора"}
              </h3>
              <button style={s.closeBtn} onClick={() => setModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveBusinessData} style={s.form}>
              {isStudent ? (
                <Field label="Новый баланс (TJS)">
                  <input
                    type="number"
                    min={0}
                    style={s.input}
                    value={studentForm.balance ?? 0}
                    onChange={(e) =>
                      setStudentForm({ balance: Number(e.target.value) })
                    }
                  />
                </Field>
              ) : (
                <>
                  <Field label="Специализация">
                    <input
                      style={s.input}
                      value={mentorForm.specialization || ""}
                      onChange={(e) =>
                        setMentorForm({
                          ...mentorForm,
                          specialization: e.target.value,
                        })
                      }
                      placeholder="Frontend, Backend..."
                    />
                  </Field>
                  <Field label="Опыт (лет)">
                    <input
                      type="number"
                      min={0}
                      style={s.input}
                      value={mentorForm.experienceYears ?? 0}
                      onChange={(e) =>
                        setMentorForm({
                          ...mentorForm,
                          experienceYears: Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                </>
              )}
              <ModalActions
                onCancel={() => setModal(null)}
                submitting={submitting}
                label="Применить"
                disabled={false}
              />
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* Confirm Delete Modal */}
      {modal === "confirmDelete" && (
        <div style={ms.overlay}>
          <div style={ms.content}>
            <div style={ms.iconBox}>
              <AlertTriangle size={32} color="#EF4444" />
            </div>
            <h3 style={ms.title}>Удалить пользователя</h3>
            <p style={ms.text}>
              Вы уверены, что хотите удалить <strong>{user.fullName}</strong>?
              <br />
              Это действие необратимо.
            </p>
            <div style={ms.buttons}>
              <button
                type="button"
                onClick={() => setModal(null)}
                style={ms.btnCancel}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                style={ms.btnConfirm}
              >
                {submitting ? "Удаление..." : "Да, удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ContactRow: React.FC<{
  icon: React.ReactNode;
  value: string;
  muted?: boolean;
}> = ({ icon, value, muted }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    {icon}
    <span
      style={{
        fontSize: "13px",
        color: muted ? "#94A3B8" : "#475569",
        fontWeight: 500,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  </div>
);

const DateRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    {icon}
    <div>
      <p
        style={{
          margin: 0,
          fontSize: "11px",
          color: "#94A3B8",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          color: "#475569",
          fontWeight: 600,
        }}
      >
        {value}
      </p>
    </div>
  </div>
);

const SysItem: React.FC<{ label: string; value: string; warn?: boolean }> = ({
  label,
  value,
  warn,
}) => (
  <div
    style={{
      padding: "12px",
      borderBottom: "1px solid #F1F5F9",
      borderRight: "1px solid #F1F5F9",
    }}
  >
    <p
      style={{
        margin: "0 0 3px 0",
        fontSize: "10px",
        color: "#94A3B8",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: 0,
        fontSize: "13px",
        color: warn ? "#EF4444" : "#334155",
        fontWeight: 600,
        fontFamily: "monospace",
      }}
    >
      {value}
    </p>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div style={{ flex: 1 }}>
    <label
      style={{
        display: "block",
        marginBottom: "6px",
        fontSize: "12px",
        fontWeight: 600,
        color: "#475569",
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

const ModalOverlay: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
}> = ({ onClose, children }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.2)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 200,
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    {children}
  </div>
);

const ModalActions: React.FC<{
  onCancel: () => void;
  submitting: boolean;
  label: string;
  disabled: boolean;
}> = ({ onCancel, submitting, label, disabled = false }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "8px",
    }}
  >
    <button
      type="button"
      onClick={onCancel}
      style={{
        height: 44,
        padding: "0 20px",
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#475569",
        cursor: "pointer",
        fontFamily: '"Inter", sans-serif',
      }}
    >
      Отмена
    </button>
    <button
      type="submit"
      disabled={submitting || disabled}
      style={{
        height: 44,
        padding: "0 22px",
        background: "#2563EB",
        border: "none",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#fff",
        cursor: submitting || disabled ? "not-allowed" : "pointer",
        opacity: submitting || disabled ? 0.7 : 1,
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {submitting ? "Сохранение..." : label}
    </button>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "32px",
    boxSizing: "border-box",
    background: "#F8FAFC",
    minHeight: "100vh",
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "16px",
    background: "#F8FAFC",
    fontFamily: '"Inter", sans-serif',
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #E2E8F0",
    borderTop: "3px solid #2563EB",
    borderRadius: "50%",
  },
  loaderText: { fontSize: "14px", color: "#64748B", fontWeight: 500 },
  errorBox: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: "#EF4444", fontWeight: 600 },
  toast: {
    position: "fixed",
    top: "20px",
    right: "24px",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#fff",
    border: "1px solid #BBF7D0",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#10B981",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  headerRight: { display: "flex", gap: "10px" },
  btnEdit: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnDelete: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "12px",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#EF4444",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  left: { display: "flex", flexDirection: "column", gap: "14px" },
  right: { display: "flex", flexDirection: "column", gap: "14px" },
  card: {
    background: "#fff",
    border: "1px solid #E2E8F0",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "10px",
  },
  avatar: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #F1F5F9",
  },
  avatarFallback: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" },
  uidText: { fontSize: "12px", color: "#94A3B8", fontFamily: "monospace" },
  roleBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  },
  divider: { height: "1px", background: "#F1F5F9", margin: "16px 0" },
  statusBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    width: "100%",
    fontFamily: "inherit",
  },
  dot: { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  sectionTitle: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: 700,
    color: "#0F172A",
  },
  contactList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "14px",
  },
  bizHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
  },
  bizIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bizSub: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#94A3B8",
    fontWeight: 500,
  },
  chipBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "7px 13px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    marginLeft: "auto",
    flexShrink: 0,
    fontFamily: "inherit",
  },
  balanceRow: { display: "flex", alignItems: "baseline", gap: "8px" },
  bigNumber: {
    fontSize: "48px",
    fontWeight: 700,
    lineHeight: 1,
    fontFamily: "monospace",
  },
  currency: { fontSize: "20px", color: "#94A3B8", fontWeight: 500 },
  subText: {
    margin: "12px 0 0 0",
    fontSize: "13px",
    color: "#94A3B8",
    fontWeight: 500,
  },
  mentorGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  metricBox: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "16px",
  },
  metricLabel: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  metricValue: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#0F172A",
  },
  aboutText: {
    margin: "12px 0 0 0",
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.7",
  },
  sysGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    marginTop: "14px",
    border: "1px solid #F1F5F9",
    borderRadius: "12px",
    overflow: "hidden",
  },
  modal: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 20px 40px rgba(15,23,42,0.12)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
    color: "#0F172A",
    fontFamily: "inherit",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    padding: "4px",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  formRow: { display: "flex", gap: "14px" },
  input: {
    width: "100%",
    padding: "11px 14px",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#0F172A",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
};

// Modal styles
const ms: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(15, 23, 42, 0.2)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  content: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "32px",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(15, 23, 42, 0.12)",
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#FEF2F2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px auto",
  },
  title: {
    fontFamily: '"Inter", sans-serif',
    fontSize: "20px",
    fontWeight: 700,
    color: "#0F172A",
    margin: "0 0 8px 0",
  },
  text: {
    fontFamily: '"Inter", sans-serif',
    fontSize: "14px",
    color: "#64748B",
    margin: "0 0 24px 0",
    lineHeight: "1.6",
  },
  buttons: { display: "flex", gap: 12 },
  btnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    background: "#ffffff",
    color: "#475569",
    fontFamily: '"Inter", sans-serif',
    fontSize: "14.5px",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    border: "none",
    background: "#EF4444",
    color: "#ffffff",
    fontFamily: '"Inter", sans-serif',
    fontSize: "14.5px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.25)",
  },
};

export default UserInfoPage;
