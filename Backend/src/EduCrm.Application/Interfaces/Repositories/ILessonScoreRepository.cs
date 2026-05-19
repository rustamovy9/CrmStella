using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface ILessonScoreRepository
{
    Task<List<LessonScore>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<LessonScore?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<LessonScore>> GetByLessonIdAsync(int lessonId, CancellationToken cancellationToken = default);
    Task<List<LessonScore>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default);
    Task<LessonScore?> GetByHomeworkSubmissionIdAsync(int homeworkSubmissionId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByLessonAndStudentAsync(int lessonId, int studentId, CancellationToken cancellationToken = default);
    Task CreateAsync(LessonScore lessonScore, CancellationToken cancellationToken = default);
    Task UpdateAsync(LessonScore lessonScore, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}