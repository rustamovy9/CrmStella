import React, { useState, useEffect, useRef } from 'react';
import {
    Edit3, Save, X, Camera, Loader2,
    Calendar, MapPin, Send, Link2, GitBranchPlus,
    Mail, User as UserIcon, Info, CheckCircle2, Clock,
    Lock, Eye, EyeOff
} from 'lucide-react';
import { profileService } from '../../api/profileService';
import type { ProfileResponse, UpdateProfileRequest } from '../../api/profileService';
import { authService } from '../../api/authService';

const API_BASE = 'http://localhost:5046';

const resolveAvatarUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
};

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<UpdateProfileRequest>({
        aboutMe: '',
        dateOfBirth: '',
        address: '',
        telegramUsername: '',
        linkedInUrl: '',
        githubUrl: '',
    });

    // password modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [isChangingPw, setIsChangingPw] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const resetForm = (d: ProfileResponse) => {
        setForm({
            aboutMe: d.aboutMe || '',
            dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : '',
            address: d.address || '',
            telegramUsername: d.telegramUsername || '',
            linkedInUrl: d.linkedInUrl || '',
            githubUrl: d.githubUrl || '',
        });
    };

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await profileService.getMe();
            if (res.data.isSuccess && res.data.data) {
                setProfile(res.data.data);
                resetForm(res.data.data);
            }
        } catch (err) {
            console.error('Profile load error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const res = profile && profile.id
                ? await profileService.update(form)
                : await profileService.create(form);

            if (res.data.isSuccess && res.data.data) {
                setProfile(res.data.data);
                resetForm(res.data.data);
                setIsEditing(false);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(res.data.error || 'Ошибка сохранения');
            }
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Ошибка сохранения');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setIsUploadingAvatar(true);
        try {
            const res = await profileService.setAvatar(file);
            if (res.data.isSuccess && res.data.data) {
                const url = res.data.data.avatarUrl;
                setProfile(prev => (prev ? { ...prev, avatarUrl: url } : prev));
            }
        } catch (err) {
            console.error('Avatar upload error:', err);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError(null);
        if (profile) {
            resetForm(profile);
        }
    };

    const handleChangePassword = async () => {
        setPwError(null);

        if (!pwForm.oldPassword || !pwForm.newPassword) {
            setPwError('Заполните все поля');
            return;
        }
        if (pwForm.newPassword.length < 6) {
            setPwError('Новый пароль минимум 6 символов');
            return;
        }
        if (pwForm.newPassword !== pwForm.confirm) {
            setPwError('Пароли не совпадают');
            return;
        }

        try {
            setIsChangingPw(true);
            const res = await authService.changePassword({
                currentPassword: pwForm.oldPassword,
                newPassword: pwForm.newPassword,
                confirmPassword: pwForm.confirm,
            });

            if (res.data.isSuccess) {
                setPwSuccess(true);
                setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
                setTimeout(() => {
                    setPwSuccess(false);
                    setShowPasswordModal(false);
                }, 1500);
            } else {
                setPwError(res.data.error || 'Ошибка смены пароля');
            }
        } catch (err: any) {
            setPwError(err?.response?.data?.error || 'Неверный текущий пароль');
        } finally {
            setIsChangingPw(false);
        }
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
        setPwError(null);
        setPwSuccess(false);
        setShowOld(false);
        setShowNew(false);
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const tgLink = profile && profile.telegramUsername
        ? 'https://t.me/' + profile.telegramUsername.replace('@', '')
        : '';

    const hasSocial = !!(profile && (profile.telegramUsername || profile.linkedInUrl || profile.githubUrl));

    if (loading) {
        return (
            <div style={s.center}>
                <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
                <Loader2 size={32} style={{ animation: 'spin 0.7s linear infinite', color: '#2563EB' }} />
            </div>
        );
    }

    return (
        <div style={s.page}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
                .pf-input { width: 100%; padding: 11px 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; font-size: 14px; color: #0F172A; box-sizing: border-box; outline: none; font-family: inherit; transition: all 0.2s; }
                .pf-input:focus { border-color: #2563EB; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
                .pf-input:disabled { color: #475569; cursor: default; background: #F1F5F9; border-color: #EEF0F3; }
                .pf-btn-edit:hover { background: #1D4ED8 !important; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.3) !important; }
                .pf-btn-cancel:hover { background: #F1F5F9 !important; }
                .pf-social:hover { border-color: #2563EB !important; color: #2563EB !important; background: #EFF6FF !important; transform: translateX(2px); }
                .pf-pw-btn:hover { border-color: #2563EB !important; color: #2563EB !important; background: #EFF6FF !important; }
                .pf-eye:hover { color: #2563EB !important; }
                .avatar-wrap:hover .avatar-overlay { opacity: 1 !important; }
                .pf-banner-shimmer { position: relative; overflow: hidden; }
                .pf-banner-shimmer::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), transparent 60%); }
            `}</style>

            <div style={s.header}>
                <div>
                    <h1 style={s.title}>Мой профиль</h1>
                    <p style={s.subtitle}>Личная информация и настройки аккаунта</p>
                </div>
                {!isEditing ? (
                    <button className="pf-btn-edit" style={s.editBtn} onClick={() => setIsEditing(true)}>
                        <Edit3 size={15} /> Редактировать
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="pf-btn-cancel" style={s.cancelBtn} onClick={handleCancel} disabled={isSaving}>
                            <X size={15} /> Отмена
                        </button>
                        <button className="pf-btn-edit" style={s.saveBtn} onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                            ) : (
                                <Save size={15} />
                            )}
                            {isSaving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                )}
            </div>

            {success && (
                <div style={s.successBanner}>
                    <CheckCircle2 size={16} /> Профиль успешно обновлён
                </div>
            )}
            {error && (
                <div style={s.errorBanner}>
                    <X size={14} /> {error}
                </div>
            )}

            <div style={s.body}>
                <div style={s.leftCol}>
                    <div style={s.avatarCard}>
                        <div className="pf-banner-shimmer" style={s.banner} />

                        <div className="avatar-wrap" style={s.avatarWrap}>
                            <div style={s.avatarCircle}>
                                {profile && profile.avatarUrl ? (
                                    <img
                                        src={resolveAvatarUrl(profile.avatarUrl)}
                                        alt="avatar"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={s.avatarInitials}>{getInitials(profile?.fullName)}</span>
                                )}
                            </div>
                            <div className="avatar-overlay" style={s.avatarOverlay} onClick={() => fileInputRef.current?.click()}>
                                {isUploadingAvatar ? (
                                    <Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite', color: '#fff' }} />
                                ) : (
                                    <Camera size={20} color="#fff" />
                                )}
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={handleAvatarChange}
                        />

                        <div style={s.cardBody}>
                            <div style={s.avatarName}>{profile?.fullName || 'Пользователь'}</div>
                            <div style={s.avatarEmailRow}>
                                <Mail size={13} color="#94A3B8" />
                                <span style={s.avatarEmail}>{profile?.email || '—'}</span>
                            </div>

                            {hasSocial ? (
                                <div style={s.socialLinks}>
                                    {profile?.telegramUsername && (
                                        <a className="pf-social" href={tgLink} target="_blank" rel="noreferrer" style={s.socialBtn}>
                                            <Send size={14} /> Telegram
                                        </a>
                                    )}
                                    {profile?.linkedInUrl && (
                                        <a className="pf-social" href={profile.linkedInUrl} target="_blank" rel="noreferrer" style={s.socialBtn}>
                                            <Link2 size={14} /> LinkedIn
                                        </a>
                                    )}
                                    {profile?.githubUrl && (
                                        <a className="pf-social" href={profile.githubUrl} target="_blank" rel="noreferrer" style={s.socialBtn}>
                                            <GitBranchPlus size={14} /> GitHub
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div style={s.noSocial}>
                                    <Info size={13} /> Соц. сети не указаны
                                </div>
                            )}

                            <button className="pf-pw-btn" style={s.passwordBtn} onClick={() => setShowPasswordModal(true)}>
                                <Lock size={14} /> Сменить пароль
                            </button>
                        </div>
                    </div>
                </div>

                <div style={s.rightCol}>
                    <div style={s.section}>
                        <div style={s.sectionTitle}>
                            <span style={s.sectionIcon}><UserIcon size={15} color="#2563EB" /></span>
                            О себе
                        </div>
                        <textarea
                            className="pf-input"
                            rows={3}
                            placeholder={isEditing ? 'Расскажите о себе...' : 'Информация не добавлена'}
                            value={form.aboutMe}
                            disabled={!isEditing}
                            style={{ resize: 'vertical', paddingTop: '11px' }}
                            onChange={e => setForm(prev => ({ ...prev, aboutMe: e.target.value }))}
                        />
                    </div>

                    <div style={s.section}>
                        <div style={s.sectionTitle}>
                            <span style={s.sectionIcon}><Calendar size={15} color="#2563EB" /></span>
                            Личные данные
                        </div>
                        <div style={s.grid2}>
                            <div style={s.field}>
                                <label style={s.label}><Calendar size={13} /> Дата рождения</label>
                                <input
                                    type="date"
                                    className="pf-input"
                                    value={form.dateOfBirth}
                                    disabled={!isEditing}
                                    onChange={e => setForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}><MapPin size={13} /> Адрес</label>
                                <input
                                    type="text"
                                    className="pf-input"
                                    placeholder="Город, улица..."
                                    value={form.address}
                                    disabled={!isEditing}
                                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={s.section}>
                        <div style={s.sectionTitle}>
                            <span style={s.sectionIcon}><Link2 size={15} color="#2563EB" /></span>
                            Социальные сети
                        </div>
                        <div style={s.grid2}>
                            <div style={s.field}>
                                <label style={s.label}><Send size={13} /> Telegram</label>
                                <input
                                    type="text"
                                    className="pf-input"
                                    placeholder="@username"
                                    value={form.telegramUsername}
                                    disabled={!isEditing}
                                    onChange={e => setForm(prev => ({ ...prev, telegramUsername: e.target.value }))}
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}><Link2 size={13} /> LinkedIn</label>
                                <input
                                    type="text"
                                    className="pf-input"
                                    placeholder="https://linkedin.com/in/..."
                                    value={form.linkedInUrl}
                                    disabled={!isEditing}
                                    onChange={e => setForm(prev => ({ ...prev, linkedInUrl: e.target.value }))}
                                />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}><GitBranchPlus size={13} /> GitHub</label>
                                <input
                                    type="text"
                                    className="pf-input"
                                    placeholder="https://github.com/..."
                                    value={form.githubUrl}
                                    disabled={!isEditing}
                                    onChange={e => setForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {profile && profile.createdAt && (
                        <div style={s.meta}>
                            <span style={s.metaItem}>
                                <CheckCircle2 size={12} color="#94A3B8" />
                                Создан: {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                            {profile.updatedAt && (
                                <span style={s.metaItem}>
                                    <Clock size={12} color="#94A3B8" />
                                    Обновлён: {new Date(profile.updatedAt).toLocaleDateString('ru-RU')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* МОДАЛКА СМЕНЫ ПАРОЛЯ */}
            {showPasswordModal && (
                <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && closePasswordModal()}>
                    <div style={s.pwModal}>
                        <div style={s.pwHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={s.pwIcon}>
                                    <Lock size={18} color="#2563EB" />
                                </div>
                                <h3 style={s.pwTitle}>Смена пароля</h3>
                            </div>
                            <button style={s.pwClose} onClick={closePasswordModal}>
                                <X size={18} />
                            </button>
                        </div>

                        {pwSuccess && (
                            <div style={s.successBanner}>
                                <CheckCircle2 size={16} /> Пароль успешно изменён
                            </div>
                        )}
                        {pwError && (
                            <div style={s.errorBanner}>
                                <X size={14} /> {pwError}
                            </div>
                        )}

                        <div style={s.pwBody}>
                            <div style={s.field}>
                                <label style={s.label}><Lock size={13} /> Текущий пароль</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showOld ? 'text' : 'password'}
                                        className="pf-input"
                                        placeholder="Введите текущий пароль"
                                        value={pwForm.oldPassword}
                                        onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))}
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <button type="button" className="pf-eye" style={s.eyeBtn} onClick={() => setShowOld(v => !v)}>
                                        {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div style={s.field}>
                                <label style={s.label}><Lock size={13} /> Новый пароль</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        className="pf-input"
                                        placeholder="Минимум 6 символов"
                                        value={pwForm.newPassword}
                                        onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <button type="button" className="pf-eye" style={s.eyeBtn} onClick={() => setShowNew(v => !v)}>
                                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div style={s.field}>
                                <label style={s.label}><Lock size={13} /> Повторите новый пароль</label>
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    className="pf-input"
                                    placeholder="Повторите пароль"
                                    value={pwForm.confirm}
                                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                />
                            </div>

                            <div style={s.pwFooter}>
                                <button className="pf-btn-cancel" style={s.cancelBtn} onClick={closePasswordModal} disabled={isChangingPw}>
                                    Отмена
                                </button>
                                <button className="pf-btn-edit" style={s.saveBtn} onClick={handleChangePassword} disabled={isChangingPw}>
                                    {isChangingPw
                                        ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                                        : <Save size={15} />}
                                    {isChangingPw ? 'Сохранение...' : 'Сменить пароль'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    page: { padding: '32px', background: '#F8FAFC', minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 },
    subtitle: { fontSize: '14px', color: '#64748B', margin: '4px 0 0' },
    editBtn: { display: 'flex', alignItems: 'center', gap: '7px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' },
    cancelBtn: { display: 'flex', alignItems: 'center', gap: '7px', background: '#fff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' },
    saveBtn: { display: 'flex', alignItems: 'center', gap: '7px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' },
    successBanner: { display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', animation: 'fadeIn 0.3s ease' },
    errorBanner: { display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', border: '1px solid #FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', marginBottom: '20px', animation: 'fadeIn 0.3s ease' },
    body: { display: 'flex', gap: '24px', alignItems: 'flex-start' },
    leftCol: { width: '280px', flexShrink: 0 },
    rightCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
    avatarCard: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', position: 'relative' },
    banner: { height: '88px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #0EA5E9 100%)' },
    avatarWrap: { position: 'relative', width: '100px', height: '100px', margin: '-50px auto 0', cursor: 'pointer', zIndex: 2 },
    avatarCircle: { width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' },
    avatarInitials: { fontSize: '34px', fontWeight: 700, color: '#fff' },
    avatarOverlay: { position: 'absolute', inset: '4px', borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' },
    cardBody: { padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    avatarName: { fontSize: '17px', fontWeight: 700, color: '#0F172A', textAlign: 'center', marginTop: '12px' },
    avatarEmailRow: { display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', marginBottom: '18px' },
    avatarEmail: { fontSize: '13px', color: '#64748B' },
    socialLinks: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' },
    socialBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#475569', textDecoration: 'none', fontWeight: 500, transition: 'all 0.15s' },
    noSocial: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', padding: '8px 0' },
    passwordBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '12px', padding: '10px 12px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
    section: { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' },
    sectionTitle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' },
    sectionIcon: { width: '30px', height: '30px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#64748B' },
    meta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#94A3B8', paddingLeft: '4px' },
    metaItem: { display: 'flex', alignItems: 'center', gap: '5px' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 },
    pwModal: { background: '#fff', borderRadius: '20px', width: '440px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)', animation: 'fadeIn 0.25s ease' },
    pwHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    pwIcon: { width: '40px', height: '40px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    pwTitle: { margin: 0, fontSize: '17px', fontWeight: 700, color: '#0F172A' },
    pwClose: { background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex' },
    pwBody: { display: 'flex', flexDirection: 'column', gap: '16px' },
    pwFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' },
    eyeBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', display: 'flex' },
};

export default ProfilePage;