using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduCrm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BoolExam : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Exams",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Exams");
        }
    }
}
