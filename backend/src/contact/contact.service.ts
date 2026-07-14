import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async getContacts(userId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { userId },
      include: {
        contact: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });
    
    return contacts.map(c => ({
      id: c.id,
      contactId: c.contactId,
      email: c.contact.email,
      isFavorite: c.isFavorite
    }));
  }

  async addContact(userId: string, contactId: string) {
    if (userId === contactId) {
      throw new Error("Cannot add yourself as a contact.");
    }
    
    const existing = await this.prisma.contact.findUnique({
      where: { userId_contactId: { userId, contactId } }
    });
    
    if (existing) {
      throw new Error("User is already in your contacts.");
    }
    
    return this.prisma.contact.create({
      data: {
        userId,
        contactId
      },
      include: {
        contact: {
          select: { email: true }
        }
      }
    });
  }

  async removeContact(userId: string, id: string) {
    return this.prisma.contact.deleteMany({
      where: { 
        id,
        userId
      }
    });
  }
}
