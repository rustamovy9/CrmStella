using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Mentor.Request;
using CrmStella.Application.DTOs.Mentor.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IMentorService
{
    public Task<Result<PagedResult<MentorListItemResponse>>> GetAllAsync(
        MentorQueryRequest query,
        CancellationToken cancellationToken = default);

    Task<Result<MentorResponse>> GetByIdAsync(int id);
    Task<Result<MentorResponse>> UpdateAsync(int id, UpdateMentorRequest request);
    Task<Result<bool>> SetStatusAsync(int id, SetMentorStatusRequest request);

    Task<Result<MentorDashboardResponse>> GetDashboardAsync(int id);
}