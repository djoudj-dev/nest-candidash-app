import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from '../auth/dto/auth-response.dto';

@ApiTags('Users')
@Controller('accounts')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('directory')
  @ApiOperation({ summary: 'Récupérer tous les comptes utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'List of all user accounts',
    type: [UserResponseDto],
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getUsers() {
    const users = await this.usersService.findAll();
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userResponse } = user;
      return userResponse;
    });
  }

  @Get('profile/:id')
  @ApiOperation({ summary: 'Récupérer le profil utilisateur par ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile information',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Post('registration')
  @ApiOperation({ summary: 'Enregistrer un nouveau compte utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'User account created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Put('profile-update')
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateUser(@Body(ValidationPipe) updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Delete('deactivation/:id')
  @ApiOperation({ summary: 'Désactiver le compte utilisateur' })
  @ApiParam({ name: 'id', description: 'User ID to deactivate' })
  @ApiResponse({
    status: 200,
    description: 'User account deactivated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('id') id: string) {
    const user = await this.usersService.remove(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }
}
