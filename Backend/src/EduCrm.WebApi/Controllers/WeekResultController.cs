using EduCrm.Application.DTOs.WeekResult.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/week-results")]
[Authorize(Roles = "Admin,Mentor")]
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
    public async Task<IActionResult> Recalculate([FromBody] RecalculateWeekRequest request)
    {
        var result = await weekResultService.RecalculateAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPatch("{id:int}/comment")]
    public async Task<IActionResult> SetComment(int id, [FromBody] SetMentorCommentRequest request)
    {
        var result = await weekResultService.SetMentorCommentAsync(id, request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}