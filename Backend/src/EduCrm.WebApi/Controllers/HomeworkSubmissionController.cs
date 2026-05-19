using System.Security.Claims;
using EduCrm.Application.DTOs.HomeworkSubmission.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/homework-submissions")]
[Authorize]
public class HomeworkSubmissionController : BaseController
{
    private readonly IHomeworkSubmissionService _submissionService;

    public HomeworkSubmissionController(IHomeworkSubmissionService submissionService)
    {
        _submissionService = submissionService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken = default)
    {
        var result = await _submissionService.GetAllAsync(cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken = default)
    {
        var result = await _submissionService.GetByIdAsync(id, cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("homework/{homeworkId:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> GetByHomeworkId(
        int homeworkId,
        CancellationToken cancellationToken = default)
    {
        var result = await _submissionService.GetByHomeworkIdAsync(
            homeworkId,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("student/{studentId:int}")]
    public async Task<IActionResult> GetByStudentId(
        int studentId,
        CancellationToken cancellationToken = default)
    {
        var result = await _submissionService.GetByStudentIdAsync(
            studentId,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateHomeworkSubmissionRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await _submissionService.CreateAsync(
            request,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> Submit(
        [FromForm] SubmitHomeworkRequest request,
        CancellationToken cancellationToken = default)
    {
        var studentUserId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var result = await _submissionService.SubmitAsync(
            request,
            studentUserId,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update(
        [FromBody] UpdateHomeworkSubmissionRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await _submissionService.UpdateAsync(
            request,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost("grade")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Grade(
        [FromBody] GradeHomeworkRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await _submissionService.GradeAsync(
            request,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Mentor")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken = default)
    {
        var result = await _submissionService.DeleteAsync(
            id,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}