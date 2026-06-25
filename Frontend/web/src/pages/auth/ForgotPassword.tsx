import React, { useState } from "react";
import { Link } from "react-router-dom";
import agent from "../../api/agent";
import Logo from "../../components/ui/logo/Logo";
import { Eye, EyeOff } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ШАГ 1: Отправка Email на бэкенд
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await agent.post("/auth/forgot-password", { Email: email });
      setStep(2);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Пользователь не найден или ошибка почтового сервера",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ШАГ 2: Проверка кода
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await agent.post("/auth/verify-code", { Email: email, Code: code });
      setStep(3);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Неверный код или срок его действия истек",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ШАГ 3: Сброс и установка нового пароля
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    setIsLoading(true);
    try {
      await agent.post("/auth/reset-password", {
        Email: email,
        NewPassword: newPassword,
        ConfirmPassword: confirmPassword,
      });
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка при сбросе пароля");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* ЛЕВАЯ СТОРОНА: Синяя премиум-панель */}
      <div style={styles.leftSide}>
        <div style={styles.overlayGlow}></div>

        {/* Контейнер логотипа с компенсацией внутреннего отступа */}
        <div style={styles.leftHeader}>
          <Logo width="310px" />
        </div>

        <div style={styles.leftContent}>
          <div style={styles.securityBadge}>
            <div style={styles.securityCore}></div>
          </div>
          <h1 style={styles.leftTitle}>
            Восстановление <br />
            доступа
          </h1>
          <p style={styles.leftSubtitle}>
            Наша система безопасности поможет вам быстро и безопасно
            восстановить доступ к учетной записи в несколько простых шагов.
          </p>
        </div>

        <footer style={styles.leftFooter}>
          © {new Date().getFullYear()} EduCRM. Все права защищены.
        </footer>
      </div>

      {/* ПРАВАЯ СТОРОНА: Контентная область */}
      <div style={styles.rightSide}>
        <div style={styles.formWrapper}>
          {/* Индикатор прогресса шагов */}
          {step < 4 && (
            <div style={styles.stepsContainer}>
              <div
                style={{
                  ...styles.stepDot,
                  backgroundColor: step >= 1 ? "#1e40af" : "#e2e8f0",
                }}
              ></div>
              <div
                style={{
                  ...styles.stepLine,
                  backgroundColor: step >= 2 ? "#1e40af" : "#e2e8f0",
                }}
              ></div>
              <div
                style={{
                  ...styles.stepDot,
                  backgroundColor: step >= 2 ? "#1e40af" : "#e2e8f0",
                }}
              ></div>
              <div
                style={{
                  ...styles.stepLine,
                  backgroundColor: step >= 3 ? "#1e40af" : "#e2e8f0",
                }}
              ></div>
              <div
                style={{
                  ...styles.stepDot,
                  backgroundColor: step >= 3 ? "#1e40af" : "#e2e8f0",
                }}
              ></div>
            </div>
          )}

          {/* Шаг 1: Ввод почты */}
          {step === 1 && (
            <div style={styles.fadeEnter}>
              <div style={styles.textHeader}>
                <h2 style={styles.mainTitle}>Забыли пароль?</h2>
                <p style={styles.subTitle}>
                  Введите email, привязанный к вашему аккаунту, для получения
                  кода подтверждения.
                </p>
              </div>

              {error && <div style={styles.errorBanner}>{error}</div>}

              <form onSubmit={handleSendEmail} style={styles.form}>
                <div style={styles.fieldContainer}>
                  <label
                    style={getLabelStyle(focusedField === "email" || !!email)}
                  >
                    Email адрес
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    style={getInputStyle(focusedField === "email")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={getButtonStyle(isLoading)}
                >
                  {isLoading ? "Отправка..." : "Получить код"}
                </button>
              </form>
            </div>
          )}

          {/* Шаг 2: Ввод кода подтверждения */}
          {step === 2 && (
            <div style={styles.fadeEnter}>
              <div style={styles.textHeader}>
                <h2 style={styles.mainTitle}>Введите код</h2>
                <p style={styles.subTitle}>
                  Мы отправили 6-значный код на почту <b>{email}</b>.
                </p>
              </div>

              {error && <div style={styles.errorBanner}>{error}</div>}

              <form onSubmit={handleVerifyCode} style={styles.form}>
                <div style={styles.fieldContainer}>
                  <label
                    style={getLabelStyle(focusedField === "code" || !!code)}
                  >
                    Код подтверждения
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onFocus={() => setFocusedField("code")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setCode(e.target.value)}
                    style={{
                      ...getInputStyle(focusedField === "code"),
                      letterSpacing: "6px",
                      fontSize: "1.3rem",
                      textAlign: "center",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={getButtonStyle(isLoading)}
                >
                  {isLoading ? "Проверка..." : "Подтвердить код"}
                </button>
              </form>
            </div>
          )}

          {/* Шаг 3: Ввод нового пароля */}
          {step === 3 && (
            <div style={styles.fadeEnter}>
              <div style={styles.textHeader}>
                <h2 style={styles.mainTitle}>Новый пароль</h2>
                <p style={styles.subTitle}>
                  Придумайте сложный пароль, содержащий буквы и цифры.
                </p>
              </div>

              {error && <div style={styles.errorBanner}>{error}</div>}

              <form onSubmit={handleResetPassword} style={styles.form}>
                <div style={{...styles.fieldContainer, position: "relative"}}>
                  <label
                    style={getLabelStyle(
                      focusedField === "newPass" || !!newPassword,
                    )}
                  >
                    Новый пароль
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onFocus={() => setFocusedField("newPass")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={getInputStyle(focusedField === "newPass")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={styles.fieldContainer}>
                  <label
                    style={getLabelStyle(
                      focusedField === "confPass" || !!confirmPassword,
                    )}
                  >
                    Повторите пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onFocus={() => setFocusedField("confPass")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={getInputStyle(focusedField === "confPass")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={getButtonStyle(isLoading)}
                >
                  {isLoading ? "Сохранение..." : "Сбросить пароль"}
                </button>
              </form>
            </div>
          )}

          {/* Шаг 4: Успешное завершение */}
          {step === 4 && (
            <div style={{ ...styles.fadeEnter, textAlign: "center" }}>
              <div style={styles.successIconWrapper}>
                <div style={styles.successCheckmark}></div>
              </div>
              <h2 style={styles.mainTitle}>Доступ восстановлен</h2>
              <p style={styles.subTitle}>
                Ваш пароль успешно изменен. Теперь вы можете войти в личный
                кабинет.
              </p>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <button
                  style={{ ...getButtonStyle(false), marginTop: "1.5rem" }}
                >
                  Перейти к авторизации
                </button>
              </Link>
            </div>
          )}

          {step !== 4 && (
            <div style={styles.rightFooter}>
              Вспомнили пароль?{" "}
              <Link to="/login" style={styles.supportLink}>
                Вернуться назад
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Генерация стилей лейблов и инпутов
const getLabelStyle = (isActive: boolean) => ({
  ...styles.floatingLabel,
  color: isActive ? "#1e40af" : "#94a3b8",
  transform: isActive
    ? "translateY(-22px) scale(0.85)"
    : "translateY(0) scale(1)",
});

const getInputStyle = (isFocused: boolean) => ({
  ...styles.premiumInput,
  borderColor: isFocused ? "#1e40af" : "#e2e8f0",
  boxShadow: isFocused ? "0 4px 12px rgba(30,64,175,0.06)" : "none",
});

const getButtonStyle = (isDisabled: boolean) => ({
  ...styles.submitButton,
  ...(isDisabled ? styles.btnDisabled : {}),
});

const styles = {
  container: {
    display: "flex",
    width: "100vw",
    minHeight: "100vh",
    margin: 0,
    padding: 0,
    backgroundColor: "#ffffff",
    // Переведено на единый шрифт Inter
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: "hidden",
  },
  leftSide: {
    flex: "1.1",
    background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    padding: "4rem 4.5rem",
    color: "#ffffff",
    overflow: "hidden",
  },
  overlayGlow: {
    position: "absolute" as const,
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    background:
      "radial-gradient(circle at 80% 20%, rgba(37,99,235,0.2), transparent 50%)",
  },
  leftHeader: {
    position: "relative" as const,
    zIndex: 2,
    marginLeft: "-24px", // Сдвиг для компенсации свечения логотипа
  },
  leftContent: {
    position: "relative" as const,
    zIndex: 2,
    maxWidth: "440px",
    marginTop: "auto",
    marginBottom: "auto",
  },
  securityBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border: "2px solid rgba(56, 189, 248, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1.5rem",
    background: "rgba(56, 189, 248, 0.05)",
  },
  securityCore: {
    width: "12px",
    height: "12px",
    borderRadius: "3px",
    backgroundColor: "#38bdf8",
    boxShadow: "0 0 12px #38bdf8",
  },
  leftTitle: {
    fontSize: "2.6rem",
    fontWeight: "700" as const,
    lineHeight: "1.25",
    marginBottom: "1.5rem",
    letterSpacing: "-0.02em",
  },
  leftSubtitle: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    lineHeight: "1.6",
  },
  leftFooter: {
    position: "relative" as const,
    zIndex: 2,
    fontSize: "0.85rem",
    color: "#475569",
  },
  rightSide: {
    flex: "1",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "4rem",
    backgroundColor: "#ffffff",
  },
  formWrapper: {
    width: "100%",
    maxWidth: "360px",
  },
  stepsContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "2.5rem",
    justifyContent: "center",
  },
  stepDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
  },
  stepLine: {
    height: "2px",
    width: "40px",
    transition: "all 0.3s ease",
  },
  fadeEnter: {
    animation: "fadeIn 0.4s ease-out",
  },
  textHeader: {
    marginBottom: "2rem",
  },
  mainTitle: {
    fontSize: "2rem",
    fontWeight: "700" as const,
    color: "#0f172a",
    letterSpacing: "-0.02em",
    marginBottom: "0.5rem",
  },
  subTitle: {
    fontSize: "0.9rem",
    color: "#64748b",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.8rem",
  },
  fieldContainer: {
    position: "relative" as const,
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
  },
  floatingLabel: {
    position: "absolute" as const,
    left: "16px",
    top: "14px",
    fontSize: "0.9rem",
    pointerEvents: "none" as const,
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    transformOrigin: "top left",
    backgroundColor: "#ffffff",
    padding: "0 4px",
  },
  premiumInput: {
    width: "100%",
    padding: "14px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "0.95rem",
    outline: "none",
    color: "#0f172a",
    boxSizing: "border-box" as const,
    transition: "all 0.2s ease",
  },
  submitButton: {
    width: "100%",
    padding: "0.9rem",
    backgroundColor: "#1e40af",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "0.95rem",
    fontWeight: "600" as const,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(30,64,175,0.15)",
    transition: "all 0.2s ease",
    marginTop: "0.5rem",
  },
  btnDisabled: {
    backgroundColor: "#94a3b8",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  rightFooter: {
    textAlign: "center" as const,
    marginTop: "2.5rem",
    fontSize: "0.85rem",
    color: "#64748b",
  },
  supportLink: {
    color: "#1e40af",
    fontWeight: "600" as const,
    textDecoration: "none",
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderLeft: "3px solid #ef4444",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    marginBottom: "1.5rem",
  },
  successIconWrapper: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#f0fdf4",
    border: "2px solid #bbf7d0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem auto",
  },
  successCheckmark: {
    width: "12px",
    height: "20px",
    border: "solid #16a34a",
    borderWidth: "0 3px 3px 0",
    transform: "rotate(45deg)",
    marginTop: "-3px",
  },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

export default ForgotPassword;
