using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Schedule.Request;
using CrmStella.Application.DTOs.Schedule.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IScheduleService
{
    public Task<Result<PagedResult<ScheduleResponse>>> GetAllAsync(
        GetSchedulesQuery query,
        CancellationToken cancellationToken = default);

    Task<Result<List<ScheduleResponse>>> GetByGroupIdAsync(int groupId, CancellationToken cancellationToken = default);
    Task<Result<ScheduleResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Result<ScheduleResponse>> CreateAsync(CreateScheduleRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<ScheduleResponse>> UpdateAsync(int id, UpdateScheduleRequest request,
        CancellationToken cancellationToken = default);

    Task<Result<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
}