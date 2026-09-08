import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { InviteMemberDto, UpdateMemberDto } from './dto/member.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  invite(@CurrentUser() user: AuthUser, @Body() dto: InviteMemberDto) {
    return this.membersService.invite(user.userId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('workspaceOwnerId') workspaceOwnerId?: string,
  ) {
    return this.membersService.list(user.userId, workspaceOwnerId);
  }

  @Patch(':id')
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.updateMember(id, user.userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.membersService.remove(id, user.userId);
  }
}
