using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using BoardingBee_backend.Controllers.Dto;

namespace BoardingBee_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ListingsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ListingsController(AppDbContext db) => _db = db;

        // GET api/listings/owner/{ownerId}?page=1&pageSize=10&status=Approved|Pending|Expired
        [HttpGet("owner/{ownerId:int}")]
        public async Task<IActionResult> GetOwnerListings(
            int ownerId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null)
        {
            var query = _db.Listings.AsNoTracking().Where(l => l.OwnerId == ownerId);

            // Auto-mark expired on read (simple rule)
            var now = DateTime.UtcNow;
            await _db.Listings.Where(l => l.Status != ListingStatus.Expired && l.ExpiresAt < now)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, ListingStatus.Expired));

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ListingStatus>(status, true, out var parsed))
                query = query.Where(l => l.Status == parsed);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(l => l.LastUpdated)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var dto = items.Select(ListingMappings.ToListItemDto);
            var counts = await _db.Listings
                .Where(l => l.OwnerId == ownerId)
                .GroupBy(l => l.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                total,
                page,
                pageSize,
                data = dto,
                summary = new {
                    totalAll = await _db.Listings.CountAsync(l => l.OwnerId == ownerId),
                    approved = counts.FirstOrDefault(c => c.Status == ListingStatus.Approved)?.Count ?? 0,
                    pending  = counts.FirstOrDefault(c => c.Status == ListingStatus.Pending)?.Count ?? 0,
                    expired  = counts.FirstOrDefault(c => c.Status == ListingStatus.Expired)?.Count ?? 0
                }
            });
        }

        // GET api/listings/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetOne(Guid id)
        {
            var listing = await _db.Listings.Include(l => l.Owner).FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();
            return Ok(ListingMappings.ToDetailDto(listing));
        }

        // POST api/listings
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateListingRequest req, [FromQuery] int ownerId)
        {
            // TODO: derive ownerId from JWT; for now we accept ?ownerId=123
            var listing = new Listing
            {
                Title = req.Title,
                Location = req.Location,
                Price = req.Price,
                Availability = Enum.TryParse<Availability>(req.Availability, true, out var av) ? av : Availability.Available,
                Description = req.Description,
                ContactPhone = req.ContactPhone,
                ContactEmail = req.ContactEmail,
                AmenitiesCsv = req.Amenities is { Length: > 0 } ? string.Join(",", req.Amenities) : null,
                ImagesCsv = req.Images is { Length: > 0 } ? string.Join(",", req.Images) : null,
                OwnerId = ownerId,
                Status = ListingStatus.Pending, // require admin approval
                ExpiresAt = DateTime.UtcNow.AddMonths(6)
            };

            _db.Listings.Add(listing);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOne), new { id = listing.Id }, ListingMappings.ToDetailDto(listing));
        }

        // PUT api/listings/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateListingRequest req)
        {
            var listing = await _db.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            listing.Title = req.Title;
            listing.Location = req.Location;
            listing.Price = req.Price;
            listing.Availability = Enum.TryParse<Availability>(req.Availability, true, out var av) ? av : listing.Availability;
            listing.Description = req.Description;
            listing.ContactPhone = req.ContactPhone;
            listing.ContactEmail = req.ContactEmail;
            listing.AmenitiesCsv = req.Amenities is { Length: > 0 } ? string.Join(",", req.Amenities) : null;
            listing.ImagesCsv = req.Images is { Length: > 0 } ? string.Join(",", req.Images) : null;

            listing.LastUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(ListingMappings.ToDetailDto(listing));
        }

        // DELETE api/listings/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var listing = await _db.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            _db.Listings.Remove(listing);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // POST api/listings/{id}/renew
        [HttpPost("{id:guid}/renew")]
        public async Task<IActionResult> Renew(Guid id)
        {
            var listing = await _db.Listings.FirstOrDefaultAsync(l => l.Id == id);
            if (listing == null) return NotFound();

            listing.ExpiresAt = DateTime.UtcNow.AddMonths(6);
            listing.Status = ListingStatus.Approved;
            listing.LastUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(ListingMappings.ToListItemDto(listing));
        }
    }
}
