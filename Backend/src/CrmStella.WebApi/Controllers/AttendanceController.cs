using System.Security.Claims;
using CrmStella.Application.DTOs.Attendance.Request;
using CrmStella.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[Authorize]
[Route("api/attendances")]
public class AttendanceController(IAttendanceService attendanceService) : BaseController
{
    [HttpGet("lesson/{lessonId}")]
    public async Task<IActionResult> GetByLesson(
        int lessonId,
        CancellationToken cancellationToken)
    {
        var result = await attendanceService.GetByLessonIdAsync(lessonId, cancellationToken);
        return Ok(result);
    }
    
    [Authorize(Roles = "Admin")]
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? date)
    {
        var result = await attendanceService.GetSummaryAsync(date ?? DateTime.UtcNow);
        if (!result.IsSuccess) return HandleError(result);
        return Ok(result);
    }

    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetByStudent(
        int studentId,
        CancellationToken cancellationToken)
    {
        var result = await attendanceService.GetByStudentIdAsync(studentId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await attendanceService.GetByIdAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin,Mentor")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin");

        var result = await attendanceService.CreateAsync(
            request,
            userId,
            isAdmin,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin,Mentor")]
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreate(
        [FromBody] BulkCreateAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("Admin");

        var result = await attendanceService.BulkCreateAsync(
            request,
            userId,
            isAdmin,
            cancellationToken);

        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin,Mentor")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await attendanceService.UpdateAsync(id, request, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await attendanceService.DeleteAsync(id, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }
}