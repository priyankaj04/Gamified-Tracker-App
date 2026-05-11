import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler, ok } from '@/middleware/errorHandler';
import { gameRouter } from '@/routes/game';
import { workoutsRouter } from '@/routes/workouts';
import { projectsRouter } from '@/routes/projects';
import { sessionsRouter } from '@/routes/sessions';
import { weightRouter } from '@/routes/weight';
import { financeRouter } from '@/routes/finance';
import { questsRouter } from '@/routes/quests';
import { badgesRouter } from '@/routes/badges';
import { challengesRouter } from '@/routes/challenges';
import { exercisesRouter } from '@/routes/exercises';
import { templatesRouter } from '@/routes/templates';
import { routinesRouter } from '@/routes/routines';
import { cardioRouter } from '@/routes/cardio';
import { restRouter } from '@/routes/rest';
import { settingsRouter } from '@/routes/settings';
import { exportRouter } from '@/routes/export';
import { recoveryRouter } from '@/routes/recovery';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

const sbUrl = process.env.SUPABASE_URL ?? '';
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!sbUrl || sbUrl.includes('your-project-ref') || !sbKey || sbKey.includes('your-service-role-key')) {
  console.warn('⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured in api/.env');
  console.warn('   API will start but every DB call will fail. Fill in real values from Supabase → Project Settings → API.');
}

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (_req, res) => ok(res, { status: 'ok', uptime: process.uptime() }));

app.use('/api/game', gameRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/weight', weightRouter);
app.use('/api/finance', financeRouter);
app.use('/api/quests', questsRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/routines', routinesRouter);
app.use('/api/cardio', cardioRouter);
app.use('/api/rest', restRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/export', exportRouter);
app.use('/api/recovery', recoveryRouter);

app.use((_req, res) => res.status(404).json({ data: null, error: 'Not found' }));
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ KaizenArc API listening on http://0.0.0.0:${PORT} (LAN-accessible)`);
  console.log(`   Module routes mounted under /api`);
});
