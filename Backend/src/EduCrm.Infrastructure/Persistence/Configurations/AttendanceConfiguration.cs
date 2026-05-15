using EduCrm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduCrm.Infrastructure.Persistence.Configurations;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.AbsenceReason)
            .HasMaxLength(500);

        builder.Property(x => x.MentorNote)
            .HasMaxLength(500);

        builder.Property(x => x.MarkedAt)
            .IsRequired();

        builder.HasOne(x => x.Lesson)
            .WithMany(x => x.Attendances)
            .HasForeignKey(x => x.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Student)
            .WithMany(x => x.Attendances)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.LessonId, x.StudentId })
            .IsUnique();

        builder.HasIndex(x => x.StudentId);
        builder.HasIndex(x => x.LessonId);
    }
}