using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduCrm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMnetorFromCourse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Courses_Mentors_MentorId",
                table: "Courses");

            migrationBuilder.DropIndex(
                name: "IX_Courses_MentorId",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "MentorId",
                table: "Courses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MentorId",
                table: "Courses",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Courses_MentorId",
                table: "Courses",
                column: "MentorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Courses_Mentors_MentorId",
                table: "Courses",
                column: "MentorId",
                principalTable: "Mentors",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
