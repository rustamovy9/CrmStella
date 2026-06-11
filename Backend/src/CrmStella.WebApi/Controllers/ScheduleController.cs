using CrmStella.Application.DTOs.Schedule.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Authorize]
[Route("api/schedules")]
public class ScheduleController(IScheduleService scheduleService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetSchedulesQuery query)
    {
        var result = await scheduleService.GetAllAsync(query);
        if (!result.IsSuccess)
            return HandleError(result);
        return Ok(result);
    }

    [HttpGet("group/{groupId}")]
    public async Task<IActionResult> GetByGroup(int groupId, CancellationToken cancellationToken)
    {
        var result = await scheduleService.GetByGroupIdAsync(groupId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await scheduleService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin,Mentor")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateScheduleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await scheduleService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin,Mentor")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateScheduleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await scheduleService.UpdateAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await scheduleService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}