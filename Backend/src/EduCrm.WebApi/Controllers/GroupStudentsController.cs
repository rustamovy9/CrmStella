using EduCrm.Application.DTOs.GroupStudent.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/group-students")]
[Authorize(Roles = "Admin")]
public class GroupStudentController(IGroupStudentService groupStudentService) : BaseController
{
    [HttpGet("group/{groupId:int}")]
    public async Task<IActionResult> GetByGroup(int groupId)
    {
        var result = await groupStudentService.GetByGroupAsync(groupId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("enroll")]
    public async Task<IActionResult> Enroll([FromBody] EnrollStudentRequest request)
    {
        var result = await groupStudentService.EnrollAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("remove")]
    public async Task<IActionResult> Remove([FromBody] RemoveStudentRequest request)
    {
        var result = await groupStudentService.RemoveAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] TransferStudentRequest request)
    {
        var result = await groupStudentService.TransferAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}