using EduCrm.Application.Common;
using EduCrm.Application.DTOs.HomeworkSubmission.Request;
using EduCrm.Application.DTOs.HomeworkSubmission.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IHomeworkSubmissionService
{
    // 📌 Student flow
    Task<Result<HomeworkSubmissionResponse>> SubmitAsync(
        SubmitHomeworkRequest request,
        int studentUserId);

    Task<Result<HomeworkSubmissionResponse>> GetByIdAsync(int id);

    Task<Result<List<HomeworkSubmissionResponse>>> GetByHomeworkIdAsync(int homeworkId);

    Task<Result<List<HomeworkSubmissionResponse>>> GetByStudentIdAsync(int studentId);

    // 📌 Admin / Mentor flow
    Task<Result<List<HomeworkSubmissionResponse>>> GetAllAsync();

    Task<Result<HomeworkSubmissionResponse>> CreateAsync(CreateHomeworkSubmissionRequest request);

    Task<Result<HomeworkSubmissionResponse>> UpdateAsync(UpdateHomeworkSubmissionRequest request);

    Task<Result<bool>> DeleteAsync(int id);

    Task<Result<HomeworkSubmissionResponse>> GradeAsync(GradeHomeworkRequest request);
}