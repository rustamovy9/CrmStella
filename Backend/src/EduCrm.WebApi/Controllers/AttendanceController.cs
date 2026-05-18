using System.Security.Claims;
using EduCrm.Application.DTOs.Attendance.Request;
using EduCrm.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[Authorize]
[Route("api/attendances")]
public class AttendanceController(IAttendanceService attendanceService) : BaseController
{
    // получить посещаемость урока
    [HttpGet("lesson/{lessonId}")]
    public async Task<IActionResult> GetByLesson(
        int lessonId,
        CancellationToken cancellationToken)
    {
        var result = await attendanceService.GetByLessonIdAsync(lessonId, cancellationToken);
        return Ok(result);
    }

    // получить посещаемость студента
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

    // отметить одного студента
    [Authorize(Roles = "Admin,Mentor")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var mentorId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await attendanceService.CreateAsync(request, mentorId, cancellationToken);
        if (!result.IsSuccess)
            return HandleError(result);

        return Ok(result);
    }

    // отметить всю группу сразу
    [Authorize(Roles = "Admin,Mentor")]
    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreate(
        [FromBody] BulkCreateAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var mentorId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await attendanceService.BulkCreateAsync(request, mentorId, cancellationToken);
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