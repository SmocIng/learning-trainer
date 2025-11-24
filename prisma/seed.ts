import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: hashedPassword,
      preferences: {
        create: {
          learningMode: 'standard',
          schedulingEnabled: false,
          customSettings: {
            questionsPerSession: 10,
            difficultyRange: [3, 7],
            feedbackLevel: 'detailed',
          },
          feedbackSettings: {
            showExplanations: true,
            showHints: true,
            immediateCorrection: true,
          },
          gamificationSettings: {
            enabled: true,
            showBadges: true,
            showLeaderboard: false,
          },
        },
      },
      progress: {
        create: {
          totalSessions: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          totalTimeSpent: 0,
          level: 1,
          experiencePoints: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      },
    },
  });

  console.log('✅ Created test user:', user.email);

  // Create sample content
  const content1 = await prisma.content.create({
    data: {
      title: 'Introduction to TypeScript',
      description:
        'Learn the basics of TypeScript including types, interfaces, and generics.',
      filePath: '/content/typescript-intro.md',
      fileType: 'md',
      topics: ['TypeScript', 'Programming', 'JavaScript'],
      difficulty: 4,
      analyzedAt: new Date(),
    },
  });

  console.log('✅ Created sample content:', content1.title);

  // Create sample questions for the content
  const questions = await Promise.all([
    prisma.question.create({
      data: {
        contentId: content1.id,
        type: 'multiple-choice',
        questionText: 'What is TypeScript?',
        options: {
          choices: [
            'A JavaScript library',
            'A superset of JavaScript',
            'A database',
            'A CSS framework',
          ],
        },
        correctAnswer: { answer: 'A superset of JavaScript' },
        explanation:
          'TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript.',
        difficulty: 3,
      },
    }),
    prisma.question.create({
      data: {
        contentId: content1.id,
        type: 'multiple-choice',
        questionText: 'Which keyword is used to define a type in TypeScript?',
        options: {
          choices: ['class', 'type', 'interface', 'Both type and interface'],
        },
        correctAnswer: { answer: 'Both type and interface' },
        explanation:
          'TypeScript provides both "type" and "interface" keywords for defining custom types.',
        difficulty: 5,
      },
    }),
    prisma.question.create({
      data: {
        contentId: content1.id,
        type: 'free-text',
        questionText:
          'Explain the difference between "interface" and "type" in TypeScript.',
        correctAnswer: {
          keywords: [
            'interface',
            'type',
            'extend',
            'union',
            'intersection',
            'declaration merging',
          ],
        },
        explanation:
          'Interfaces can be extended and merged, while types can use unions and intersections. Both can describe object shapes.',
        difficulty: 7,
      },
    }),
  ]);

  console.log(`✅ Created ${questions.length} sample questions`);

  // Create a sample learning session
  const session = await prisma.learningSession.create({
    data: {
      userId: user.id,
      contentId: content1.id,
      mode: 'standard',
      status: 'completed',
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(),
      totalQuestions: 2,
      answeredQuestions: 2,
      correctAnswers: 1,
      interactions: {
        create: [
          {
            questionId: questions[0].id,
            userAnswer: { answer: 'A superset of JavaScript' },
            isCorrect: true,
            timeSpent: 45,
            feedback: 'Excellent! You got it right.',
            hints: [],
            nextReviewAt: new Date(Date.now() + 86400000), // 1 day from now
            repetitionCount: 1,
            easeFactor: 2.6,
            interval: 1,
          },
          {
            questionId: questions[1].id,
            userAnswer: { answer: 'type' },
            isCorrect: false,
            timeSpent: 60,
            feedback:
              'Not quite. TypeScript provides both "type" and "interface" keywords.',
            hints: ['Think about multiple ways to define types in TypeScript'],
            nextReviewAt: new Date(Date.now() + 600000), // 10 minutes from now
            repetitionCount: 0,
            easeFactor: 2.5,
            interval: 0,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample learning session');

  // Update user progress
  await prisma.learningProgress.update({
    where: { userId: user.id },
    data: {
      totalSessions: 1,
      totalQuestions: 2,
      correctAnswers: 1,
      totalTimeSpent: 105, // 45 + 60 seconds
      experiencePoints: 50,
      currentStreak: 1,
      longestStreak: 1,
      lastStudyDate: new Date(),
    },
  });

  console.log('✅ Updated user progress');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nTest credentials:');
  console.log('  Email: test@example.com');
  console.log('  Password: password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
