
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if this is the first user (will become owner)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Create workspace for first user
    let workspaceId = null;
    if (isFirstUser) {
      const workspace = await prisma.workspace.create({
        data: {
          name: `${name || email}'s Workspace`,
          ownerId: 'temp' // We'll update this after user creation
        }
      });
      workspaceId = workspace.id;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: hashedPassword,
        role: isFirstUser ? 'owner' : 'user',
        workspaceId
      }
    });

    // Update workspace owner if this is the first user
    if (isFirstUser && workspaceId) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: user.id }
      });
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
