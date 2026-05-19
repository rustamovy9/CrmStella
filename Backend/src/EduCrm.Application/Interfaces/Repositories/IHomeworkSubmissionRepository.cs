using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IHomeworkSubmissionRepository
{
    Task<List<HomeworkSubmission>> GetByHomeworkAsync(int homeworkId, CancellationToken cancellationToken = default);
    Task<HomeworkSubmission?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<HomeworkSubmission?> GetByHomeworkAndStudentAsync(int homeworkId, int studentId, CancellationToken cancellationToken = default);

    Task CreateAsync(HomeworkSubmission submission, CancellationToken cancellationToken = default);
    Task UpdateAsync(HomeworkSubmission submission, CancellationToken cancellationToken = default);
}