import prisma from './client.js';
import bcrypt from 'bcryptjs';
import { logger } from '../logger.js';

async function seedAdmins() {
  try {
    logger.info('🌱 Seeding Admin users...');

    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2024', 10);

    const admin = await prisma.admin.upsert({
      where: { email: 'admin@frifri.com' },
      update: {},
      create: {
        email: 'admin@frifri.com',
        password: adminPassword,
        role: 'admin',
        active: true
      }
    });

    logger.info(`✅ Admin created: ${admin.email}`);
  } catch (error) {
    logger.error('❌ Admin seeding failed:', error);
    throw error;
  }
}

async function main() {
  try {
    logger.info('🌱 Starting database seed...');

    // Clear existing data in correct order
    await prisma.gameSession.deleteMany();
    await prisma.prizeCode.deleteMany();
    await prisma.poem.deleteMany();
    await prisma.sponsor.deleteMany();
    await prisma.newsletterSubscriber.deleteMany();

    // Seed Sponsors
    const sponsors = await prisma.sponsor.createMany({
      data: [
        {
          name: 'Museo della Ceramica di Montelupo',
          logoUrl: null,
          description: 'Il museo della ceramica di Montelupo, dedicato alla tradizione ceramica della città.',
          link: 'https://museoceramica.it',
          tier: 'premium',
          prizeDescription: 'Biglietto d\'ingresso al museo + catalogo esclusivo',
          gameType: 'tutti',
          active: true
        },
        {
          name: 'Fornace Artistica Italiana',
          logoUrl: null,
          description: 'Produttore tradizionale di ceramica e articoli in terracotta.',
          link: 'https://fornaceartistica.it',
          tier: 'base',
          prizeDescription: 'Sconto 20% su articoli in ceramica',
          gameType: 'fortuna_italiana',
          active: true
        },
        {
          name: 'Osteria Toscana',
          logoUrl: null,
          description: 'Ristorante tradizionale toscano nel cuore di Montelupo.',
          link: 'https://osteriatoscana.it',
          tier: 'gold',
          prizeDescription: 'Cena per due persone con vino in omaggio',
          gameType: 'gioco_poesie',
          active: true
        },
        {
          name: 'Biblioteca Comunale',
          logoUrl: null,
          description: 'La biblioteca di Montelupo dedicata alla letteratura e alla poesia.',
          link: 'https://biblioteca-montelupo.it',
          tier: 'base',
          prizeDescription: 'Iscrizione annuale gratuita + 5 libri a scelta',
          gameType: 'gioco_poesie',
          active: true
        },
        {
          name: 'Galleria d\'Arte Moderna',
          logoUrl: null,
          description: 'Spazio dedicato all\'arte contemporanea e alle installazioni.',
          link: 'https://galleriaartemodern.it',
          tier: 'premium',
          prizeDescription: 'Biglietto doppio per mostra esclusiva + catalogo signed',
          gameType: 'tutti',
          active: true
        }
      ]
    });

    logger.info(`✅ Created ${sponsors.count} sponsors`);

    // Seed Poems
    const poems = await prisma.poem.createMany({
      data: [
        {
          title: 'Il Vasaio e la Terra',
          text: 'Le mani modellano l\'argilla come il tempo modella il cuore — ogni giro di ruota è un secolo che passa. Nelle crepe del forno, il fuoco sussurra storie di mani che non torneranno più. Montelupo sa di terra rossa e di vite scolpite nella ceramica.',
          author: 'Lorenzo Bini',
          thumbnailUrl: null,
          publishedDate: new Date('2025-12-15'),
          excerpt: 'Le mani modellano l\'argilla come il tempo modella il cuore — ogni giro di ruota è un secolo che passa...',
          active: true
        },
        {
          title: 'Arno al Tramonto',
          text: 'Il fiume porta via i pensieri pesanti, li affida all\'Arno come foglie d\'autunno che danzano verso il mare. Ogni goccia ricorda un volto, ogni onda un addio. Il tramonto dipinge l\'acqua di arancio, e per un momento, tutto è perdono.',
          author: 'Maria Gentili',
          thumbnailUrl: null,
          publishedDate: new Date('2025-11-20'),
          excerpt: 'Il fiume porta via i pensieri pesanti, li affida all\'Arno come foglie d\'autunno che danzano verso il mare...',
          active: true
        },
        {
          title: 'Ceramica e Stelle',
          text: 'Dipingo il cielo sulla terracotta, e la notte diventa un\'urna che conserva i sogni dei dormienti. Ogni stella è una mano che ha toccato l\'argilla, ogni costellazione una famiglia di vasai. Nel silenzio del forno, le stelle prendono forma.',
          author: 'Paolo Rossi',
          thumbnailUrl: null,
          publishedDate: new Date('2025-10-10'),
          excerpt: 'Dipingo il cielo sulla terracotta, e la notte diventa un\'urna che conserva i sogni dei dormienti...',
          active: true
        },
        {
          title: 'Montelupo Ricorda',
          text: 'La città ricorda nelle sue vie il suono dei torni, il respiro dei forni. Ogni casa è stata ceramica, ogni volto ha il segno dell\'argilla. Qui, il tempo non passa—si sedimenta, si cuoce, si trasforma in bellezza.',
          author: 'Anna Rossi',
          thumbnailUrl: null,
          publishedDate: new Date('2025-09-05'),
          excerpt: 'La città ricorda nelle sue vie il suono dei torni, il respiro dei forni...',
          active: true
        }
      ]
    });

    logger.info(`✅ Created ${poems.count} poems`);

    // Seed Newsletter Subscribers
    const subscribers = await prisma.newsletterSubscriber.createMany({
      data: [
        { email: 'user1@example.com', active: true },
        { email: 'user2@example.com', active: true },
        { email: 'user3@example.com', active: false }
      ]
    });

    logger.info(`✅ Created ${subscribers.count} newsletter subscribers`);

    // Seed Admin
    await seedAdmins();

    logger.info('🎉 Database seeded successfully!');
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
