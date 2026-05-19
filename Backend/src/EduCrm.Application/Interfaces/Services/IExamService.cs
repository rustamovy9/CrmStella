using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Exam.Request;
using EduCrm.Application.DTOs.Exam.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IExamService
{
    Task<Result<List<ExamListItemResponse>>> GetAllAsync();
    Task<Result<List<ExamListItemResponse>>> GetByGroupAsync(int groupId);
    Task<Result<ExamResponse>> GetByIdAsync(int id);
    Task<Result<ExamResponse>> CreateAsync(CreateExamRequest request);
    Task<Result<ExamResponse>> UpdateAsync(int id, UpdateExamRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetExamStatusRequest request);
}