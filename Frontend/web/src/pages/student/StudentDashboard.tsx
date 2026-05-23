import { AlertCircle, Play, Wallet } from 'lucide-react';
import React from 'react';

const StudentDashboard: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50/50 p-8 min-h-screen font-sans">
      {/* Приветствие */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Привет, Студент! 👋</h1>
        <p className="text-sm font-medium text-gray-400 mt-1">Твой текущий прогресс обучения и важные уведомления</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Карточка основного курса */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm shadow-gray-100/40">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Мой курс</span>
            <span className="text-xs font-medium text-gray-400">Занятие сегодня в 19:00</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Frontend-разработчик: Полный курс</h2>
          <p className="text-sm text-gray-400 mb-6 font-medium">Модуль 4: Глубокое погружение в React Hooks и стейт-менеджеры.</p>
          
          <button className="flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl shadow-md shadow-blue-100 transition-all cursor-pointer">
            <Play size={16} fill="currentColor" /> Войти в класс
          </button>
        </div>

        {/* Финансы и Баланс */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm shadow-gray-100/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Оплата обучения</span>
              <Wallet size={18} className="text-gray-400" />
            </div>
            <span className="text-3xl font-bold text-gray-900">$120</span>
            <p className="text-xs font-semibold text-green-600 mt-2 bg-green-50 inline-block px-2 py-0.5 rounded-md">
              Оплачено до: 15.06.2026
            </p>
          </div>
          <button className="w-full text-center text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl transition-colors mt-6 cursor-pointer">
            История транзакций
          </button>
        </div>
      </div>

      {/* Блок Дедлайнов */}
      <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm shadow-gray-100/40">
        <h3 className="text-base font-bold text-gray-900 mb-4">Ближайшие дедлайны</h3>
        <div className="flex items-center gap-3 border border-amber-100 bg-amber-50/40 p-3.5 rounded-xl">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-sm font-semibold text-gray-800">Домашнее задание №5: Настройка Custom Hooks</span>
            <span className="text-xs font-bold text-amber-600 bg-white border border-amber-100 px-2 py-0.5 rounded-md sm:self-start">
              Осталось 2 дня
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;