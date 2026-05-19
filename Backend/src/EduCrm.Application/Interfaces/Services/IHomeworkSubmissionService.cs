using EduCrm.Application.Common;
using EduCrm.Application.DTOs.HomeworkSubmission.Request;
using EduCrm.Application.DTOs.HomeworkSubmission.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IHomeworkSubmissionService
{
    Task<Result<List<HomeworkSubmissionResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Result<HomeworkSubmissionResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<List<HomeworkSubmissionResponse>>> GetByHomeworkIdAsync(int homeworkId, CancellationToken cancellationToken = default);
    Task<Result<List<HomeworkSubmissionResponse>>> GetByStudentIdAsync(int studentId, CancellationToken cancellationToken = default);
    Task<Result<HomeworkSubmissionResponse>> CreateAsync(CreateHomeworkSubmissionRequest request, CancellationToken cancellationToken = default);
    Task<Result<HomeworkSubmissionResponse>> UpdateAsync(UpdateHomeworkSubmissionRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<HomeworkSubmissionResponse>> GradeAsync(GradeHomeworkRequest request, CancellationToken cancellationToken = default);
}