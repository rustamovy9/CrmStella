using EduCrm.Application.Common;
using EduCrm.Application.DTOs.ExamResult.Request;
using EduCrm.Application.DTOs.ExamResult.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IExamResultService
{
    Task<Result<List<ExamResultResponse>>> GetByExamAsync(int examId);
    Task<Result<ExamResultResponse>> GetByIdAsync(int id);
    Task<Result<ExamResultResponse>> CreateAsync(CreateExamResultRequest request, int mentorUserId);
    Task<Result<ExamResultResponse>> UpdateAsync(int id, UpdateExamResultRequest request, int mentorUserId);
}