using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IExamResultRepository
{
    Task<List<ExamResult>> GetByExamAsync(int examId, CancellationToken cancellationToken = default);
    Task<ExamResult?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ExamResult?> GetByExamAndStudentAsync(int examId, int studentId, CancellationToken cancellationToken = default);

    Task CreateAsync(ExamResult result, CancellationToken cancellationToken = default);
    Task UpdateAsync(ExamResult result, CancellationToken cancellationToken = default);
}