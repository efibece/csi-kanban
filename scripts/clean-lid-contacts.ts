/**
 * Script to clean up contacts with @lid in phone number
 * This fixes the issue where contacts were saved with invalid phone formats
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function cleanLidContacts() {
  try {
    console.log('🔍 Searching for contacts with @lid in phone number...');
    
    // Find all contacts with @lid in phone number
    const contactsWithLid = await prisma.contact.findMany({
      where: {
        phoneNumber: {
          contains: '@lid'
        }
      },
      include: {
        conversations: {
          include: {
            messages: true
          }
        }
      }
    });

    console.log(`📊 Found ${contactsWithLid.length} contacts with @lid format`);

    if (contactsWithLid.length === 0) {
      console.log('✅ No contacts to clean!');
      return;
    }

    // Delete these contacts and their related data
    console.log('🗑️  Deleting contacts with @lid format...');
    
    const deletedCount = await prisma.contact.deleteMany({
      where: {
        phoneNumber: {
          contains: '@lid'
        }
      }
    });

    console.log(`✅ Deleted ${deletedCount.count} contacts with @lid format`);
    console.log('\n💡 Next time a message arrives from these contacts, they will be created with correct phone numbers.');
    
  } catch (error) {
    console.error('❌ Error cleaning contacts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanLidContacts()
  .then(() => {
    console.log('\n✨ Clean up completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Clean up failed:', error);
    process.exit(1);
  });
