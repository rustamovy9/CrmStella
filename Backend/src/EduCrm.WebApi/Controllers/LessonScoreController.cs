using EduCrm.Application.DTOs.LessonScore.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Route("api/lesson-scores")]
[Authorize(Roles = "Admin,Mentor")]
public class LessonScoreController : BaseController
{
    private readonly ILessonScoreService _scoreService;

    public LessonScoreController(ILessonScoreService scoreService)
    {
        _scoreService = scoreService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken = default)
    {
        var result = await _scoreService.GetAllAsync(cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _scoreService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("lesson/{lessonId:int}")]
    public async Task<IActionResult> GetByLessonId(int lessonId, CancellationToken cancellationToken = default)
    {
        var result = await _scoreService.GetByLessonIdAsync(lessonId, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpGet("student/{studentId:int}")]
    public async Task<IActionResult> GetByStudentId(int studentId, CancellationToken cancellationToken = default)
    {
        var result = await _scoreService.GetByStudentIdAsync(studentId, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLessonScoreRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _scoreService.CreateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateLessonScoreRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _scoreService.UpdateAsync(request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var result = await _scoreService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}