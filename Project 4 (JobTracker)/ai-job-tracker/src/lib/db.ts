import { JobApplication, StatusTimeline, Interview, ActivityLog, UserSettings, User, StatusType, PriorityType } from '../types';

const DB_NAME = 'AIJobTrackerDB';
const DB_VERSION = 2;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'username' });
      }

      if (!db.objectStoreNames.contains('applications')) {
        const appStore = db.createObjectStore('applications', { keyPath: 'id' });
        appStore.createIndex('userId', 'userId', { unique: false });
        appStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains('status_timeline')) {
        const timelineStore = db.createObjectStore('status_timeline', { keyPath: 'id' });
        timelineStore.createIndex('applicationId', 'applicationId', { unique: false });
      }

      if (!db.objectStoreNames.contains('interviews')) {
        const interviewStore = db.createObjectStore('interviews', { keyPath: 'id' });
        interviewStore.createIndex('applicationId', 'applicationId', { unique: false });
      }

      if (!db.objectStoreNames.contains('activity_log')) {
        const logStore = db.createObjectStore('activity_log', { keyPath: 'id' });
        logStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'userId' });
      }
    };
  });
}

// Helper to execute transactions
function getStore(storeName: string, mode: IDBTransactionMode): Promise<{ store: IDBObjectStore, transaction: IDBTransaction }> {
  return initDB().then((db) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    return { store, transaction };
  });
}

// User Auth Operations
export function dbCreateUser(username: string, email: string, fullName: string): Promise<User> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('users', 'readwrite');
      const user: User = {
        username: username.toLowerCase().trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        createdAt: new Date().toISOString(),
      };
      const request = store.add(user);
      request.onsuccess = () => {
        // Also create default settings
        dbSaveSettings({
          userId: user.username,
          darkMode: false,
          monthlyGoal: 10,
        }).then(() => {
          dbAddActivity(user.username, 'Created account & configured default profile settings', undefined);
          resolve(user);
        });
      };
      request.onerror = () => {
        reject(new Error('Username already exists'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

export function dbGetUser(username: string): Promise<User | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('users', 'readonly');
      const request = store.get(username.toLowerCase().trim());
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Applications Operations
export function dbGetApplications(userId: string): Promise<JobApplication[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('applications', 'readonly');
      const index = store.index('userId');
      const request = index.getAll(userId);
      request.onsuccess = () => {
        const list = request.result || [];
        // Sort by appliedDate descending, then updatedAt descending
        list.sort((a, b) => {
          const dateA = new Date(a.appliedDate).getTime();
          const dateB = new Date(b.appliedDate).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbGetApplication(id: string): Promise<JobApplication | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('applications', 'readonly');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbSaveApplication(app: JobApplication): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('applications', 'readwrite');
      const request = store.put(app);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbDeleteApplication(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('applications', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Status Timeline Operations
export function dbAddTimelineEvent(eventId: string, applicationId: string, status: StatusType, changedAt: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('status_timeline', 'readwrite');
      const event: StatusTimeline = {
        id: eventId,
        applicationId,
        status,
        changedAt,
      };
      const request = store.put(event);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbGetTimeline(applicationId: string): Promise<StatusTimeline[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('status_timeline', 'readonly');
      const index = store.index('applicationId');
      const request = index.getAll(applicationId);
      request.onsuccess = () => {
        const list = request.result || [];
        list.sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Interviews Operations
export function dbSaveInterview(interview: Interview): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('interviews', 'readwrite');
      const request = store.put(interview);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbGetInterviewsForApp(applicationId: string): Promise<Interview[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('interviews', 'readonly');
      const index = store.index('applicationId');
      const request = index.getAll(applicationId);
      request.onsuccess = () => {
        const list = request.result || [];
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbGetAllInterviews(userId: string): Promise<(Interview & { company: string; role: string })[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const apps = await dbGetApplications(userId);
      const appMap = new Map(apps.map(a => [a.id, a]));
      
      const { store } = await getStore('interviews', 'readonly');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const list = (request.result || []) as Interview[];
        const filtered = list
          .filter(i => appMap.has(i.applicationId))
          .map(i => {
            const app = appMap.get(i.applicationId)!;
            return {
              ...i,
              company: app.company,
              role: app.role,
            };
          });
        // Sort by date then time
        filtered.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
          const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
          return dateA - dateB;
        });
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbDeleteInterview(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('interviews', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Activity Log Operations
export function dbAddActivity(userId: string, action: string, applicationId?: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('activity_log', 'readwrite');
      const log: ActivityLog = {
        id: crypto.randomUUID(),
        userId,
        applicationId,
        action,
        createdAt: new Date().toISOString(),
      };
      const request = store.add(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbGetActivityLog(userId: string): Promise<ActivityLog[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('activity_log', 'readonly');
      const index = store.index('userId');
      const request = index.getAll(userId);
      request.onsuccess = () => {
        const list = request.result || [];
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(list.slice(0, 50)); // limits of last 50 entries
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

// User Settings Operations
export function dbGetSettings(userId: string): Promise<UserSettings> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('settings', 'readonly');
      const request = store.get(userId);
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          resolve({
            userId,
            darkMode: false,
            monthlyGoal: 10,
          });
        }
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbSaveSettings(settings: UserSettings): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const { store } = await getStore('settings', 'readwrite');
      const request = store.put(settings);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

// 15 Sample Jobs Seeder
export async function seedSampleData(userId: string): Promise<void> {
  const samples: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
    {
      company: 'Google',
      role: 'Frontend Engineer',
      jdLink: 'https://careers.google.com/jobs',
      location: 'Mountain View, CA',
      salary: '$140,000 - $190,000',
      status: 'Interview',
      priority: 'Urgent',
      tags: ['React', 'TypeScript', 'Tailwind'],
      appliedDate: '2026-06-01',
      notes: 'Passed the initial HR screen. Preparing for technical phone round focusing on React rendering performance.',
      recruiter: 'Sarah Jenkins',
      source: 'LinkedIn',
      referral: 'John Doe (Senior UX)',
      applicationId: 'G-748239',
      resumeText: 'Frontend Specialist, expert in React, hooks, state management, build optimizations and high-fidelity layouts.',
      jdText: 'Google is looking for a Frontend Engineer with deep expertise in modern React frameworks, TypeScript, performance optimizations, and accessible designs.'
    },
    {
      company: 'Meta',
      role: 'Software Engineer - Product',
      jdLink: 'https://metacareers.com/jobs',
      location: 'Menlo Park, CA (Hybrid)',
      salary: '$165,000 - $220,000',
      status: 'Follow-up',
      priority: 'High',
      tags: ['React', 'REST APIs', 'System Design'],
      appliedDate: '2026-06-05',
      notes: 'Sent cold outreach on LinkedIn to engineering manager. Will follow up next Tuesday.',
      recruiter: 'Alex Mercer',
      source: 'Direct',
      applicationId: 'M-APP-093',
      resumeText: 'Full-stack software developer with rich experience in web standard technologies, REST endpoints, and interactive dashboard systems.',
      jdText: 'Develop end-to-end applications used by billions of users. Expertise is required in standard web APIs, UI scalability, and product-focused thinking.'
    },
    {
      company: 'Stripe',
      role: 'Full Stack Engineer',
      jdLink: 'https://stripe.com/jobs',
      location: 'Seattle, WA',
      salary: '$150,000 - $200,000',
      status: 'Wishlist',
      priority: 'High',
      tags: ['React', 'Node.js', 'PostgreSQL'],
      appliedDate: '2026-06-12',
      notes: 'Awesome financial APIs company. Networking with developers in their Seattle office.',
      source: 'GitHub Jobs',
      jdText: 'Stripe is seeking an engineer to build payment dashboard features. Requires sturdy knowledge of database transactions, background workers, and responsive React clients.'
    },
    {
      company: 'Netflix',
      role: 'Senior UI Engineer',
      jdLink: 'https://jobs.netflix.com',
      location: 'Los Gatos, CA',
      salary: '$280,000 - $350,000',
      status: 'Applied',
      priority: 'Medium',
      tags: ['React', 'Vite', 'GraphQL'],
      appliedDate: '2026-06-08',
      notes: 'Submitted resume online. Hoping to connect with hiring manager soon.',
      source: 'LinkedIn',
      applicationId: 'NFLX-8822',
    },
    {
      company: 'Airbnb',
      role: 'Staff Engineer - Experience Design',
      location: 'San Francisco, CA',
      salary: '$210,000 - $270,000',
      status: 'Rejected',
      priority: 'High',
      tags: ['Design Systems', 'React', 'Motion'],
      appliedDate: '2026-05-15',
      notes: 'Tough interview loop. Made it through 4 rounds. Got a sweet but disappointing rejection call due to team budget re-allocations.',
      recruiter: 'Mia Watson',
      source: 'Referral',
      applicationId: 'ABNB-0043',
    },
    {
      company: 'Apple',
      role: 'Interactive Developer',
      location: 'Cupertino, CA',
      salary: '$180,000 - $230,000',
      status: 'Offer',
      priority: 'Urgent',
      tags: ['WebGL', 'Web Graphics', 'Tailwind'],
      appliedDate: '2026-05-20',
      notes: 'Received written offer! $195k base + $50k RSUs. Negotiating starting bonus. Must respond by next Friday.',
      recruiter: 'David Cole',
      source: 'LinkedIn',
      applicationId: 'APL-OFFER-1',
    },
    {
      company: 'Vercel',
      role: 'Developer Relations Engineer',
      location: 'Remote (US)',
      salary: '$130,000 - $170,000',
      status: 'Interview',
      priority: 'High',
      tags: ['Next.js', 'React', 'Tailwind'],
      appliedDate: '2026-06-03',
      notes: 'Scheduled for presentation task on Next.js 15 Server Components. Scheduled for June 18th.',
      recruiter: 'Ines Ramos',
      source: 'Twitter/X',
      applicationId: 'VRC-DEVREL-98',
    },
    {
      company: 'Figma',
      role: 'Staff Systems Engineer',
      location: 'San Francisco, CA',
      salary: '$220,000 - $280,000',
      status: 'Wishlist',
      priority: 'Low',
      tags: ['WebAssembly', 'C++', 'React'],
      appliedDate: '2026-06-13',
      notes: 'Will submit application once I complete my custom WebAssembly demo.',
      source: 'Company Blog',
    },
    {
      company: 'Slack',
      role: 'Software Engineer, Channels UI',
      location: 'San Francisco, CA',
      salary: '$140,000 - $182,000',
      status: 'Applied',
      priority: 'Medium',
      tags: ['React', 'Redux', 'WebSockets'],
      appliedDate: '2026-06-10',
      notes: 'Standard application via job site.',
      source: 'Indeed',
    },
    {
      company: 'Linear',
      role: 'Product Engineer',
      location: 'Remote (Global)',
      salary: '$160,000 - $210,000',
      status: 'Wishlist',
      priority: 'High',
      tags: ['React', 'GraphQL', 'Tailwind'],
      appliedDate: '2026-06-13',
      notes: 'Highly synchronized desktop feel tracking app. Absolute dream tech stack and work culture. Reading design essays published by founders.',
      source: 'LinkedIn',
    },
    {
      company: 'Supabase',
      role: 'Database Integration Engineer',
      location: 'Remote',
      salary: '$120,000 - $160,000',
      status: 'Wishlist',
      priority: 'Medium',
      tags: ['PostgreSQL', 'TypeScript', 'Node.js'],
      appliedDate: '2026-06-12',
      notes: 'Firebase-alternative. Will build database plugins.',
      source: 'ProductHunt',
    },
    {
      company: 'OpenAI',
      role: 'Research Application UI Engineer',
      location: 'San Francisco, CA',
      salary: '$250,000 - $320,000',
      status: 'Applied',
      priority: 'High',
      tags: ['React', 'Vite', 'Python'],
      appliedDate: '2026-06-11',
      notes: 'Applied through external hiring portal. Matches my interest in building dynamic frontends for large models.',
      source: 'Direct',
    },
    {
      company: 'Anthropic',
      role: 'AI Interfaces Developer',
      location: 'San Francisco, CA',
      salary: '$220,000 - $310,000',
      status: 'Follow-up',
      priority: 'High',
      tags: ['TypeScript', 'Tailwind', 'AI SDKs'],
      appliedDate: '2026-06-04',
      notes: 'Passed the initial resume assessment. Emailed recruiter to schedule coordination chat.',
      recruiter: 'Lara Croft',
      source: 'LinkedIn',
    },
    {
      company: 'ByteDance',
      role: 'Interactive UI Developer',
      location: 'Los Angeles, CA',
      salary: '$150,000 - $195,000',
      status: 'Rejected',
      priority: 'Medium',
      tags: ['React', 'WebAudio', 'Canvas'],
      appliedDate: '2026-05-10',
      notes: 'Completed technical interview on binary search tree operations. Found another candidate with more matching domain experience.',
      source: 'Direct',
    },
    {
      company: 'Cloudflare',
      role: 'Edge Applications Developer',
      location: 'Austin, TX',
      salary: '$160,000 - $210,000',
      status: 'Interview',
      priority: 'High',
      tags: ['Workers', 'TypeScript', 'Rust'],
      appliedDate: '2026-06-02',
      notes: 'Completed round 1 interview with team lead. Moving to the live system design test next week.',
      recruiter: 'Nate Diaz',
      source: 'LinkedIn',
    }
  ];

  for (const s of samples) {
    const appId = crypto.randomUUID();
    const createdAt = new Date(new Date(s.appliedDate).getTime() + 10 * 3600 * 1000).toISOString();
    
    const fullApp: JobApplication = {
      ...s,
      id: appId,
      userId,
      createdAt,
      updatedAt: createdAt,
    };

    await dbSaveApplication(fullApp);

    // Add secondary info
    await dbAddTimelineEvent(crypto.randomUUID(), appId, 'Applied', createdAt);
    if (s.status !== 'Applied' && s.status !== 'Wishlist') {
      const offsetDays = s.status === 'Rejected' ? 14 : 7;
      const statusDate = new Date(new Date(s.appliedDate).getTime() + offsetDays * 24 * 3600 * 1000).toISOString();
      await dbAddTimelineEvent(crypto.randomUUID(), appId, s.status, statusDate);
    }

    // Add Interview if appropriate
    if (s.status === 'Interview') {
      const daysAhead = s.company === 'Google' ? 4 : 5;
      const interviewDate = new Date(Date.now() + daysAhead * 24 * 3600 * 1000).toISOString().split('T')[0];
      await dbSaveInterview({
        id: crypto.randomUUID(),
        applicationId: appId,
        date: interviewDate,
        time: '14:00',
        mode: s.company === 'Google' ? 'Google Meet' : 'Zoom',
        link: s.company === 'Google' ? 'https://meet.google.com/abc-defg-hij' : 'https://zoom.us/j/90812374',
        interviewer: s.recruiter || 'Hiring Director',
        round: s.company === 'Google' ? 'Technical' : 'Manager',
      });
    }
  }

  await dbAddActivity(userId, 'Seeded profile with 15 rich, production-quality sample applications', undefined);
}
