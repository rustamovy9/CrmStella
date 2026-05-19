using System.Security.Claims;
using EduCrm.Application.DTOs.HomeworkSubmission.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/homework-submissions")]
[Authorize]
public class HomeworkSubmissionController(IHomeworkSubmissionService submissionService) : BaseController
{
    [HttpGet("homework/{homeworkId:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetByHomework(int homeworkId)
    {
        var result = await submissionService.GetByHomeworkAsync(homeworkId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await submissionService.GetByIdAsync(id);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Submit([FromForm] SubmitHomeworkRequest request)
    {
        var studentUserId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await submissionService.SubmitAsync(request, studentUserId);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}