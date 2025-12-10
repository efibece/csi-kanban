
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { encrypt } from '../lib/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists, skipping seed');
      return;
    }

    // Hash password for admin user
    const hashedPassword = await bcrypt.hash('johndoe123', 12);

    // Create admin user first
    const adminUser = await prisma.user.create({
      data: {
        email: 'john@doe.com',
        name: 'John Doe',
        passwordHash: hashedPassword,
        role: 'owner'
      }
    });

    console.log('✅ Created admin user:', adminUser.email);

    // Create workspace with the admin user as owner
    const workspace = await prisma.workspace.create({
      data: {
        name: "Default Workspace",
        ownerId: adminUser.id
      }
    });

    console.log('✅ Created workspace:', workspace.name);

    // Update admin user to assign workspace
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { workspaceId: workspace.id }
    });

    console.log('✅ Assigned user to workspace');

    // Create sample contacts
    const contacts = await Promise.all([
      prisma.contact.create({
        data: {
          phoneNumber: '+1234567890',
          name: 'Alice Johnson',
          workspaceId: workspace.id
        }
      }),
      prisma.contact.create({
        data: {
          phoneNumber: '+0987654321',
          name: 'Bob Smith',
          workspaceId: workspace.id
        }
      }),
      prisma.contact.create({
        data: {
          phoneNumber: '+1122334455',
          name: 'Charlie Brown',
          workspaceId: workspace.id
        }
      })
    ]);

    console.log('✅ Created sample contacts');

    // Create sample conversations
    const conversations = await Promise.all(
      contacts.map(contact =>
        prisma.conversation.create({
          data: {
            contactId: contact.id,
            workspaceId: workspace.id,
            lastMessageAt: new Date(),
            unreadCount: Math.floor(Math.random() * 5)
          }
        })
      )
    );

    console.log('✅ Created sample conversations');

    // Create sample messages
    const sampleMessages = [
      { text: 'Hello! How are you doing?', fromMe: false },
      { text: 'Hi! I\'m doing great, thanks for asking. How about you?', fromMe: true },
      { text: 'I\'m good too. Are we still on for the meeting tomorrow?', fromMe: false },
      { text: 'Yes, absolutely! Looking forward to it.', fromMe: true },
      { text: 'Perfect! See you at 2 PM.', fromMe: false },
      { text: 'Sounds good. Have a great rest of your day!', fromMe: true }
    ];

    let messageIndex = 0;
    for (const conversation of conversations) {
      const numMessages = 3 + Math.floor(Math.random() * 4); // 3-6 messages
      
      for (let i = 0; i < numMessages; i++) {
        const messageData = sampleMessages[messageIndex % sampleMessages.length];
        messageIndex++;

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            messageId: `msg_${Date.now()}_${i}`,
            fromMe: messageData.fromMe,
            senderPhone: messageData.fromMe ? 'owner' : contacts.find(c => c.id === conversation.contactId)?.phoneNumber || 'unknown',
            textContent: encrypt(messageData.text),
            timestamp: new Date(Date.now() - (numMessages - i) * 3600000), // 1 hour intervals
            status: messageData.fromMe ? 'sent' : 'received'
          }
        });
      }

      // Update conversation with latest message time
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });
    }

    console.log('✅ Created sample messages');

    // Create a sample WhatsApp session (disconnected)
    await prisma.whatsAppSession.create({
      data: {
        sessionName: 'Demo Session',
        status: 'disconnected',
        workspaceId: workspace.id
      }
    });

    console.log('✅ Created sample WhatsApp session');

    console.log('🎉 Database seeding completed successfully!');
    console.log('📧 Admin user created: john@doe.com / johndoe123');
    console.log('🏢 Workspace created with sample data');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
