using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
// Update the namespace below to the correct one where AppDbContext is defined
using BoardingBee_backend.Models; // Replace 'Models' with the actual namespace containing AppDbContext

namespace BoardingBee_backend.Controllers
{
    [ApiController, Route("api/admin/activity")]
    public class AdminActivityController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminActivityController(AppDbContext db) { _db = db; }

        [HttpGet("recent")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Recent([FromQuery] int limit=50)
        {
            var items = await _db.ActivityLogs.AsNoTracking().OrderByDescending(a => a.At).Take(limit).ToListAsync();
            return Ok(items);
        }
    }
}
