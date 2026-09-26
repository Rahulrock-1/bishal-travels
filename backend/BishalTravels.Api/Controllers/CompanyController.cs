using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Data;
using BishalTravels.Api.Models;
using BishalTravels.Api.DTOs;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompanyController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;

    public CompanyController(BishalTravelsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<CompanyProfileDto>> GetCompanyProfile()
    {
        var profile = await _context.CompanyProfiles.FirstOrDefaultAsync();
        if (profile == null)
        {
            profile = new CompanyProfile();
            _context.CompanyProfiles.Add(profile);
            await _context.SaveChangesAsync();
        }

        return Ok(MapToDto(profile));
    }

    [HttpPut]
    public async Task<ActionResult<CompanyProfileDto>> UpdateCompanyProfile([FromBody] CompanyProfileDto dto)
    {
        var profile = await _context.CompanyProfiles.FirstOrDefaultAsync();
        if (profile == null)
        {
            profile = new CompanyProfile();
            _context.CompanyProfiles.Add(profile);
        }

        profile.BusinessName = dto.BusinessName ?? profile.BusinessName;
        profile.Tagline = dto.Tagline ?? profile.Tagline;
        profile.TradeLicenseNo = dto.TradeLicenseNo ?? profile.TradeLicenseNo;
        profile.VendorId = dto.VendorId ?? profile.VendorId;
        profile.Gstin = dto.Gstin ?? profile.Gstin;
        profile.Pan = dto.Pan ?? profile.Pan;
        profile.Address = dto.Address ?? profile.Address;
        profile.Phone = dto.Phone ?? profile.Phone;
        profile.Email = dto.Email ?? profile.Email;
        profile.BankName = dto.BankName ?? profile.BankName;
        profile.AccountHolder = dto.AccountHolder ?? profile.AccountHolder;
        profile.AccountNumber = dto.AccountNumber ?? profile.AccountNumber;
        profile.IfscCode = dto.IfscCode ?? profile.IfscCode;
        profile.BranchName = dto.BranchName ?? profile.BranchName;
        profile.UpiId = dto.UpiId ?? profile.UpiId;
        profile.SignatoryName = dto.SignatoryName ?? profile.SignatoryName;
        profile.SignatoryTitle = dto.SignatoryTitle ?? profile.SignatoryTitle;
        profile.LogoUrl = dto.LogoUrl ?? profile.LogoUrl;
        if (dto.DefaultTerms != null && dto.DefaultTerms.Length > 0)
        {
            profile.DefaultTerms = dto.DefaultTerms;
        }
        profile.IsConfigured = true;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(MapToDto(profile));
    }

    private static CompanyProfileDto MapToDto(CompanyProfile p)
    {
        return new CompanyProfileDto(
            p.BusinessName,
            p.Tagline,
            p.TradeLicenseNo,
            p.VendorId,
            p.Gstin,
            p.Pan,
            p.Address,
            p.Phone,
            p.Email,
            p.BankName,
            p.AccountHolder,
            p.AccountNumber,
            p.IfscCode,
            p.BranchName,
            p.UpiId,
            p.SignatoryName,
            p.SignatoryTitle,
            p.LogoUrl,
            p.DefaultTerms,
            p.IsConfigured
        );
    }
}
