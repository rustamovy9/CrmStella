using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/student-progress")]
[Authorize(Roles = "Admin,Mentor")]
public class StudentProgressController(
    IStudentProgressService progressService) : BaseController
{
    [HttpGet("student/{studentId:int}/group/{groupId:int}")]
    public async Task<IActionResult> GetByStudentAndGroup(int studentId, int groupId)
    {
        var result = await progressService.GetByStudentAndGroupAsync(studentId, groupId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("group/{groupId:int}")]
    public async Task<IActionResult> GetByGroup(int groupId)
    {
        var result = await progressService.GetByGroupAsync(groupId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("recalculate/student/{studentId:int}/group/{groupId:int}")]
    public async Task<IActionResult> Recalculate(int studentId, int groupId)
    {
        var result = await progressService.RecalculateAsync(studentId, groupId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}