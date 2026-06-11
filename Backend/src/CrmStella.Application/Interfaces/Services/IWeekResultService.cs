using CrmStella.Application.Common;
using CrmStella.Application.DTOs.WeekResult.Request;
using CrmStella.Application.DTOs.WeekResult.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IWeekResultService
{
    Task<Result<List<WeekResultResponse>>> GetByStudentAndGroupAsync(int studentId, int groupId);
    Task<Result<List<WeekResultResponse>>> GetByGroupAndWeekAsync(int groupId, int weekNumber);
    Task<Result<WeekResultResponse>> GetByKeyAsync(int studentId, int groupId, int weekNumber);
    Task<Result<WeekResultResponse>> RecalculateAsync(RecalculateWeekRequest request);

    Task<Result<WeekResultResponse>> UpdateAsync(
        int studentId,
        int groupId,
        int weekNumber,
        UpdateWeekResultRequest request);

    Task<Result<WeekResultResponse>> SetMentorCommentAsync(int weekResultId, SetMentorCommentRequest request);
}