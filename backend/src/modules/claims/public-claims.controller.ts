import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { SubmitPublicClaimDto } from './dto/submit-public-claim.dto';

@Controller('public/claims')
export class PublicClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get(':token')
  findPublicClaim(@Param('token') token: string) {
    return this.claimsService.findPublicClaim(token);
  }

  @Post(':token/submit')
  submitPublicClaim(
    @Param('token') token: string,
    @Body() body: SubmitPublicClaimDto,
  ) {
    return this.claimsService.submitPublicClaim(token, body);
  }
}
