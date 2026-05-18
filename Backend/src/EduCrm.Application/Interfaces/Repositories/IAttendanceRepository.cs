using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IAttendanceRepository
{
    Task<List<Attendance>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default);
    Task<List<Attendance>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default);
    Task<Attendance?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Attendance?> GetByLessonAndStudentAsync(int lessonId, int studentId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(int lessonId, int studentId, CancellationToken cancellationToken = default);
    Task<Attendance> CreateAsync(Attendance attendance, CancellationToken cancellationToken = default);
    Task<Attendance> UpdateAsync(Attendance attendance, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}