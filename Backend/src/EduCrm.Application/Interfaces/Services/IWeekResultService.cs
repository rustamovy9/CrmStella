using EduCrm.Application.Common;
using EduCrm.Application.DTOs.WeekResult.Request;
using EduCrm.Application.DTOs.WeekResult.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IWeekResultService
{
    Task<Result<List<WeekResultResponse>>> GetByStudentAndGroupAsync(int studentId, int groupId);
    Task<Result<List<WeekResultResponse>>> GetByGroupAndWeekAsync(int groupId, int weekNumber);
    Task<Result<WeekResultResponse>> GetByKeyAsync(int studentId, int groupId, int weekNumber);

    Task<Result<WeekResultResponse>> RecalculateAsync(RecalculateWeekRequest request);
    Task<Result<WeekResultResponse>> SetMentorCommentAsync(int weekResultId, SetMentorCommentRequest request);
}