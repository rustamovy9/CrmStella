using EduCrm.Domain.Entities;
namespace EduCrm.Application.Interfaces.Repositories;

public interface IHomeworkSubmissionRepository
{
    Task<List<HomeworkSubmission>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<HomeworkSubmission?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<List<HomeworkSubmission>> GetByHomeworkIdAsync(int homeworkId, CancellationToken cancellationToken = default);
    Task<List<HomeworkSubmission>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default);
    Task<HomeworkSubmission?> GetByHomeworkAndStudentAsync(int homeworkId, int studentId, CancellationToken cancellationToken = default);
    Task<bool> HasSubmittedAsync(int homeworkId, int studentId, CancellationToken cancellationToken = default);
    Task CreateAsync(HomeworkSubmission submission, CancellationToken cancellationToken = default);
    Task UpdateAsync(HomeworkSubmission submission, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}