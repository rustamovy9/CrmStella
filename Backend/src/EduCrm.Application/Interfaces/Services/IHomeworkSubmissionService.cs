using EduCrm.Application.Common;
using EduCrm.Application.DTOs.HomeworkSubmission.Request;
using EduCrm.Application.DTOs.HomeworkSubmission.Response;

namespace EduCrm.Application.Interfaces.Services;

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