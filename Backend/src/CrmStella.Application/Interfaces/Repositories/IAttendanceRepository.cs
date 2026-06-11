using CrmStella.Application.DTOs.Attendance.Response;
using CrmStella.Domain.Entities;

namespace CrmStella.Application.Interfaces.Repositories;

public interface IAttendanceRepository
{
    Task<List<Attendance>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default);
    Task<List<Attendance>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default);
    Task<Attendance?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Attendance?> GetByLessonAndStudentAsync(int lessonId, int studentId,
        CancellationToken cancellationToken = default);
    public Task<AttendanceSummaryResponse> GetDailySummaryAsync(
        DateTime date, CancellationToken ct = default);
    Task<bool> ExistsAsync(int lessonId, int studentId, CancellationToken cancellationToken = default);
    Task<List<Attendance>> GetByStudentAndLessonsAsync(int studentId, List<int> lessonIds);
    Task<Attendance> CreateAsync(Attendance attendance, CancellationToken cancellationToken = default);
    Task<Attendance> UpdateAsync(Attendance attendance, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}