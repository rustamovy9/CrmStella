using System.Security.Claims;
using CrmStella.Application.DTOs.GroupStudent.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/group-students")]
[Authorize]
public class GroupStudentController(IGroupStudentService groupStudentService) : BaseController
{
    [HttpGet("group/{groupId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetByGroup(int groupId)
    {
        var result = await groupStudentService.GetByGroupAsync(groupId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("enroll")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Enroll([FromBody] EnrollStudentRequest request)
    {
        var result = await groupStudentService.EnrollAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("remove")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Remove([FromBody] RemoveStudentRequest request)
    {
        var result = await groupStudentService.RemoveAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("transfer")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Transfer([FromBody] TransferStudentRequest request)
    {
        var result = await groupStudentService.TransferAsync(request);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("my-groups")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyGroups()
    {
        var userId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );
        var result = await groupStudentService.GetMyGroupsAsync(userId);

        if (!result.IsSuccess)
        {
            return HandleError(result);
        }

        return Ok(result);
    }

    [HttpGet("my-groups/{groupId:int}")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetMyGroup(
    int groupId)
    {
        var userId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        var result =
            await groupStudentService.GetMyGroupAsync(
                userId,
                groupId
            );

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}