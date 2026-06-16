using CrmStella.Application.DTOs.WeekResult.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/week-results")]
[Authorize]
public class WeekResultController(IWeekResultService weekResultService) : BaseController
{
    [HttpGet("student/{studentId:int}/group/{groupId:int}")]
    public async Task<IActionResult> GetByStudentAndGroup(int studentId, int groupId)
    {
        var result = await weekResultService.GetByStudentAndGroupAsync(studentId, groupId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("group/{groupId:int}/week/{weekNumber:int}")]
    public async Task<IActionResult> GetByGroupAndWeek(int groupId, int weekNumber)
    {
        var result = await weekResultService.GetByGroupAndWeekAsync(groupId, weekNumber);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("student/{studentId:int}/group/{groupId:int}/week/{weekNumber:int}")]
    public async Task<IActionResult> GetByKey(int studentId, int groupId, int weekNumber)
    {
        var result = await weekResultService.GetByKeyAsync(studentId, groupId, weekNumber);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("recalculate")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Recalculate([FromBody] RecalculateWeekRequest request)
    {
        var result = await weekResultService.RecalculateAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
    
    [HttpPatch("{studentId:int}/{groupId:int}/{weekNumber:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Update(
        int studentId,
        int groupId,
        int weekNumber,
        [FromBody] UpdateWeekResultRequest request)
    {
        var result = await weekResultService.UpdateAsync(
            studentId, groupId, weekNumber, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/comment")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> SetComment(int id, [FromBody] SetMentorCommentRequest request)
    {
        var result = await weekResultService.SetMentorCommentAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}