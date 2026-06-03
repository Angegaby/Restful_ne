import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, () => {
  console.log(`FEMS API running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
  const smtpOk =
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASSWORD?.trim();
  console.log(smtpOk ? 'SMTP: configured' : 'SMTP: not configured — check backend/.env');
});
