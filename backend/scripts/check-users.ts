import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  for (const email of ['admin@tzw.com', 'inspector@tzw.com', 'user@tzw.com']) {
    const u = await prisma.user.findUnique({ where: { email } });
    const pwd = u ? await bcrypt.compare('Password1', u.passwordHash) : false;
    console.log(email, { verified: u?.emailVerified, pwdOk: pwd });
  }
}

main().finally(() => prisma.$disconnect());
