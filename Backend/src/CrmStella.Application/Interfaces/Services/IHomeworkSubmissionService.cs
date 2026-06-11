using CrmStella.Application.Common;
using CrmStella.Application.DTOs.HomeworkSubmission.Request;
using CrmStella.Application.DTOs.HomeworkSubmission.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IHomeworkSubmissionService
{
    Task<Result<HomeworkSubmissionResponse>> SubmitAsync(
        SubmitHomeworkRequest request,
        int studentUserId);

    Task<Result<HomeworkSubmissionResponse>> GetByIdAsync(int id);

    Task<Result<List<HomeworkSubmissionResponse>>> GetByHomeworkAsync(int homeworkId);

    Task<Result<HomeworkSubmissionResponse>> GradeAsync(
        GradeHomeworkRequest request,
        int userId,
        bool isAdmin,
        CancellationToken cancellationToken = default);
}