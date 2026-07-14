import { Controller, Get, Post, Delete, Param, Body, Headers, BadRequestException } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  private getUserId(headers: any) {
    const userId = headers['x-user-id'];
    if (!userId) throw new BadRequestException('User ID is required in headers (x-user-id)');
    return userId;
  }

  @Get()
  async getContacts(@Headers() headers) {
    const userId = this.getUserId(headers);
    const contacts = await this.contactService.getContacts(userId);
    return { success: true, contacts };
  }

  @Post()
  async addContact(@Headers() headers, @Body() body: { contactId: string }) {
    const userId = this.getUserId(headers);
    if (!body.contactId) throw new BadRequestException('contactId is required');
    
    try {
      const newContact = await this.contactService.addContact(userId, body.contactId);
      return { success: true, contact: newContact };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Delete(':id')
  async removeContact(@Headers() headers, @Param('id') id: string) {
    const userId = this.getUserId(headers);
    await this.contactService.removeContact(userId, id);
    return { success: true, message: 'Contact removed' };
  }
}
