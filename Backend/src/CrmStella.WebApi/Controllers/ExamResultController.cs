using System.Security.Claims;
using CrmStella.Application.DTOs.ExamResult.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Route("api/exam-results")]
[Authorize(Roles = "Admin,Mentor")]
public class ExamResultController(IExamResultService examResultService) : BaseController
{
    [HttpGet("exam/{examId:int}")]
    public async Task<IActionResult> GetByExam(int examId)
    {
        var result = await examResultService.GetByExamAsync(examId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await examResultService.GetByIdAsync(id);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExamResultRequest request)
    {
        var mentorUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await examResultService.CreateAsync(request, mentorUserId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateExamResultRequest request)
    {
        var mentorUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await examResultService.UpdateAsync(id, request, mentorUserId);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}