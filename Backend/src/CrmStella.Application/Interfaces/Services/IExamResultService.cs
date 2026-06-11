using CrmStella.Application.Common;
using CrmStella.Application.DTOs.ExamResult.Request;
using CrmStella.Application.DTOs.ExamResult.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IExamResultService
{
    Task<Result<List<ExamResultResponse>>> GetByExamAsync(int examId);
    Task<Result<ExamResultResponse>> GetByIdAsync(int id);
    Task<Result<ExamResultResponse>> CreateAsync(CreateExamResultRequest request, int mentorUserId);
    Task<Result<ExamResultResponse>> UpdateAsync(int id, UpdateExamResultRequest request, int mentorUserId);
}